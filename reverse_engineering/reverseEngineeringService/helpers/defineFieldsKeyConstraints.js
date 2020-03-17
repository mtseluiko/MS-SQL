const UNIQUE = 'UNIQUE';
const PRIMARY_KEY = 'PRIMARY KEY';

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
	dataCompression: keyInfo.dataCompression,
});

const handleKey = (field, fieldInfo) => {
	const { constraintType, constraintName } = fieldInfo;
	switch(constraintType) {
		case UNIQUE: {
			const { uniqueKeyOptions = [] } = field;
			const isAlreadyExists = uniqueKeyOptions.find(currentOptions =>
				currentOptions && currentOptions.constraintName === constraintName);
			if (isAlreadyExists) {
				return {};
			}

			const reversedKeyOptions = reverseKey(fieldInfo);
			return {
				unique: true,
				uniqueKeyOptions: uniqueKeyOptions.concat([reversedKeyOptions]),
			};
		};
		case PRIMARY_KEY: {
			return {
				primaryKey: true,
				primaryKeyOptions: reverseKey(fieldInfo),
			};
		};
	}
};

const getKeyConstraintsCompositionStatuses = fieldsInfo =>
	fieldsInfo.reduce((constraintsStatuses, fieldInfo) => {
		const { constraintName } = fieldInfo;
		if (!constraintsStatuses.hasOwnProperty(constraintName)) {
			return {
				...constraintsStatuses,
				[constraintName]: false,
			};
		}

		return {
			...constraintsStatuses,
			[constraintName]: true,
		};
	}, {});

const defineFieldsKeyConstraints = fieldsInfo => jsonSchema => {
	const keyCompositionStatuses = getKeyConstraintsCompositionStatuses(fieldsInfo, jsonSchema);
	return fieldsInfo.reduce((jsonSchemaAcc, fieldInfo) => {
		const { columnName, constraintName } = fieldInfo;
		const currentField = jsonSchemaAcc.properties[columnName];
		const compositionStatus = keyCompositionStatuses[constraintName];
		if (!currentField || compositionStatus) {
			return jsonSchemaAcc;
		}

		return {
			...jsonSchemaAcc,
			properties: {
				...jsonSchemaAcc.properties,
				[columnName]: {
					...currentField,
					...handleKey(currentField, fieldInfo),
				},
			},
		};
	}, jsonSchema);
};

module.exports = defineFieldsKeyConstraints;
