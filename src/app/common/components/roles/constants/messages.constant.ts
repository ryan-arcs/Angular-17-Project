// Define error and success messages for applications, roles, users, modules, and permissions
export const messages = {
  error: {
    application: {
      invalidId: 'Invalid application id!',
      notFound: 'Application not found!',
    },
    role: {
      invalidId: 'Invalid role id!',
      notFound: 'Role not found!',
      alreadyExist: 'A role with this name already exists.',
    },
    user: {
      notFound: 'User not found!',
      alreadyExist: 'A user with this email already exists',
    },
    module: {
      invalidId: 'Invalid module id!',
      notFound: 'Module not found!',
      alreadyExist: 'A module with this name already exists.',
    },
    submodule: {
      invalidId: 'Invalid submodule id!',
      notFound: 'Submodule not found!',
      alreadyExist: 'A submodule with this name already exists.',
    },
    permission: {
      notFound: 'Permission not found!',
      invalidId: 'Invalid permission id!',
      alreadyExist: 'A permission with this name already exists.',
    },
    InvalidAccess: {
      message: "You don't have permission to view this module",
    },
    appAccessRequest: {
      invalidId: 'Invalid app access id!',
      notFound: 'Role not found!',
    },
  },
  success: {
    application: {
      update: 'Application updated successfully!',
      add: 'Application added successfully!',
      delete: 'Application deleted successfully!',
      noRowFound: 'No applications available!',
    },
    role: {
      update: 'Role updated successfully!',
      add: 'Role added successfully!',
      delete: 'Role deleted successfully!',
      noRowFound: 'No roles available!',
    },
    user: {
      update: 'User updated successfully!',
      add: 'User added successfully!',
      updateStatus: 'User status updated successfully!',
      noRowFound: 'No users available!',
    },
    module: {
      update: 'Module updated successfully!',
      add: 'Module added successfully!',
      delete: 'Module deleted successfully!',
      noRowFound: 'No modules available!',
    },
    submodule: {
      update: 'Submodule updated successfully!',
      add: 'Submodule added successfully!',
      delete: 'Submodule deleted successfully!',
      noRowFound: 'No submodules available!',
    },
    permission: {
      update: 'Permission updated successfully!',
      add: 'Permission added successfully!',
      delete: 'Permission deleted successfully!',
      noRowFound: 'No permissions available!',
    },
    manageRoles: {
      update: 'Roles updated successfully!',
    },
    managePermissions: {
      update: 'Permissions updated successfully!',
    },
    appAccessRequest: {
      completed:
        'The application access request has been completed successfully!',
      rejected: 'The application access request has been rejected!',
      success: 'Your comment is added successfully!',
      noRowFound: 'No requests available!',
    },
  },
};
