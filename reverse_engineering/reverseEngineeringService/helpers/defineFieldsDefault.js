const defineFieldsDefault = columnsInfo => jsonSchema =>
	columnsInfo.reduce((jsonSchemaAcc, column) => ({
		...jsonSchemaAcc,
		...(jsonSchema.properties[column.Column] && {
			properties: {
				...jsonSchema.properties,
				[column.Column]: {
					...jsonSchema.properties[column.Column],
					description: column.Description,
				},
			}
		}),
	}), jsonSchema);

module.exports = defineFieldsDefault;
