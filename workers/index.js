const changeUserActivity = require('./changeUsersActivity');
const classifyUsers = require('./classifyUsers');

// exporting services for both assignment functions.
exports.services = {
    changeUserActivity : changeUserActivity,
    classifyUsers : classifyUsers
}