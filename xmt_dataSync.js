const { np, prod, xm } = require("./config");
const { userDefaults, deviceDefaults, sourceSettings } = require("./dataSync_defaultConfig");
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
// np or prod
const env = prod;
const { licenseLimitUsers, minUsersInputFile, resultsApiPath } = env;

// Set what you would like to sync.
// Datasync allows for People and Devices together, Groups and groupMembers
// You cannot sync Devices without People.
const syncOptions = {
  people: true,
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
    ],
  },
  peopleFilter: (p) => p.externalKey && p.externalKey.startsWith(userDefaults.externalKeyPrefix),
  devices: true,
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
  mirror: true,
};
//#endregion Configuration

//#region rundatasync
// Starts the batch sync when this file is run
// This section will use configuration above to determine what should sync to xMatters.
// Reads a json file
(async () => {
  // Determine what to sync
  const syncWhat = [];
  syncOptions.hasOwnProperty("people") ? syncWhat.push("people") : "";
  syncOptions.hasOwnProperty("groups") ? syncWhat.push("groups") : "";
  syncOptions.hasOwnProperty("groupMembers") ? syncWhat.push("groupMembers") : "";

  // Read the data file so it can be synced to xMatters
  // const personsJson = syncWhat.includes("people")
  //   ? await fs.readFileSync(sourceSettings.people.extract, "utf-8")
  //   : "";
  const personsJson = syncWhat.includes("people")
  ? await xm.util.CsvToJsonFromFile(sourceSettings.people.extract)
  : "";
  console.log(personsJson);

  // Verify contents of file
  const numEntries_Users = personsJson.length;
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
    const { people, devices, emailAddressErrors, phoneNumberErrors } = syncOptions.hasOwnProperty("people")
      ? await configPerson(syncOptions.hasOwnProperty("devices"), personsJson)
      : [];
    const data = { people, devices };
    var deviceErrors_email = emailAddressErrors ? emailAddressErrors : "";
    var deviceErrors_phone = phoneNumberErrors ? phoneNumberErrors : "";

    // Start data sync to xMatters using xMtoolbox DataToxMatters function
    console.log("Starting Sync");
    const startTime = moment();
    var {
      syncResults,
      syncResults: { failure },
    } = await xm.sync.DataToxMatters(data, env, syncOptions);

    var errors = env.errors.map((e) => e.message);
    var info = env.output;
    var results = [];
    Object.keys(syncResults).map((objectName) => {
      Object.keys(syncResults[objectName]).map((operation) => {
        const count = syncResults[objectName][operation].length;
        if (operation !== "remove") results.push(`${objectName} ${operation}: ${count}`);
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
    recipients: ["xMatters Sync Group"],
    subject: `${failure ? "FAILURE |" : "SUCCESS |"} xMatters Sync Results`,
  });
})();
//#endregion rundatasync

//#region syncPerson
async function configPerson(syncDevices, personJson) {
  console.log("Setting up Person Data");
  var devices = [];
  const people = [];
  var emailAddressErrors = [];
  var phoneNumberErrors = [];
  
  personJson.map((record) => {
    var webLoginValue = userDefaults.webLogin;
    // Map personJson record to xMatters property names
    var {
      User: targetName,
      "First Name": firstName,
      "Last Name" : lastName,
      Site: siteName,
      "Externally Owned" : externallyOwned,
      "Work Phone": workPhone,
      "Mobile Phone": mobilePhone,
      "Work Email": email,
    } = record;

    // Translations
    // Add custom properties to custom fields in xMatters
    // Configure these in dataSync_defaultConfig.js
    let properties = undefined;
    if (userDefaults.customProperties.length > 0) {
      properties = {};
      userDefaults.customProperties.forEach(({ xmattersName, customProp }) => {
        properties[xmattersName] = record[customProp];
      });
    }

    // User language
    const language = userDefaults.fallbackLanguage;

    // User site
    let userSiteName = siteName != undefined ? siteName : userDefaults.siteName;

    // Set webLogin to desired value from config
    let webLogin = record[userDefaults.webLogin];
    
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
          `${firstName} ${lastName} | ${targetName} | Work Phone | ${record.BusinessPhone_cd}`
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
          `${firstName} ${lastName} | ${targetName} | Mobile Phone | ${record.MobilePhone_cd}`
        );
        mobile = null;
      }
    }

    // Verify Work Phone and Mobile Phone are unique
    if (work && mobile && work == mobile) {
      work = null;
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
      default: {
        roles: userDefaults.defaultRoles,
        supervisors: userDefaults.personSupervisors,
        timezone: userDefaults.defaultTimeZone,
      },
    };

    // Add person to the array of people
    people.push(person);

    if (syncDevices) {
      // Get device for this itteration
      let deviceConfig = { work, mobile, email };
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
  }); // Close personJson map
  // Filter invalid devices
  devices = devices.filter((d) => d.phoneNumber || d.emailAddress);

  // Write email and phone error files
  const emailAddressErrors_join = emailAddressErrors.join("\n");
  const phoneNumberErrors_join = phoneNumberErrors.join("\n");
  await fs.writeFileSync("./dataSync_output/emailErrors.txt", emailAddressErrors_join);
  await fs.writeFileSync("./dataSync_output/phoneErrors.txt", phoneNumberErrors_join);

  return { people, devices, emailAddressErrors, phoneNumberErrors };
}
//#endregion syncPerson

//#region configGroups
async function configGroups(json) {
  console.log("Setting up Group Data");
  const groups = json.map((record) => {
    // Map json record to xMatters property names
    const {
      Status: groupStatus,
      Company: company,
      "Support Organization": organization,
      "Support Group Name": name,
      "Support Group ID": groupId,
      Description: description,
    } = record;

    // Translations
    // const targetName = groupDefaults.simpleName ? name : company + "*" + organization + "*" + name;
    // const status = groupStatus === "Enabled" ? "ACTIVE" : "INACTIVE";

    // Map group objects
    return {
      targetName,
      description,
      status,
      supervisors: groupDefaults.groupSupervisors,
      observedByAll: groupDefaults.observedByAll,
      observers: groupDefaults.observers,
      externalKey: groupDefaults.externalKeyPrefix + groupId,
      externallyOwned: groupDefaults.externallyOwned,
      useDefaultDevices: groupDefaults.useDefaultDevices,
      allowDuplicates: groupDefaults.allowDuplicates,
    };
  });
  return groups;
}
//#endregion configGroups

//#region configMembers
async function configMembers(json, peopleJson, groupsJson) {
  console.log("Setting up Member Data");
  let groupMembers = [];
  json.map((record) => {
    // Map json record to xMatters property names
    const { "Support Group ID": group, "Person ID": personId, "Login ID": id } = record;

    // Filter memebr in group that is not part of groups extract. This is also used to get missing member group info
    const relatedPerson = peopleJson.find((o) => o["Person ID"] === personId);
    // Filter members who are not part of user extract
    const relatedGroup = groupsJson.find((o) => o["Support Group ID"] === group);

    // Only add member if they are part of a group in the group extract
    if (relatedGroup && relatedPerson) {
      // Translations
      const name = relatedGroup["Support Group Name"];
      const company = relatedGroup["Company"];
      const organization = relatedGroup["Support Organization"];
      // Combine name, company and organization
      const groupName = groupDefaults.simpleName ? name : company + "*" + organization + "*" + name;

      const member = {
        member: id,
        group: groupName,
      };

      // Add the member to the array of members.
      groupMembers.push(member);
    }
  });

  return groupMembers;
}
//#endregion configMembers
