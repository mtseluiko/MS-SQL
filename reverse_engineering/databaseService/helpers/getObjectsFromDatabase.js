const getObjectsFromDatabase = async client => {
	const tablesInfo = await client.query`select * from INFORMATION_SCHEMA.tables`;
	return [tablesInfo.reduce((database, { TABLE_NAME, TABLE_TYPE, TABLE_SCHEMA }) => {
		const fullTableName = `${TABLE_SCHEMA}.${TABLE_NAME}`;
		if (TABLE_TYPE === 'VIEW') {
			return {
				...database,
				views: [...database.views, fullTableName],
			};
		}

		return {
			...database,
			dbCollections: [...database.dbCollections, fullTableName],
		};
	}, { dbName: client.config.database, views: [], dbCollections: [] })];
};

module.exports = getObjectsFromDatabase;
