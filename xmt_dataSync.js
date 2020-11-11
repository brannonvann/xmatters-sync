#!/usr/bin/env node
const { prod, xm, syncDefaults, userDefaults, deviceDefaults, groupDefaults, siteDefaults, sourceSettings } = require("./config");
const fs = require("fs"); // Used to save files to disk
const emailValidator = require("email-validator");
const phoneValidator = require("awesome-phonenumber");
const moment = require("moment");

//#region instructions
/* To run batch sync enter terminal command: "node xmt_dataSync.js"
 * WARNING: Running this script will immediately run the batch sync to xMatters.
 */
//#endregion instructions

//#region Configuration
const env = prod;
const { licenseLimitUsers, minUsersInputFile, resultsApiPath } = env;

// Set what you would like to sync.
// Datasync allows for People and Devices together, Groups and groupMembers
// You cannot sync Devices without People.
const syncOptions = {
  people: (process.env.USERS == 'true'),
  peopleOptions: {
    embed: "roles",
    fields: [
      "externalKey",
      "externallyOwned",
      "firstName",
      "language",
      "lastName",
      "site",
      "targetName",
      "webLogin",
      "properties",
      "roles",
      "supervisors"
    ],
  },
  peopleFilter: (p => (p.externalKey && p.externalKey.startsWith(userDefaults.externalKeyPrefix && p.properties.shouldSync == true)) || p.properties.shouldSync == true),
  //peopleFilter: (p => p.properties.shouldSync == true),
  devices: (process.env.DEVICES == 'true'),
  devicesOptions: {
    fields: [
      "deviceType",
      "emailAddress",
      "externalKey",
      "externallyOwned",
      "name",
      "owner",
      "targetName",
      "phoneNumber",
    ],
  },
  devicesFilter: (d) => d.externalKey && d.externalKey.startsWith(userDefaults.externalKeyPrefix),
  groups: (process.env.GROUPS == 'true'),
  groupsOptions: {
    fields: [
      "externalKey",
      "externallyOwned",
      "targetName",
      "description",
      "allowDuplicates",
      "useDefaultDevices",
      "observedByAll",
      "status",
      "supervisors"
    ],
  },
  groupsFilter: (g) => g.externalKey && g.externalKey.startsWith(groupDefaults.externalKeyPrefix),
  groupMembers: (process.env.MEMBERS == 'true'),
  groupMembersOptions: {
    fields: [
      "group",
      "member",
    ],
  },
  sites: true,
  mirror: true,
};
//#endregion Configuration

