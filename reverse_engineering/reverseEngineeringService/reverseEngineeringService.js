const { getTableInfo, getTableRow, getTableForeignKeys, getDatabaseIndexes } = require('../databaseService/databaseService');
const { transformDatabaseTableInfoToJSON, reverseTableForeignKeys, reverseTableIndexes } = require('./helpers');

const structureJSONSchemas = jsonSchemas =>
	jsonSchemas.reduce((structuredJSONSchemas, jsonSchema) => {
		if (jsonSchema.relatedTable) {
			const currentIndex = structuredJSONSchemas.findIndex(structuredSchema =>
				jsonSchema.relatedTable === structuredSchema.relatedTable);
			const relatedTableSchemaIndex = structuredJSONSchemas.findIndex(({ collectionName, dbName }) =>
				jsonSchema.relatedTable === `${dbName}.${collectionName}`);
			delete jsonSchema.relatedTable;
			structuredJSONSchemas[relatedTableSchemaIndex].views.push(jsonSchema);
			return structuredJSONSchemas.filter((schema, i) => i !== currentIndex);
		}

		return structuredJSONSchemas;
	}, jsonSchemas);

const getCollectionsRelationships = async (dbConnectionClient, tablesInfo) => {
	return await Object.entries(tablesInfo).reduce(async (relationships, [dbName]) => {
		const tableForeignKeys = await getTableForeignKeys(dbConnectionClient, dbName);
		const reversedTableRelationships = reverseTableForeignKeys(tableForeignKeys, dbName);
		return [...await relationships, ...reversedTableRelationships];
	}, Promise.resolve([]));
};

const reverseCollectionsToJSON = async (dbConnectionClient, tablesInfo) => {
	return await Object.entries(tablesInfo).reduce(async (jsonSchemas, [dbName, tableNames]) => {
		const databaseIndexes = await getDatabaseIndexes(dbConnectionClient, dbName);
		const tablesInfo = await Promise.all(
			tableNames.map(async tableName => {
				const trimmedTableName = tableName.replace(/ \(v\)$/, '');
				const [tableInfo, tableRow] = await Promise.all([
					await getTableInfo(dbConnectionClient, dbName, trimmedTableName),
					await getTableRow(dbConnectionClient, dbName, trimmedTableName),
				]);
				const isView = tableInfo.length && tableInfo[0]['RELATED_TABLE'];
				const jsonSchema = transformDatabaseTableInfoToJSON(tableInfo);
				const tableIndexes = databaseIndexes.filter(index => index.TableName === tableName);
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
						standardDoc: tableRow,
					}),
					entityLevel: { Indxs: reverseTableIndexes(tableIndexes) },
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
