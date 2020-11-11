#!/usr/bin/env node
const xm = require("xmtoolbox");
const env = require('dotenv').config();
const fs = require('fs')

//Set credentials environment variables or in this file by replaceing the examples below.
//Defaults to using environment variables if they are set.
// Create a .env file in the same directory as the project and set the environment variables there for them to be used below
const PROD_SUBDOMAIN = process.env.PROD_SUBDOMAIN || ""; //company from url--> https://company.xmatters.com
const PROD_USERNAME = process.env.PROD_USERNAME || ""; // user must have REST Web Service role
const PROD_PASSWORD = process.env.PROD_PASSWORD || "";

exports.xm = xm;

const prod = xm.environments.create(PROD_SUBDOMAIN, PROD_USERNAME, PROD_PASSWORD, {
  logLevel: "debug",
  readOnly: false,
});

prod.licenseLimitUsers = parseInt(process.env.LICENSELIMIT) || 200;
prod.minUsersInputFile = parseInt(process.env.MIN_USERS) || 2;
prod.resultsApiPath =
  "/api/integration/1/functions/3f0cfd2b-e004-4c93-8509-8d23660699fc/triggers?apiKey=83b395db-8023-4cbb-a391-87e9720d9bcd";

exports.prod = prod;

/**
 * General Sync Options
 * @constant {string} shouldBackup Whether or not to run a backup of xMatters environment before syncing data
 */
exports.syncDefaults = {
  shouldBackup: process.env.SHOULD_BACKUP,
};

/**
 * xMatters User Default Options Configuration
 * @constant {boolean} externallyOwned Whether synced users should be externally owned.
 * @constant {string} externalKeyPrefix A prefix added to xMatters externalKey.
 * @constant {string} language Language to set on user record if no property defined for language 
 * @constant {array} properties Array of Objects containing customer data field name and the equivalent field in xMatters.
 *                              Used for syncing custom user properties to xMatters.
 * @constant {array} roles Array of xMatters roles to apply to users if not set in CSV
 * @constant {array} supervisors Array of targetNames of to apply as supervisors if not set in CSV
 * @constant {string} siteName Default xMatters Site Name (targetName)
 * @constant {string} timezone String specifying default timezone for users
 *                             Follow this standard for timezzone names: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @constant {string} webLoginProp set this to the name of a CSV column to use as Web Login ID in xMatters
 */
exports.userDefaults = {
  externallyOwned: true,
  externalKeyPrefix: "XMT-",
  language: "en",
  properties: [ // map custom property names - uncomment the shouldSync property if adopting local users
    { xmattersName: "shouldSync", customProp: "shouldSync" },
  ],
  siteName: "Default Site",
  supervisors: ["personadmin"], // 
  roles: ["Standard User"],
  timezone: "US/Eastern",
  webLoginProp: "User", 
};

/**
 * xMatters Devices Default Configuration
 * @constant {string} phoneExtensions Whether your xMatters is configured to accept phone extensions
 * @constant {array} syncDevices An Array of xMatters Devices Objects. Object elements described below.
 * @constant {string} syncDevices.name xMatters Device Name
 * @constant {string} syncDevices.deviceType xMatters Device Type
 * @constant {boolean} syncDevices.externallyOwned Whether the device should be externally owned
 * @constant {string} syncDevices.emailAddress Required for devices of type "EMAIL". Should be an empty string, do not include a value.
 * @constant {string} syncDevices.phoneNumber Required for devices of type "VOICE". Should be an empty string, do not include a value.
 * @constant {string} syncDevices.accessor TELLS THE SCRIPT LATER
 * VVVV============ OPTIONAL ================VVVV
 * @constant {string} syncDevices.delay Delay in minutes to go after the related device
 * @constant {string} syncDevices.sequence Determines device order.
 * @constant {string} syncDevices.priorityThreshold The priority threshold of the device. HIGH, MEDIUM, LOW
 */

exports.deviceDefaults = {
  phoneExtensions: false,
  syncDevices: [
    {
      name: "Work Email",
      deviceType: "EMAIL",
      externallyOwned: true,
      emailAddress: "",
      accessor: "email", // *Required
      /*
      delay: 0,                      // Optional
      sequence: 1,                   // Optional
      priorityThreshold: "HIGH",     // Optional
      */
    },
    {
      name: "SMS Phone",
      deviceType: "TEXT_PHONE",
      externallyOwned: false,
      phoneNumber: "",
      accessor: "sms",
      /*
      delay: 3,
      sequence: 2,
      priorityThreshold: "MEDIUM",
      */
    },
    {
      name: "Mobile Phone",
      deviceType: "VOICE",
      externallyOwned: false,
      phoneNumber: "",
      accessor: "mobile",
      /*
      delay: 5,
      sequence: 3,
      priorityThreshold: "MEDIUM",
      */
    },
    {
      name: "Work Phone",
      deviceType: "VOICE",
      externallyOwned: false,
      phoneNumber: "",
      accessor: "work",
      /*
      delay: 5,
      sequence: 4,
      priorityThreshold: "MEDIUM",
      */
    },
  ],
};

/**
 * xMatters Groups Default Configuration
 * @constant {boolean} allowDuplicates See https://help.xmatters.com/xmapi/index.html#create-a-group for description
 * @constant {string} externalKeyPrefix A prefix added to xMatters externalKey.
 * @constant {boolean} externallyOwned Whether synced groups should be externally owned.
 * @constant {boolean} observedByAll See https://help.xmatters.com/xmapi/index.html#create-a-group for description
 * @constant {string} status ACTIVE or INACTIVE
 * @constant {string} supervisors target name(s) of users. multiple users - delimit with a pipe (|)
 * @constant {boolean} userDefaultDevices See https://help.xmatters.com/xmapi/index.html#create-a-group for description
 */
exports.groupDefaults = {
  allowDuplicates: true,
  externalKeyPrefix: "XMT-",
  externallyOwned: true,
  observedByAll: true,
  status: "ACTIVE",
  //supervisors: "",
  useDefaultDevices: true,
};

/**
 * xMatters Site Default Configuration
 * @constant {string} timezone See https://help.xmatters.com/xmapi/index.html#create-a-site for description
 * @constant {string} country See https://help.xmatters.com/xmapi/index.html#create-a-site for description
 * @constant {string} language See https://help.xmatters.com/xmapi/index.html#create-a-site for description
 * @constant {string} status See https://help.xmatters.com/xmapi/index.html#create-a-site for description
 */
exports.siteDefaults = {
  timezone: "US/Eastern",
  country: "USA",
  language: "en",
  status: "ACTIVE"
};

/** 
* Path to input files
*
*/
exports.sourceSettings = {
  people: {
    extract: "./sync_input/User_Input.csv",
  },
  groups: {
    extract: "./sync_input/Group_Input.csv"
  },
  shifts: {
    extract: "./sync_input/Shift_Input.csv"
  },
};