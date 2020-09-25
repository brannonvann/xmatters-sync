# xmtoolbox Standard Sync
## Files included
- xmtoolboxStandardSync.zip - Workflow exported from xMatters. See this section below for configuring the workflow in xMatters

## Environment Configuration
1. Run xMatters environment configuration script by typing `xmatters-setup` into the command line and hitting enter.
2. Provide values for PROD_SUBDOMAIN, PROD_USERNAME, and PROD_PASSWORD from the environment which you're targeting.
3. After those 3 options, run the Sync Options configuration script by typing `sync-setup` into the command line and hitting enter.
4. You can select to sync Users, Devices `(if Users = true)`, Groups, and Group Roster `(if Groups = true)`.
5. This info is all written to a file called `.env` in the same directory. This is used within the synchronization script.
6. You can overwrite all contents of that file by repeating steps 1-4 above. To overwrite sync options, manually delete the option lines written to `.env` and re-run only the sync options script

### Manual config
1. Create a file called .env in the root of the project directory
2. Place the following within that file

    a. `PROD_SUBDOMAIN=<xMatters-Subdomain>`
    
    b. `PROD_USERNAME=<xMatters-REST-User>`
    
    c. `PROD_PASSWORD=<REST-User-Password>`
    
3. The npm package `dotenv` reads this file at runtime and creates Node runtime environment variables to be accessed.
    
## xMatters Worfklow Configuration
1. Import the xmtoolboxStandardSync.zip folder into your xMatters environment. 
2. Go find the newly imported workflow's webhook URL in Flow Designer.
3. Copy that value into config.js for the variable `prod.resultsApiPath`.

## Data files
1. Create a directory named `datasync_output` in the project directory.
2. Create two text files in the `datasync_output` directory - `emailErrors.txt` and `phoneErrors.txt`.
2. Create a directory named `datasync_input` in the project directory.
3. Place csv files in the root of the `datasync_input` directory
    a. User_Input.csv
    b. Group_Input.csv

### Required Columns
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

