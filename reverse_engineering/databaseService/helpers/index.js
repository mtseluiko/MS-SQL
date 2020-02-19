const getNewConnectionClientByDb = require('./getNewConnectionClientByDb');
const getAllDatabasesTablesInfo = require('./getAllDatabasesTablesInfo');
const getObjectsFromDatabase = require('./getObjectsFromDatabase');
const getObjectsFromDatabases = require('./getObjectsFromDatabases');

module.exports = {
	getNewConnectionClientByDb,
	getAllDatabasesTablesInfo,
	getObjectsFromDatabase,
	getObjectsFromDatabases,
}