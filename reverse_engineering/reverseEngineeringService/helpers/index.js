const transformDatabaseTableInfoToJSON = require('./transformDatabaseTableInfoToJSON');
const reverseTableForeignKeys = require('./reverseTableForeignKeys');
const reverseTableIndexes = require('./reverseTableIndexes');
const defineRequiredFields = require('./defineRequiredFields');
const defineFieldsDescription = require('./defineFieldsDescription');
const doesViewHaveRelatedTables = require('./doesViewHaveRelatedTables');
const reverseTableCheckConstraints = require('./reverseTableCheckConstraints');
const changeViewPropertiesToReferences = require('./changeViewPropertiesToReferences');
const defineFieldsIndexes = require('./defineFieldsIndexes');
const defineMaskedColumns = require('./defineMaskedColumns');
const defineXmlFieldsCollections = require('./defineXmlFieldsCollections');

module.exports = {
	transformDatabaseTableInfoToJSON,
	reverseTableForeignKeys,
	reverseTableIndexes,
	defineRequiredFields,
	defineFieldsDescription,
	doesViewHaveRelatedTables,
	reverseTableCheckConstraints,
	changeViewPropertiesToReferences,
	defineFieldsIndexes,
	defineMaskedColumns,
	defineXmlFieldsCollections,
}