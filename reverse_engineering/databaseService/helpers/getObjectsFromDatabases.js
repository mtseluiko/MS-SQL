const getAllDatabasesTablesInfo = require('./getAllDatabasesTablesInfo');

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

module.exports = getObjectsFromDatabases;
