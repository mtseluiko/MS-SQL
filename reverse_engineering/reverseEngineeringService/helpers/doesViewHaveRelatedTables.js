const doesViewHaveRelatedTables = (view, tables) => {
	const currentDatabaseTables = tables.filter(table => table.dbName === view.dbName && !table.relatedTables);
	const currentDatabaseTableNames = currentDatabaseTables.map(({ collectionName }) => collectionName);
	return view.relatedTables.every(relatedTable => currentDatabaseTableNames.includes(relatedTable));
};

module.exports = doesViewHaveRelatedTables;