//#region rundatasync
// Starts the batch sync when this file is run
// This section will use configuration above to determine what should sync to xMatters.
(async () => {
  // Take backup of environment if specified
  if(syncDefaults.shouldBackup === 'true'){
    await runBackup();
  }

  // Read the data file so it can be synced to xMatters
  // people + devices
  const personsJson = syncOptions.people == true
  ? await xm.util.CsvToJsonFromFile(sourceSettings.people.extract)
  : "";
  
  // groups + groupMembers
  const groupsJson = syncOptions.groups == true
  ? await xm.util.CsvToJsonFromFile(sourceSettings.groups.extract)
  : "";

  // Verify contents of file
  const numEntries_Users = personsJson.length - 1;
  if (numEntries_Users > licenseLimitUsers) {
    failure = true;
    var msgStopped = `Stopping Sync. User Input file contains more users (${numEntries_Users}) than xMatters environment license limit (${licenseLimitUsers}).`;
    console.log(msgStopped);
  } else if (numEntries_Users < minUsersInputFile) {
    failure = true;
    var msgStopped = `Stopping Sync. User Input file contains less users (${numEntries_Users}) than minimum required in mirror mode (${minUsersInputFile}).`;
    console.log(msgStopped);
  } else {
    // Generate data to sync using xMtoolbox DataToxMatters function
    const { people, devices, siteNames, emailAddressErrors, phoneNumberErrors } = syncOptions.people == true
      ? await configPerson(syncOptions.devices == true, personsJson)
      : [];

    const groups = syncOptions.groups == true
    ? await configGroups(groupsJson)
    : [];

    const groupMembers = syncOptions.groupMembers == true
    ? await configMembers(groupsJson)
    : [];

    const sites = syncOptions.sites == true
    ? await configSites(siteNames)
    : [];

    const data = { people, devices, groups, groupMembers, sites};
    var deviceErrors_email = emailAddressErrors ? emailAddressErrors : "";
    var deviceErrors_phone = phoneNumberErrors ? phoneNumberErrors : "";

    // Start data sync to xMatters using xMtoolbox DataToxMatters function
    console.log("Starting Sync");
    const startTime = moment();
    var {
      syncResults,
      syncResults: { failure },
    } = await xm.sync.DataToxMatters(data, env, syncOptions);

    // Setup data for workflow report - TODO: move to new function?
    var errors = env.errors.map((e) => e.message);
    var info = env.output;
    var results = [];
    var peopleCreated = '';
	  var peopleDeleted = '';
    Object.keys(syncResults).map((objectName) => {
      Object.keys(syncResults[objectName]).map((operation) => {
        const count = syncResults[objectName][operation].length;
        if (operation !== "remove") results.push(`${objectName} ${operation}: ${count}`);
        let nameArray = [];
        let someArray = syncResults[objectName][operation];

        // Make up two lists showing User IDs of all people created or deleted
        if (objectName == 'people' && operation.match(/created|deleted/)) {
          for (let i = 0; i < someArray.length; i++) {
            let usr = someArray[i];
            //console.log('Usr ' + JSON.stringify(usr));
            if (someArray[i].targetName) {
              nameArray.push(someArray[i].targetName)
            }
          }

          if (operation == 'deleted') {
            peopleCreated = nameArray.join(', ');
          }
          if (operation == 'created') {
            peopleDeleted = nameArray.join(', ');
          }
        }
      });
    });
    const endTime = moment();
    console.log(endTime.format());
    results.push(`Started: ${startTime}`);
    results.push(`Ended: ${endTime}`);
    results.push(`Duration: ${moment(endTime).diff(startTime, "seconds")}s`);
    console.log(`Duration: ${moment(endTime).diff(startTime, "seconds")}s`);
  }
  // Set xMatters Flow API
  const api = resultsApiPath;

  //POST to the Flow
  if (msgStopped) {
    var results = [];
    results.push(msgStopped);
  }
  xm.util.post(env, api, {
    errors,
    info,
    results,
    deviceErrors_email,
    deviceErrors_phone,
    peopleCreated, 
    peopleDeleted,
    subject: `${failure ? "FAILURE |" : "SUCCESS |"} xMatters Sync Results`,
  });
})();
//#endregion rundatasync

