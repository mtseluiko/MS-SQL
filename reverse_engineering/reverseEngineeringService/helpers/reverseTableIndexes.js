const handleDataCompression = index => {
	const compressionTypes = ['NONE', 'ROW', 'PAGE', 'COLUMNSTORE', 'COLUMNSTORE_ARCHIVE'];
	const type = compressionTypes.find(type => index.type_desc.includes(type));
	return type || '';
};

const reverseIndex = index => ({
	indxName: index.IndexName,
	ALLOW_ROW_LOCKS: index.allow_row_locks,
	ALLOW_PAGE_LOCKS: index.allow_page_locks,
	uniqueIndx: index.is_unique,
	clusteredIndx: !index.type_desc.includes('NONCLUSTERED'),
	IGNORE_DUP_KEY: index.ignore_dup_key,
	OPTIMIZE_FOR_SEQUENTIAL_KEY: index.optimize_for_sequential_key,
	indxType: (index.type === 5 || index.type === 6) ? 'Columnstore' : 'Index',
	COMPRESSION_DELAY: index.compression_delay,
	OPTIMIZE_FOR_SEQUENTIAL_KEY: Boolean(index.optimize_for_sequential_key),
	PAD_INDEX: Boolean(index.is_padded),
	FILLFACTOR: index.fill_factor,
	DATA_COMPRESSION: handleDataCompression(index),
});

const reverseIndexKey = index => {
	if (index.is_included_column) {
		return null;
	}

	return {
		name: index.columnName,
		type: index.is_descending_key ? 'descending' : 'ascending',
	};
};

const reverseIncludedKey = index => {
	if (!index.is_included_column) {
		return null;
	}

	return {
		name: index.columnName,
		type: index.is_descending_key ? 'descending' : 'ascending',
	};
};

const reverseTableIndexes = tableIndexes =>
	Object.values(tableIndexes.reduce((indexList, index) => {
		const existedIndex = indexList[index.IndexName];
		if (existedIndex) {
			return {
				...indexList,
				[index.IndexName]: {
					...existedIndex,
					indxKey: [...existedIndex.indxKey, reverseIndexKey(index)].filter(Boolean),
					indxInclude: [...existedIndex.indxInclude, reverseIncludedKey(index)].filter(Boolean),
				}
			};
		}


		return {
			...indexList,
			[index.IndexName]: {
				...reverseIndex(index),
				indxKey: [reverseIndexKey(index)].filter(Boolean),
				indxInclude: [reverseIncludedKey(index)].filter(Boolean),
			}
		};
	}, {}));

module.exports = reverseTableIndexes;
