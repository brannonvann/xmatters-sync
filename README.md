# xmtoolbox Standard Sync

## Configuration

## Data files
1. Create a directory named 'datasync_input' in the same directory as the other sync files
2. Place csv files in the root of the datasync_input directory
    a. User_Input.csv
    b. Group_Input.csv

### Required Columns
The data files must follow this convention.

User_Input.csv
 -
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

Group_Input.csv
 - 
- Name (Required) - Name of the group
-  Description - Descripton of the group
- Supervisors - xMatters targetNames of supervisors of the group. If multiple Supervisors, separate names by pipes (|)
- Members - xMatters targetNames of members of the group. If multiple Members, separate names  by pipes (|)