const changeViewPropertiesToReferences = (jsonSchema, viewInfo) => {
	return viewInfo.reduce((jsonSchemaAcc, column) => {
		const columnName = column['ColumnName'];
		if (!jsonSchemaAcc.properties[columnName]) {
			return jsonSchemaAcc;
		}

		return {
			...jsonSchemaAcc,
			properties: {
				...jsonSchemaAcc.properties,
				[columnName]: {$ref: `#collection/definitions/${column['ReferencedTableName']}/${column['ReferencedColumnName']}`},
			},
		};
	}, jsonSchema);
};

module.exports = changeViewPropertiesToReferences;
