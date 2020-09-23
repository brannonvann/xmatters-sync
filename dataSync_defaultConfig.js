/**
 * xMatters Configuration
 * @constant {string} siteName Default xMatters Site Name (targetName)
 * @constant {string} fallbackLanguage Language to set on user record if no property defined for language
 * @constant {array} defaultRoles Array of xMatters roles to apply to new users
 * @constant {string} defaultTimeZone Default timezone to apply to new users
 * @constant {string} personSupervisors UUID of the xMatters user to apply as the person supervisor for all users. Must be a UUID.
 * @constant {array} customProperties Array of Objects containing customer data field name and the equivalent field in xMatters.
 *                                    Used for syncing custom user properties to xMatters.
 * @constant {string} externalKeyPrefix A prefix added to xMatters externalKey.
 * @constant {boolean} externallyOwned Whether synced users should be externally owned.
 */
exports.userDefaults = {
  defaultRoles: ["Standard User"],
  defaultTimeZone: "US/Eastern",
  externalKeyPrefix: "XMT-",
  externallyOwned: true,
  fallbackLanguage: "en",
  webLoginProp: "User", //set to Work Email, User, or any other custom property name from csv file
  personSupervisors: [], // Must be a uuid due to api limitations
  siteName: "Default Site",
  customProperties: [ // map custom property names - examples below
    // { xmattersName: "Manager", customProp: "ManagerName" },
    // { xmattersName: "Department", customProp: "DepartmentName" },
    // { xmattersName: "Job Name", customProp: "JobName" },
    // { xmattersName: "City", customProp: "City" },
    // { xmattersName: "State", customProp: "StateCode" },
    // { xmattersName: "Zip Code", customProp: "PostalCode" },
  ],
};

/**
 * xMatters Devices Configuration
 * @constant {string} phoneExtensions Whether your xMatters is configured to accept phone extensions
 * @constant {array} syncDevices An Array of xMatters Devices Objects. Object elements described below.
 *
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
      externallyOwned: false,
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
 * xMatters Groups Configuration
 * 
 */
exports.groupDefaults = {
  //supervisors: "", //place target name(s) of users. multiple users - delimit with a pipe (|)
  externalKeyPrefix: "XMT-",
  externallyOwned: true,
  useDefaultDevices: true,
  allowDuplicates: true,
  observedByAll: true,
  status: "ACTIVE",
};

/** 
* Path to input files
*
*/
exports.sourceSettings = {
  people: {
    extract: "./dataSync_input/User_Input.csv",
  },
  groups: {
    extract: "./dataSync_input/Group_Input.csv"
  },
};
