import { writeNewUserToDatabase } from "./CreateAdminForOrg.mjs";

const UserPermissions = {
    Admin: 'Admin',
    Developer: 'Developer',
    Teacher: 'Teacher',
    Student: 'Student',
};

const adminUserEmail = "admin@email.com"
const adminUserRole = UserPermissions.Admin
const adminUserOrganization = "admin organization"
const adminUserPassword = "admin1"

writeNewUserToDatabase(adminUserEmail,adminUserRole,adminUserPassword,adminUserOrganization);

// Terminal Commands
// node src/components/AdminHomeModule/CreateAdmin.mjs
// ctrl c <- once complete