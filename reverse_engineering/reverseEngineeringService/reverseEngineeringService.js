const {
	getTableInfo,
	getTableRow,
	getTableForeignKeys,
	getDatabaseIndexes,
	getTableColumnsDescription,
	getDatabaseMemoryOptimizedTables,
	getDatabaseCheckConstraints,
} = require('../databaseService/databaseService');
const {
	transformDatabaseTableInfoToJSON,
	reverseTableForeignKeys,
	reverseTableIndexes,
	defineRequiredFields,
	defineFieldsDescription,
	doesViewHaveRelatedTables,
	reverseTableCheckConstraints,
	changeViewPropertiesToReferences,
} = require('./helpers');
const pipe = require('../helpers/pipe');

const mergeCollectionsWithViews = jsonSchemas =>
	jsonSchemas.reduce((structuredJSONSchemas, jsonSchema) => {
		if (jsonSchema.relatedTables) {
			const currentIndex = structuredJSONSchemas.findIndex(structuredSchema =>
				jsonSchema.collectionName === structuredSchema.collectionName);
			const relatedTableSchemaIndex = structuredJSONSchemas.findIndex(({ collectionName, dbName }) =>
				jsonSchema.dbName === dbName && jsonSchema.relatedTables.includes(collectionName));

			if (relatedTableSchemaIndex !== -1 && doesViewHaveRelatedTables(jsonSchema, structuredJSONSchemas)) {
				structuredJSONSchemas[relatedTableSchemaIndex].views.push(jsonSchema);
			}

			delete jsonSchema.relatedTables;
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
		const [databaseIndexes, databaseMemoryOptimizedTables, databaseCheckConstraints] = await Promise.all([
			await getDatabaseIndexes(dbConnectionClient, dbName),
			await getDatabaseMemoryOptimizedTables(dbConnectionClient, dbName),
			await getDatabaseCheckConstraints(dbConnectionClient, dbName),
		]);
		const tablesInfo = await Promise.all(
			tableNames.map(async tableNameWithSchema => {
				const trimmedTableName = tableNameWithSchema.replace(/ \(v\)$/, '');
				const [schemaName, tableName] = trimmedTableName.split('.');
				const tableIndexes = databaseIndexes.filter(index => index.TableName === tableName);
				const tableCheckConstraints = databaseCheckConstraints.filter(cc => cc.table === tableName);
				logger.progress({ message: 'Fetching table information', containerName: dbName, entityName: tableName });

				const [tableInfo, tableRow] = await Promise.all([
					await getTableInfo(dbConnectionClient, dbName, tableName, schemaName),
					await getTableRow(dbConnectionClient, dbName, tableName, schemaName),
				]);
				const isView = tableInfo.length && tableInfo[0]['RELATED_TABLE'];

				const jsonSchema = pipe(
					transformDatabaseTableInfoToJSON(tableInfo),
					defineRequiredFields,
					defineFieldsDescription(await getTableColumnsDescription(dbConnectionClient, dbName, tableName)),
				)({ required: [], properties: {} });

				return {
					collectionName: tableName,
					dbName: `${dbName}.${schemaName}`,
					...(isView ? {
						jsonSchema: changeViewPropertiesToReferences(jsonSchema, tableInfo),
						name: tableName,
						relatedTables: tableInfo.map((columnInfo => columnInfo['RELATED_TABLE'])),
					} : {
						validation: { jsonSchema },
						views: [],
					}),
					standardDoc: tableRow,
					collectionDocs: tableRow,
					documents: tableRow,
					entityLevel: {
						Indxs: reverseTableIndexes(tableIndexes),
						memory_optimized: databaseMemoryOptimizedTables.includes(tableName),
						chkConstr: reverseTableCheckConstraints(tableCheckConstraints),
					},
					bucketInfo: {
						databaseName: dbName,
					},
					emptyBucket: false,
				};
			})
		);
		return [...await jsonSchemas, ...tablesInfo];
	}, Promise.resolve([]));
};

module.exports = {
	reverseCollectionsToJSON,
	mergeCollectionsWithViews,
	getCollectionsRelationships,
}
