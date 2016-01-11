/*
 * Author: Abhijit Baldawa
 * 
 * This module is used to read http/mongodb/redis configuration from server-configurations.json
 * */

var configuration = require('./../../settings/server-configuration.json');
var confighttpServer, configMongoDb,configRedis;

exports.start = function() {
	//read http-Server Config
	confighttpServer = configuration['http-server'];
	
    //read Redis Config
    configRedis = configuration['redis'];

    //read MongoDB Config
    configMongoDb = configuration['mongodb'];
}


/*
 * This function is used to get configuration of http/mongodb/redis server
 * 
 * @param {String} configName
 * @return {String}
 * */
exports.getConfigSection = function(configName) {
    if(configName == 'http-server')
        return confighttpServer;
    else if(configName == 'redis')
        return configRedis;
    else if(configName == 'mongodb')
        return configMongoDb;
}