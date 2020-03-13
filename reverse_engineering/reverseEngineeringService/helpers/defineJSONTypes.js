const defineType = value => {
	try {
		const parsedValue = JSON.parse(value);
		if (Array.isArray(parsedValue)) {
			return 'array';
		}

		if (typeof parsedValue === 'object') {
			return 'object';
		}

		return 'string'
	} catch(e) {
		return 'string';
	}
};

const handleField = (name, properties, cellValue) => {
	if (!cellValue || properties.mode !== 'nvarchar') {
		return { [name]: properties };
	}

	const type = defineType(cellValue);
	const preparedField = {
		[name]: {
			...properties,
			subType: type,
			properties: {},
		},
	};

	if (type === 'array') {
		return { ...preparedField, items: [] };
	}

	if (type === 'object') {
		return { ...preparedField, properties: {} };
	}

	return preparedField;
}

const defineJSONTypes = row => jsonSchema => {
	const [firstRow] = row;
	if (!firstRow) {
		return jsonSchema;
	}

	return {
		...jsonSchema,
		properties: Object.entries(jsonSchema.properties).reduce((acc, [fieldName, fieldProperties]) => ({
			...acc,
			...handleField(fieldName, fieldProperties, firstRow[fieldName]),
		}), {}),
	};
}

module.exports = defineJSONTypes;
