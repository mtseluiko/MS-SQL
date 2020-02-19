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

module.exports = getObjectsFromDatabase;
