const handleIndex = (column, columnIndexInfo) => {
	const { typeDesc, constraintType } = columnIndexInfo;
	switch(constraintType) {
		case 'UNIQUE': {
			return {
				clustered: typeof column.clustered === 'boolean' ? column.clustered : typeDesc === 'CLUSTERED',
				unique: true,
			};
		};
		case 'PRIMARY KEY': {
			return {
				clustered: typeDesc === 'CLUSTERED',
				primaryKey: true,
			};
		};
	}
};

const defineFieldsIndexes = columnsInfo => jsonSchema =>
	columnsInfo.reduce((jsonSchemaAcc, columnIndexInfo) => {
		const currentColumn = jsonSchemaAcc.properties[columnIndexInfo.columnName];
		if (!currentColumn) {
			return jsonSchemaAcc;
		}

		return {
			...jsonSchemaAcc,
			properties: {
				...jsonSchemaAcc.properties,
				[columnIndexInfo.columnName]: {
					...currentColumn,
					...handleIndex(currentColumn, columnIndexInfo),
				},
			},
		}
	}, jsonSchema);

module.exports = defineFieldsIndexes;
