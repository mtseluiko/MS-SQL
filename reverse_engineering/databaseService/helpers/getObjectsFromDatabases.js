const getAllDatabasesTablesInfo = require('./getAllDatabasesTablesInfo');

const getObjectsFromDatabases = async client => {
	const tablesInfo = await getAllDatabasesTablesInfo(client);
	const databasesObject = tablesInfo.reduce((databases, { database_name, view_name, table_name, schema_name }) => {
		const database = databases[database_name];
		const fullTableName = `${schema_name}.${table_name}`;
		const fullViewName = `${schema_name}.${view_name}`;
		if (database) {
			const { dbCollections, views } = database;
			const newDbCollections = dbCollections.includes(fullTableName) ? dbCollections : [...dbCollections, fullTableName];
			const newViews = (views.includes(fullViewName) || !view_name) ? views : [...views, fullViewName];
			return {
				...databases,
				[database_name]: {
					...database,
					dbCollections: newDbCollections,
					views: newViews
				}
			};
		}

		return {
			...databases,
			[database_name]: {
				dbName: database_name,
				dbCollections: [fullTableName],
				views: view_name ? [fullViewName] : [],
			}
		};
	}, {});
	return Object.values(databasesObject);
};

module.exports = getObjectsFromDatabases;
