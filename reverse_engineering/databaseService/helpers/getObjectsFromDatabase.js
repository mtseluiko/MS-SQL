const getObjectsFromDatabase = async client => {
	const tablesInfo = await client.query`select * from INFORMATION_SCHEMA.tables`;
	const databaseObject = tablesInfo.reduce((schemas, { TABLE_NAME, TABLE_TYPE, TABLE_SCHEMA }) => {
		const schema = schemas[TABLE_SCHEMA];
		if (schema) {
			return {
				...schemas,
				[TABLE_SCHEMA]: {
					...schema,
					dbCollections: TABLE_TYPE === 'BASE TABLE' ? [...schema.dbCollections, TABLE_NAME] : schema.dbCollections,
					views: TABLE_TYPE === 'VIEW' ? [...schema.views, TABLE_NAME] : schema.views,
				}
			};
		}

		return {
			...schemas,
			[TABLE_SCHEMA]: {
				dbName: TABLE_SCHEMA,
				dbCollections: TABLE_TYPE === 'BASE TABLE' ? [TABLE_NAME] : [],
				views: TABLE_TYPE === 'VIEW' ? [TABLE_NAME] : [],
			}
		};
	}, {});
	return Object.values(databaseObject);
};

module.exports = getObjectsFromDatabase;
