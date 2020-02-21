const {
	getTableInfo,
	getTableRow,
	getTableForeignKeys,
	getDatabaseIndexes,
	getTableColumnsDescription,
	getDatabaseMemoryOptimizedTables,
} = require('../databaseService/databaseService');
const {
	transformDatabaseTableInfoToJSON,
	reverseTableForeignKeys,
	reverseTableIndexes,
	defineRequiredFields,
	defineFieldsDescription,
} = require('./helpers');
const pipe = require('../helpers/pipe');

const structureJSONSchemas = jsonSchemas =>
	jsonSchemas.reduce((structuredJSONSchemas, jsonSchema) => {
		if (jsonSchema.relatedTable) {
			const currentIndex = structuredJSONSchemas.findIndex(structuredSchema =>
				jsonSchema.relatedTable === structuredSchema.relatedTable);
			const relatedTableSchemaIndex = structuredJSONSchemas.findIndex(({ collectionName, dbName }) =>
				jsonSchema.relatedTable === `${dbName}.${collectionName}`);
			delete jsonSchema.relatedTable;
			if (relatedTableSchemaIndex !== -1) {
				structuredJSONSchemas[relatedTableSchemaIndex].views.push(jsonSchema);
			}

			return structuredJSONSchemas.filter((schema, i) => i !== currentIndex);
		}

		return structuredJSONSchemas;
	}, jsonSchemas);

const getCollectionsRelationships = logger => async (dbConnectionClient, tablesInfo) => {
	return await Object.entries(tablesInfo).reduce(async (relationships, [dbName]) => {
		logger.progress({ message: 'Fetching tables relationships', containerName: dbName });
		const tableForeignKeys = await getTableForeignKeys(dbConnectionClient, dbName);
		const reversedTableRelationships = reverseTableForeignKeys(tableForeignKeys, dbName);
		return [...await relationships, ...reversedTableRelationships];
	}, Promise.resolve([]));
};

const reverseCollectionsToJSON = logger => async (dbConnectionClient, tablesInfo) => {
	return await Object.entries(tablesInfo).reduce(async (jsonSchemas, [dbName, tableNames]) => {
		logger.progress({ message: 'Fetching database information', containerName: dbName });
		const [databaseIndexes, databaseMemoryOptimizedTables] = await Promise.all([
			await getDatabaseIndexes(dbConnectionClient, dbName),
			await getDatabaseMemoryOptimizedTables(dbConnectionClient, dbName),
		]);
		const tablesInfo = await Promise.all(
			tableNames.map(async tableName => {
				const trimmedTableName = tableName.replace(/ \(v\)$/, '');
				const tableIndexes = databaseIndexes.filter(index => index.TableName === tableName);
				logger.progress({ message: 'Fetching table information', containerName: dbName, entityName: trimmedTableName });

				const [tableInfo, tableRow] = await Promise.all([
					await getTableInfo(dbConnectionClient, dbName, trimmedTableName),
					await getTableRow(dbConnectionClient, dbName, trimmedTableName),
				]);
				const isView = tableInfo.length && tableInfo[0]['RELATED_TABLE'];

				const jsonSchema = pipe(
					transformDatabaseTableInfoToJSON(tableInfo),
					defineRequiredFields,
					defineFieldsDescription(await getTableColumnsDescription(dbConnectionClient, dbName, trimmedTableName)),
				)({ required: [], properties: {} });

				return {
					collectionName: tableName,
					dbName,
					...(isView ? {
						jsonSchema,
						name: trimmedTableName,
						relatedTable: `${dbName}.${tableInfo[0]['RELATED_TABLE']}`,
					} : {
						validation: { jsonSchema },
						views: [],
					}),
					standardDoc: tableRow,
					collectionDocs: tableRow,
					entityLevel: {
						Indxs: reverseTableIndexes(tableIndexes),
						memory_optimized: databaseMemoryOptimizedTables.includes(trimmedTableName),
					},
					documents: [],
					emptyBucket: false,
				};
			})
		);
		return [...await jsonSchemas, ...tablesInfo];
	}, Promise.resolve([]));
};

module.exports = {
	reverseCollectionsToJSON,
	structureJSONSchemas,
	getCollectionsRelationships,
}
