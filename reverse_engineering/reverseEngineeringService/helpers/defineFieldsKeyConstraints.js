const handleDataCompression = key => {
	const compressionTypes = ['NONE', 'ROW', 'PAGE', 'COLUMNSTORE', 'COLUMNSTORE_ARCHIVE'];
	const type = compressionTypes.find(type => key.type_desc.includes(type));
	return type || '';
};

const isClustered = key => !key.type_desc.includes('NONCLUSTERED');

const reverseKey = (keyInfo, keyType) => ({
	[`${keyType}ConstraintName`]: keyInfo.constraintName,
	[`${keyType}StaticticsNorecompute`]: Boolean(keyInfo.statisticNoRecompute),
	[`${keyType}AllowRowLocks`]: keyInfo.allow_row_locks,
	[`${keyType}AllowPageLocks`]: keyInfo.allow_page_locks,
	[`${keyType}IsClustered`]: isClustered(keyInfo),
	[`${keyType}IngoreDuplicate`]: Boolean(keyInfo.ignore_dup_key),
	[`${keyType}IsOptimizedForSequentialKey`]: Boolean(keyInfo.optimize_for_sequential_key),
	[`${keyType}IsPadded`]: Boolean(keyInfo.is_padded),
	[`${keyType}FillFactor`]: keyInfo.fill_factor,
	[`${keyType}DataCompression`]: handleDataCompression(keyInfo),
	[`${keyType}IsDescending`]: keyInfo.isDescending,
});

const handleKey = (column, columnKeyInfo) => {
	const { constraintType } = columnKeyInfo;
	switch(constraintType) {
		case 'UNIQUE': {
			const { uniqueKeyOptions = [] } = column;
			const isAlreadyExists = uniqueKeyOptions.find(currentOptions =>
				currentOptions && currentOptions.uniqueConstraintName === columnKeyInfo.constraintName);
			if (isAlreadyExists) {
				return {};
			}

			const reversedKeyOptions = reverseKey(columnKeyInfo, 'uniqueKey');
			return {
				unique: true,
				uniqueKeyOptions: uniqueKeyOptions.concat([reversedKeyOptions]),
			};
		};
		case 'PRIMARY KEY': {
			return {
				primaryKey: true,
				primaryKeyOptions: reverseKey(columnKeyInfo, 'primaryKey'),
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
