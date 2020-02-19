'use strict';

const { getClient, setClient, clearClient } = require('./connectionState');
const { getObjects } = require('./databaseService/databaseService');
const { reverseCollectionsToJSON, structureJSONSchemas, getCollectionsRelationships } = require('./reverseEngineeringService/reverseEngineeringService');

module.exports = {
	async connect(connectionInfo, logger, callback, app) {
		const client = getClient();
		if (!client) {
			await setClient(connectionInfo);
			return getClient()
		}

		return client;
	},

	disconnect(connectionInfo, logger, callback, app) {
		clearClient();
		callback();
	},

	testConnection(connectionInfo, logger, callback, app) {
		callback(true);
	},

	getDatabases(connectionInfo, logger, callback, app) {
		callback();
	},

	getDocumentKinds(connectionInfo, logger, callback, app) {
		callback();
	},

	async getDbCollectionsNames(connectionInfo, logger, callback, app) {
		try {
			const client = await this.connect(connectionInfo);
			const objects = await getObjects(client);
			callback(null, objects);
		} catch(e) {
			callback({ message: error.message, stack: error.stack });
		}
	},

	async getDbCollectionsData(collectionsInfo, logger, callback, app) {
		try {
			const { collections } = collectionsInfo.collectionData;
			const client = getClient();
			const [jsonSchemas, relationships] = await Promise.all([
				await reverseCollectionsToJSON(client, collections),
				await getCollectionsRelationships(client, collections),
			]);
			callback(null, structureJSONSchemas(jsonSchemas), null, relationships);
		} catch (error) {
			callback({ message: error.message, stack: error.stack })
		}
	}
};
