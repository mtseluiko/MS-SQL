'use strict';

const { getClient, setClient, clearClient } = require('./connectionState');
const { getObjects, getDatabases } = require('./databaseService/databaseService');
const {
	reverseCollectionsToJSON,
	mergeCollectionsWithViews,
	getCollectionsRelationships,
} = require('./reverseEngineeringService/reverseEngineeringService');
const logInfo = require('./helpers/logInfo');

module.exports = {
	async connect(connectionInfo, logger, callback, app) {
		const client = getClient();
		if (!client) {
			await setClient(connectionInfo);
			return getClient();
		}

		return client;
	},

	disconnect(connectionInfo, logger, callback, app) {
		clearClient();
		callback();
	},

	async testConnection(connectionInfo, logger, callback, app) {
		try {
			logInfo('Test connection', connectionInfo, logger);
			await this.connect(connectionInfo);
			callback(null);
		} catch(error) {
			logger.log('error', { message: error.message, stack: error.stack, error }, 'Test connection');
			callback({ message: error.message, stack: error.stack });
		}
	},

	async getDatabases(connectionInfo, logger, callback, app) {
		try {
			const client = await this.connect(connectionInfo);
			const databases = await getDatabases(client);
			const databaseNames = databases.map(database => database.name);
			callback(null, databaseNames);
		} catch(error) {
			logger.log('error', { message: error.message, stack: error.stack, error }, 'Retrieving database list');
			callback({ message: error.message, stack: error.stack });
		}
	},

	getDocumentKinds(connectionInfo, logger, callback, app) {
		callback(null, []);
	},

	async getDbCollectionsNames(connectionInfo, logger, callback, app) {
		try {
			logInfo('Retrieving databases and tables information', connectionInfo, logger);
			const connectionInfoWithDatabaseName = { ...connectionInfo, databaseName: connectionInfo.database };
			const client = await this.connect(connectionInfoWithDatabaseName);
			const objects = await getObjects(client);
			callback(null, objects);
		} catch(error) {
			logger.log('error', { message: error.message, stack: error.stack, error }, 'Retrieving databases and tables information');
			callback({ message: error.message, stack: error.stack });
		}
	},

	async getDbCollectionsData(collectionsInfo, logger, callback, app) {
		try {
			logger.log('info', collectionsInfo, 'Retrieving schema', collectionsInfo.hiddenKeys);
			logger.progress({ message: 'Start reverse-engineering process' });
			const { collections } = collectionsInfo.collectionData;
			const client = getClient();
			const [jsonSchemas, relationships] = await Promise.all([
				await reverseCollectionsToJSON(logger)(client, collections),
				await getCollectionsRelationships(logger)(client, client.config.database),
			]);
			callback(null, mergeCollectionsWithViews(jsonSchemas), null, relationships);
		} catch (error) {
			logger.log('error', { message: error.message, stack: error.stack, error }, 'Reverse-engineering process failed');
			callback({ message: error.message, stack: error.stack })
		}
	}
};
