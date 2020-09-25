# xmtoolbox Standard Sync
## Files included
- `xmtoolboxStandardSync.zip` - Workflow exported from xMatters. See this section below for configuring the workflow in xMatters
- `config.js` - xMatters environment configuration. Reads things from .env file, as well as static from this file.
- `dataSync_defaultConfig.js` - data sync specific options. Defaults are held here for users, devices, groups, as well as input file location.
- `setup.js` - xMatters environment config setup script. Instructions to use this script are below.
- `setup-syncOptions.js` - sync option config setup script. Instructions to use this script are below.
- `xmt_dataSync.js` - main sync script. Transforms csv to json, translates and prepares data before using xmtoolbox to sync data.

## Environment Configuration
1. Run xMatters environment configuration script by typing `xmatters-setup` into the command line and hitting enter.
2. Provide values for PROD_SUBDOMAIN, PROD_USERNAME, and PROD_PASSWORD from the environment which you're targeting.Yeah
3. After those 3 options, run the Sync Options configuration script by typing `sync-setup` into the command line and hitting enter.
4. You can select to sync Users, Devices `(if Users = true)`, Groups, and Group Roster `(if Groups = true)`.
5. This info is all written to a file called `.env` in the same directory. This is used within the synchronization script.
6. You can overwrite all contents of that file by repeating steps 1-4 above. To overwrite sync options, manually delete the option lines written to `.env` and re-run only the sync options script
    
## xMatters Worfklow Configuration
1. Import the xmtoolboxStandardSync.zip folder into your xMatters environment. 
2. Go find the newly imported workflow's webhook URL in Flow Designer.
3. Copy that value into config.js for the variable `prod.resultsApiPath`.

## Data Files
There are example csv files for users + groups in the dataSync_input directory. The convention of these are also explained below. There are also empty text files in the `dataSync_output` directory that are written to if there are validation errors with phone numbers or emails.

### CSV Required Format
The data files must follow this convention.

### User_Input.csv
 ----
-  User (required) - targetName or User ID
- First Name (required)
- Last Name (required)
- Site - string value for site in xMatters. Default = Default Site
- Externally Owned - set to TRUE to skip syncing this user
- Work Email
- SMS Phone
- Mobile Phone
- Work Phone
- Role - must correspond to the name of a Role in the targeted environment. If multiple Roles, separate role names by pipes (|)

### Group_Input.csv
 ----
- Name (Required) - Name of the group
-  Description - Descripton of the group
- Supervisors - xMatters targetNames of supervisors of the group. If multiple Supervisors, separate names by pipes (|)
- Members - xMatters targetNames of members of the group. If multiple Members, separate names  by pipes (|)

