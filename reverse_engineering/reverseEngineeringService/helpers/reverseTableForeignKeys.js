const reverseTableForeignKeys = (tableForeignKeys, dbName) =>
	tableForeignKeys.map(foreignKey => ({
		relationshipName: foreignKey.FK_NAME,
		dbName: dbName,
		parentCollection: foreignKey.referenced_table,
		parentField: foreignKey.referenced_column,
		childDbName: dbName,
		childCollection: foreignKey.table,
		childField: foreignKey.column,
		parentCardinality: '1',
		childCardinality: '0..n',
	}));

module.exports = reverseTableForeignKeys;
