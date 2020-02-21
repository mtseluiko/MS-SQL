const transformDatabaseTableInfoToJSON = require('./transformDatabaseTableInfoToJSON');
const reverseTableForeignKeys = require('./reverseTableForeignKeys');
const reverseTableIndexes = require('./reverseTableIndexes');
const defineRequiredFields = require('./defineRequiredFields');
const defineFieldsDefault = require('./defineFieldsDefault');

module.exports = {
	transformDatabaseTableInfoToJSON,
	reverseTableForeignKeys,
	reverseTableIndexes,
	defineRequiredFields,
	defineFieldsDefault,
}