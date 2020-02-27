const changeViewPropertiesToReferences = (jsonSchema, tableInfo) => {
	return tableInfo.reduce((jsonSchemaAcc, column) => {
		const columnName = column['COLUMN_NAME'];
		if (!jsonSchemaAcc.properties[columnName]) {
			return jsonSchemaAcc;
		}

		return {
			...jsonSchemaAcc,
			properties: {
				...jsonSchemaAcc.properties,
				[columnName]: {$ref: `#collection/definitions/${tableInfo['RELATED_TABLE']}/${columnName}`},
			},
		};
	}, jsonSchema);
};

module.exports = changeViewPropertiesToReferences;
