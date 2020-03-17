const transformDatabaseTableInfoToJSON = require('./transformDatabaseTableInfoToJSON');
const reverseTableForeignKeys = require('./reverseTableForeignKeys');
const reverseTableIndexes = require('./reverseTableIndexes');
const defineRequiredFields = require('./defineRequiredFields');
const defineFieldsDescription = require('./defineFieldsDescription');
const doesViewHaveRelatedTables = require('./doesViewHaveRelatedTables');
const reverseTableCheckConstraints = require('./reverseTableCheckConstraints');
const changeViewPropertiesToReferences = require('./changeViewPropertiesToReferences');
const defineFieldsKeyConstraints = require('./defineFieldsKeyConstraints');
const defineMaskedColumns = require('./defineMaskedColumns');
const defineJSONTypes = require('./defineJSONTypes');
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
	defineFieldsKeyConstraints,
	defineMaskedColumns,
	defineJSONTypes,
	defineXmlFieldsCollections,
}