//#region syncPerson
async function configPerson(syncDevices, personJson) {
  console.log("Setting up Person Data");
  const people = [];
  var emailAddressErrors = [];
  var devices = [];
  var phoneNumberErrors = [];
  const siteNames = [];
  //filter out empty usernames
  personJson = personJson.filter(person => person.User !== '');
  // Mapping function - personJson record to xMatters property names w/translations where necessary
  const asyncRes = await Promise.all(personJson.map(async (record) => {
  // personJson.map((record) => {
    var {
      User: targetName,
      "First Name": firstName,
      "Last Name" : lastName,
      Site: siteName,
      "Externally Owned" : externallyOwned,
      "Work Phone": workPhone,
      "Mobile Phone": mobilePhone,
      "Work Email": email,
      "SMS Phone": smsPhone,
      Role: roles,
    } = record;
    
    // Translations
    // Add custom properties to custom fields in xMatters
    // Configure these in dataSync_defaultConfig.js
    let properties = undefined;
    if (userDefaults.properties.length > 0) {
      properties = {};
      userDefaults.properties.forEach(({ xmattersName, customProp }) => {
        properties[xmattersName] = record[customProp];
      });
    }
    properties.shouldSync = true;

    // User language
    const language = userDefaults.language;

    // User site
    let userSiteName = siteName != undefined ? siteName : userDefaults.siteName;

    // Add site name to array for site processing if unique
    if(!siteNames.includes(userSiteName)) siteNames.push(userSiteName);

    // Set webLogin to desired value from config
    let webLogin = record[userDefaults.webLoginProp];
    
    // Email devices pre-processing
    if (!emailValidator.validate(email)) {
      emailAddressErrors.push(`${firstName} ${lastName} | ${targetName} | Work Email | ${email}`);
      email = null;
    }

    // Phone devices pre-processing
    let work = workPhone ? "+" + workPhone.replace(/\D+/g, "") : null;
    // Validate phone number format and, if phone extensions, append extension to business phone
    if (work) {
      if (!phoneValidator(work).isValid()) {
        // Push errors to report and set number to null
        phoneNumberErrors.push(
          `${firstName} ${lastName} | ${targetName} | Work Phone | ${record["Work Phone"]}`
        );
        work = null;
      } else {
        if (deviceDefaults.phoneExtensions) {
          let ext = extension ? ";ext=" + extension.replace(/\D+/g, "") : "";
          work += ext;
        }
      }
    }
    let mobile = mobilePhone ? "+" + mobilePhone.replace(/\D+/g, "") : null;
    // Validate phone number format
    if (mobile) {
      if (!phoneValidator(mobile).isValid()) {
        // Push errors to report and set number to null
        phoneNumberErrors.push(
          `${firstName} ${lastName} | ${targetName} | Mobile Phone | ${record["Mobile Phone"]}`
        );
        mobile = null;
      }
    }

    let sms = smsPhone ? "+" + smsPhone.replace(/\D+/g, "") : null;
    // Validate phone number format
    if (sms) {
      if (!phoneValidator(sms).isValid()) {
        // Push errors to report and set number to null
        phoneNumberErrors.push(
          `${firstName} ${lastName} | ${targetName} | SMS Phone | ${record["SMS Phone"]}`
        );
        sms = null;
      }
    }

    // Verify Work Phone and Mobile Phone are unique
    if (work && mobile && work == mobile) {
      work = null;
    }

    // transform roles, or if empty take roles from user currently, or if empty + user not in xm take defaults
    if(roles){
      roles = roles.split("|");
      // get user from xm + combine roles
    } else {
      try {
        var xmuser = await xm.people.get(env, targetName, { embed: 'roles' }, true);
        roles = [];
      } catch (error) {
        roles = userDefaults.roles;
      }
      if(xmuser){
        xmuser.roles.data.forEach(x => roles.push(x.name));
      }
    }
 
    // Map person object
    const person = {
      firstName,
      lastName,
      targetName,
      webLogin,
      language,
      properties: properties,
      site: userSiteName,
      externalKey: userDefaults.externalKeyPrefix + targetName,
      externallyOwned,
      roles,
      supervisors: userDefaults.supervisors,
    };

    // Add person to the array of people
    if(!people.some(x=>x.targetName === targetName)){
      people.push(person);
    }

    if (syncDevices) {
      // Get device for this itteration
      let deviceConfig = { work, mobile, email, sms };
      deviceDefaults.syncDevices.forEach((device) => {
        var { name, deviceType, delay, sequence, priorityThreshold, externallyOwned } = device;
        var newDevice = {};
        newDevice.name = name;
        newDevice.deviceType = deviceType;
        newDevice.externallyOwned = externallyOwned;
        newDevice.externalKey = `${userDefaults.externalKeyPrefix}${targetName}|${name}`;
        newDevice.owner = targetName;
        newDevice.targetName = `${targetName}|${name}`;
        delay ? (newDevice.delay = delay) : null;
        sequence ? (newDevice.sequence = sequence) : null;
        priorityThreshold ? (newDevice.priorityThreshold = priorityThreshold) : null;

        if (newDevice.deviceType === "EMAIL") {
          newDevice.emailAddress = deviceConfig[device.accessor];
          if (deviceConfig[device.accessor]) {
            devices.push(newDevice);
          }
        } else if (newDevice.deviceType === "TEXT_PHONE" || newDevice.deviceType === "VOICE") {
          newDevice.phoneNumber = deviceConfig[device.accessor];
          if (deviceConfig[device.accessor]) {
            devices.push(newDevice);
          }
        }
      });
    } // Close syncDevices
  })); // Close personJson map
  // Filter invalid devices
  devices = devices.filter((d) => d.phoneNumber || d.emailAddress);

  // Write email and phone error files
  const emailAddressErrors_join = emailAddressErrors.join("\n");
  const phoneNumberErrors_join = phoneNumberErrors.join("\n");
  await fs.writeFileSync("./sync_output/emailErrors.txt", emailAddressErrors_join);
  await fs.writeFileSync("./sync_output/phoneErrors.txt", phoneNumberErrors_join);

  return { people, devices, siteNames, emailAddressErrors, phoneNumberErrors };
}
//#endregion syncPerson

