const sql = require('mssql');

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

const getAllDatabasesTablesInfo = async (client, includeViews = true) => {
	const viewJoin = includeViews ? `JOIN '+ quotename(name) + '.sys.views v on v.schema_id = t.schema_id` : '';
	const orderByView = includeViews ? `, view_name` : '';
	const viewName = includeViews ? `, v.name as view_name` : '';
	return await client.request()
		.query(`
		declare @sql nvarchar(max);
		select @sql = 
			(select ' UNION ALL
				SELECT ' +  + quotename(name,'''') + ' as database_name,
							s.name COLLATE DATABASE_DEFAULT
								AS schema_name,
							t.name COLLATE DATABASE_DEFAULT as table_name
							${viewName}
							FROM '+ quotename(name) + '.sys.tables t
							JOIN '+ quotename(name) + '.sys.schemas s
								on s.schema_id = t.schema_id
							${viewJoin}
							WHERE t.is_ms_shipped = 0
							'
			from sys.databases
			where state=0
			order by [name] for xml path(''), type).value('.', 'nvarchar(max)');

		set @sql = stuff(@sql, 1, 12, '') + ' order by database_name,
																		schema_name,
																		table_name
																		${orderByView}';

		execute (@sql);
		`);
};

const getObjectsFromDatabases = async client => {
	const tablesInfo = await getAllDatabasesTablesInfo(client);
	const databasesObject = tablesInfo.reduce((databases, { database_name, view_name, table_name }) => {
		const database = databases[database_name];
		if (database) {
			return {
				...databases,
				[database_name]: {
					...database,
					...(!database.dbCollections.includes(table_name)
						&& { dbCollections: [...database.dbCollections, table_name] }),
					...(view_name && { views: [...database.views, view_name] }),
				}
			};
		}

		return {
			...databases,
			[database_name]: {
				dbName: database_name,
				dbCollections: [table_name],
				views: view_name ? [view_name] : [],
			}
		};
	}, {});
	return Object.values(databasesObject);
};

const getObjectsFromDatabase = async client => {
	const tablesInfo = await client.query`select * from INFORMATION_SCHEMA.tables`;
	return [tablesInfo.reduce((database, { TABLE_NAME, TABLE_TYPE }) => {
		if (TABLE_TYPE === 'VIEW') {
			return {
				...database,
				views: [...database.views, TABLE_NAME],
			}
		}
		return {
			...database,
			dbCollections: [...database.dbCollections, TABLE_NAME],
		}
	}, { dbName: client.config.database, views: [], dbCollections: [] })];
};

const getObjects = async (client) => client.config.database
	? await getObjectsFromDatabase(client)
	: await getObjectsFromDatabases(client);

module.exports = {
	getConnectionClient,
	getObjects,
}