const sql = require('mssql');
const { getObjectsFromDatabase, getObjectsFromDatabases, getNewConnectionClientByDb } = require('./helpers');

const getConnectionClient = async connectionInfo => {
	if (connectionInfo.authMethod === 'Username / Password') {
		return await sql.connect({
			user: connectionInfo.userName,
			password: connectionInfo.userPassword,
			server: connectionInfo.host,
			port: connectionInfo.port,
			database: connectionInfo.databaseName,
			options: {
				encrypt: true,
			},
		});
	}

	return await sql.connect(connectionInfo.connectionString);
};

const getTableInfo = async (connectionClient, dbName, tableName) => {
	const currentDbConnectionClient = await getNewConnectionClientByDb(connectionClient, dbName);
	return await currentDbConnectionClient.query`
		SELECT c.*, t.table_name as RELATED_TABLE, k.column_name as PRIMARY_KEY_COLUMN
		FROM information_schema.columns as c
		LEFT JOIN INFORMATION_SCHEMA.VIEW_TABLE_USAGE t ON t.view_name=c.table_name
		LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k ON k.table_name=c.table_name
		where c.table_name = ${tableName}
	;`
};

const getTableRow = async (connectionClient, dbName, tableName) => {
	const currentDbConnectionClient = await getNewConnectionClientByDb(connectionClient, dbName);
	return await currentDbConnectionClient
		.request()
		.input('tableName', sql.VarChar, tableName)
		.query`EXEC('SELECT TOP 1 * FROM ' + @TableName + ';');`;
};

const getObjects = async (client) => client.config.database
	? await getObjectsFromDatabase(client)
	: await getObjectsFromDatabases(client);

module.exports = {
	getConnectionClient,
	getObjects,
	getTableInfo,
	getTableRow,
}
