const filterRelationships = (relationships, collections) =>
	relationships.filter(relationship => Boolean(
		collections.find(({ collectionName, dbName }) =>
			dbName === relationship.dbName
			&& (relationship.childCollection === collectionName || relationship.parentCollection === collectionName))
	));

module.exports = filterRelationships;