//#region configGroups
async function configGroups(json) {
  console.log("Setting up Group Data");
  const groups = json.map((record) => {
    // Map json record to xMatters property names
    var {
      Name: targetName,
      Description: description,
      Supervisors: supervisors
    } = record;

    supervisors = supervisors ? supervisors.split("|") : groupDefaults.supervisors;

    // Map group objects
    return {
      targetName,
      description,
      recipientType: 'GROUP',
      status: groupDefaults.status,
      supervisors,
      observedByAll: groupDefaults.observedByAll,
      //observers: groupDefaults.observers,
      externalKey: groupDefaults.externalKeyPrefix + targetName,
      externallyOwned: groupDefaults.externallyOwned,
      useDefaultDevices: groupDefaults.useDefaultDevices,
      allowDuplicates: groupDefaults.allowDuplicates,
    };
  });
  return groups;
}
//#endregion configGroups

//#region configMembers
async function configMembers(groupsJson) {
  console.log("Setting up Member Data");
  let groupMembers = [];
  groupsJson.map((record) => {
    // Map json record to xMatters property names
    var { "Name": group, "Members": members, } = record;
    members = members.split("|");
    members.forEach((member) => {
      var groupMember = {
        member,
        group
      };
      groupMembers.push(groupMember);
    });
  });

  return groupMembers;
}
//#endregion configMembers

//#region configSites
async function configSites(siteNames){
  const sites = [];
  console.log("Setting up Site Data");
  const asyncRes = await Promise.all(siteNames.map(async site => {
    var site = {
      name: site,
      country: siteDefaults.country,
      language: siteDefaults.language,
      timezone: siteDefaults.timezone,
      status: siteDefaults.status
    }
    if(!sites.some(s => s.name === site.name)){
      try {
        var xmsite = await xm.sites.get(env, site.name, {}, true);
      } catch (error) {
        sites.push(site);
      }
      // var xmsite = xm.site.get(env, userSiteName, {}, true);
      if(xmsite){
        site.name = xmsite.name;
        site.country = xmsite.country;
        site.language = xmsite.language;
        site.timezone = xmsite.timezone;
      }
      if(!sites.some(s => s.name === site.name)){
        sites.push(site);
      }
    }
  }));
  return sites;
}
//#endregion configSites

//#region backup
async function runBackup(){
  const extractOptions = {
    groups: true,
    people: true,
    shifts: true,
    sites: true,
  };
  
  const path = `./data/${prod.subdomain}.all.json`;
  const data = await xm.sync.ExtractData(prod, extractOptions);
  const text = JSON.stringify(data, null, 2);
  fs.writeFileSync(path, text);
  console.log("Backup file created at " + path);
}
//#endregion backup