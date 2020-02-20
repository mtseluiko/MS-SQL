const handleType = type => {
	switch(type) {
		case 'smalldatetime':
		case 'time':
		case 'timestamp':
		case 'datetimeoffset':
		case 'datetime2':
		case 'datetime':
		case 'date': return { type: 'datetime', mode: type };
		case 'binary':
		case 'image':
		case 'varbinary':
		case 'binary': return { type: 'binary', mode: type };
		case 'nchar':
		case 'ntext':
		case 'text':
		case 'char':
		case 'varchar': return { type: 'char', mode: type };
		case 'bigint':
		case 'decimal':
		case 'float':
		case 'money':
		case 'numeric':
		case 'real':
		case 'smallint':
		case 'smallmoney':
		case 'tinyint':
		case 'int':
		case 'bit':
		case 'bigint': return { type: 'numeric', mode: type };
		case 'geography':
		case 'geometry':
		case 'hierarchyid':
		case 'sql_variant':
		case 'uniqueidentifier':
		case 'xml':
		case 'cursor':
		case 'rowversion':
		case 'nvarchar': return { type };
		default: return { type };
	}
};

const handleDefault = (columnType, value) => {
	if (!value) {
		return { default: '' };
	}

	const replaceRegex = /[\(|\|)]+/g;
	const validValue = {
		numeric: Number(value.replace(replaceRegex, '')),
		char: value.replace(replaceRegex, ''),
	}[columnType] || value.replace(replaceRegex, '');

	return { default: validValue };
};

const handleColumnProperty = (column, propertyName, value) => {
	switch(propertyName) {
		case 'DATA_TYPE': return handleType(value);
		case 'CHARACTER_MAXIMUM_LENGTH': return { length: value };
		case 'COLUMN_DEFAULT': return handleDefault(handleType(column['DATA_TYPE']).type, value);
		case 'IS_NULLABLE': return { required: value === 'NO' ? true : false };
		case 'CHARACTER_MAXIMUM_LENGTH': return { length: value };
		case 'NUMERIC_SCALE': return { scale: !isNaN(value) ? value : '' };
		case 'PRIMARY_KEY_COLUMN': return { primaryKey: column['COLUMN_NAME'] === value };
		default: return {};
	}
};

const transformColumnToJSON = column =>
	Object.entries(column).reduce((jsonSchema, [propertyName, value]) => ({
		...jsonSchema,
		...handleColumnProperty(column, propertyName, value),
	}), {});

const transformDatabaseTableInfoToJSON = tableInfo => tableInfo.reduce((columnSchemas, column) => ({
	required: [
		...columnSchemas.required,
		...(column['IS_NULLABLE'] === 'NO' ? [column['COLUMN_NAME']] : [])
	],
	properties: {
		...columnSchemas.properties,
		[column['COLUMN_NAME']]: transformColumnToJSON(column),
	}
}), { required: [], properties: {} });

module.exports = transformDatabaseTableInfoToJSON;
