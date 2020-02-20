const reverseTableIndexes = (tableIndexes) =>
	tableIndexes.map(index => ({
		indxName: index.IndexName,
		ALLOW_ROW_LOCKS: index.allow_row_locks,
		ALLOW_PAGE_LOCKS: index.allow_page_locks,
		uniqueIndx: index.is_unique,
		clusteredIndx: index.type_desc !== 'NONCLUSTERED',
		IGNORE_DUP_KEY: index.ignore_dup_key,
		OPTIMIZE_FOR_SEQUENTIAL_KEY: index.optimize_for_sequential_key,
	}));

module.exports = reverseTableIndexes;
