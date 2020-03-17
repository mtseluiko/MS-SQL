const isClustered = key => !key.type_desc.includes('NONCLUSTERED');

const reverseKey = keyInfo => ({
	constraintName: keyInfo.constraintName,
	staticticsNorecompute: Boolean(keyInfo.statisticNoRecompute),
	allowRowLocks: keyInfo.allow_row_locks,
	allowPageLocks: keyInfo.allow_page_locks,
	isClustered: isClustered(keyInfo),
	ignoreDuplicate: Boolean(keyInfo.ignore_dup_key),
	isOptimizedForSequentialKey: Boolean(keyInfo.optimize_for_sequential_key),
	isPadded: Boolean(keyInfo.is_padded),
	fillFactor: keyInfo.fill_factor,
	order: keyInfo.isDescending ? 'DESC' : 'ASC',
	partitionName: keyInfo.dataSpaceName,
	statisticsIncremental: keyInfo.statisticsIncremental,
});

const handleKey = (column, columnKeyInfo) => {
	const { constraintType } = columnKeyInfo;
	switch(constraintType) {
		case 'UNIQUE': {
			const { uniqueKeyOptions = [] } = column;
			const isAlreadyExists = uniqueKeyOptions.find(currentOptions =>
				currentOptions && currentOptions.constraintName === columnKeyInfo.constraintName);
			if (isAlreadyExists) {
				return {};
			}

			const reversedKeyOptions = reverseKey(columnKeyInfo);
			return {
				unique: true,
				uniqueKeyOptions: uniqueKeyOptions.concat([reversedKeyOptions]),
			};
		};
		case 'PRIMARY KEY': {
			return {
				primaryKey: true,
				primaryKeyOptions: reverseKey(columnKeyInfo),
			};
		};
	}
};

const defineFieldsKeyConstraints = columnsInfo => jsonSchema =>
	columnsInfo.reduce((jsonSchemaAcc, columnKeyInfo) => {
		const currentColumn = jsonSchemaAcc.properties[columnKeyInfo.columnName];
		if (!currentColumn) {
			return jsonSchemaAcc;
		}

		return {
			...jsonSchemaAcc,
			properties: {
				...jsonSchemaAcc.properties,
				[columnKeyInfo.columnName]: {
					...currentColumn,
					...handleKey(currentColumn, columnKeyInfo),
				},
			},
		}
	}, jsonSchema);

module.exports = defineFieldsKeyConstraints;
