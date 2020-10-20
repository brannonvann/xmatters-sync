# xmtoolbox Standard Sync
## Files included
- `xmtoolboxStandardSync.zip` - Workflow exported from xMatters. See [this section](#xmatters-worfklow-configuration) below for configuring the workflow in xMatters
- `config.js` - xMatters environment configuration. Reads things from .env file, as well as static from this file.
- `dataSync_defaultConfig.js` - data sync specific options. Defaults are held here for users, devices, groups, as well as input file location.
- `setup.js` - xMatters environment config setup script. Instructions to use this script are below.
- `setup-syncOptions.js` - sync option config setup script. Instructions to use this script are below.
- `xmt_dataSync.js` - main sync script. Transforms csv to json, translates and prepares data before using xmtoolbox to sync data.

## Running with Docker
1. Clone this repo
2. Run `docker-compose up`
3. Browse to http://localhost:3000
4. Setup the sync for your environment by filling out the form and clicking "Save"
5. Browse and find your `User_Input.csv` and `Group_Input.csv` files
6. Run the sync using the "Run Sync" button
7. Output from the sync will be dumped to the console where the container was started
 - You can also browse to your environment and see the most recent event from the workflow running if you've configured the workflow. For instructions, [see this section below](#xmatters-worfklow-configuration) 

## Environment Configuration
1. Clone this repo with `git clone https://github.com/hmiedema9/xmtoolbox-sync`
2. Run `sudo npm install` to install dependencies
3. Net, run `sudo npm link` to link commands to run programs from `package.json`'s `bin` section.
4. Run xMatters environment configuration script by typing `xmatters-setup` into the command line and hitting enter.
5. Provide values for PROD_SUBDOMAIN, PROD_USERNAME, and PROD_PASSWORD from the environment which you're targeting.Yeah
6. After those 3 options, run the Sync Options configuration script by typing `sync-setup` into the command line and hitting enter.
7. You can select to sync Users, Devices `(if Users = true)`, Groups, and Group Roster `(if Groups = true)`.
8. This info is all written to a file called `.env` in the same directory. This is used within the synchronization script.
9. You can overwrite all contents of that file by repeating steps 1-4 above. To overwrite sync options, manually delete the option lines written to `.env` and re-run only the sync options script

## Sync Configuration
1. Run sync configuration script by typing `sync-setup` into the command line and hitting enter.
2. Answer yes (Y) or no (N) to each of the following questions. This will determine what is synchronized between the provided data files and your xMatters environment.
3. Options are Users, Devices (if Users are synced), Groups, and Group Roster (if Groups are synced).

## Default Sync Option Setup
After running this sync configuration script, there are more defaults set for options in code as well as custom properties for users. Go to `dataSync_defaultConfig.js` if any of this needs adjusting or editing. Options and their defaults are listed below:

User Defaults
----
- `defaultRoles` - if roles are not present in the CSV data file, this array of role(s) will be used to synchronize users
- `defaultTimeZone`

## Running the sync
1. Once configuration of everything above is complete, run the sync using `run-sync` or `node xmt_dataSync.js`

## Data Files
There are example csv files for users + groups in the `dataSync_input` directory. The convention of these are also explained below. There are also empty text files in the `dataSync_output` directory that are written to if there are validation errors with phone numbers or emails.

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

## xMatters Worfklow Configuration
1. Import the xmtoolboxStandardSync.zip folder into your xMatters environment. 
2. Go find the newly imported workflow's webhook URL in Flow Designer.
3. Copy that value into config.js for the variable `prod.resultsApiPath`.
4. After importing the workflow, go into the forms of the workflow and add recipients to the form for who should receive results of the sync
![Workflow Layout](media/sync-flow1.png?raw=true)
![Workflow Recipients](media/sync-flow2.png?raw=true)