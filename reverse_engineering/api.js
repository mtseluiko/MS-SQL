'use strict';

const { getClient, setClient, clearClient } = require('./connectionState');
const { getObjects } = require('./databaseService');

module.exports = {
	connect: function(connectionInfo, logger, callback, app) {
		return new Promise(async (resolve, reject) => {
			const client = getClient();
			if (!client) {
				try {
					await setClient(connectionInfo);
					resolve(getClient());
				} catch(error) {
					reject(error);
				}
			}

			resolve(client);
		});
	},

	disconnect: function(connectionInfo, logger, callback, app){
		clearClient();
		callback();
	},

	testConnection: function(connectionInfo, logger, callback, app){
		callback(true);
	},

	getDatabases: function(connectionInfo, logger, callback, app){
		callback();
	},

	getDocumentKinds: function(connectionInfo, logger, callback, app) {
		callback();
	},

	getDbCollectionsNames: function(connectionInfo, logger, callback, app) {
		this.connect(connectionInfo)
			.then(client => getObjects(client).then(objects => callback(null, objects)))
			.catch(error => callback({ message: error.message, stack: error.stack }));
	},

	getDbCollectionsData: function(connectionInfo, logger, callback, app) {
		const client = getClient();
		callback({ client: client && client.config })
	}
};
