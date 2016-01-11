/*
 * Author: Abhijit Baldawa
 *
 * This is the start point of application where clustering, mongo-db, redis, express-http server
 * are initialized.
 * */

// Module dependencies
var fs = require('fs'),
    endpoint= require('./endPoint'),
    http = require('http'),
    config = require('./routes/utilities/config'),
    dbHandler = require('./routes/utilities/dbconnection'),
    cache = require('./routes/utilities/cachehandler'),
    cluster = require('cluster');

// As Node.js is single threaded, if any uncaught exception occurs then the thread dies or becomes 
// unresponsive and we have to restart the server which is bad user experience.
// Clustering solves this problem by forking workers, so , if any uncaught exception occurs then
// the worker dies (and a new worker is spawned) but the master thread keeps running. 
// Thus, clustering handles un-caught exception neatly and also utilizes all the cores of CPU. 
if (cluster.isMaster) {
	var cpuCount = require('os').cpus().length;
	
	// For each cpu core fork a worker
	 for (var i = 0; i < cpuCount; i++) {
		console.log("Spawning worker...");
        cluster.fork();
	 }
	 
	 cluster.on('exit', function (worker) {
        // Replace the dead worker
        console.log('Worker ' + worker.id + ' died :(');
        var newWorker = cluster.fork();
        console.log("Spawning new worker ");
	  });
	 
	 // Handle uncaught exception
	 process.on('uncaughtException', function (err) {
		console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
		console.error(err.stack);
		process.exit(1);
	});
} else{

// Handle configuration. This reads configuration of http/mongo-db/redis server 
// from settings/server-configuration. User can change configuration of any server
// by making changes in server-configuration file
config.start();

//Get http-server config
var configHttpServer = config.getConfigSection('http-server');

// Connect to MongoDb database
var configMongoDb = config.getConfigSection('mongodb');
var hostMain = configMongoDb.hostMain;
var portMain = configMongoDb.portMain;
var poolSizeMain = configMongoDb.poolSizeMain;
dbHandler.startClient(hostMain, portMain, poolSizeMain);

//Connect to Redis cache
var configRedis = config.getConfigSection('redis');
var redisHost = configRedis.host;
var redisPort = configRedis.port;
console.log('Connecting to Redis at ' + redisHost + ':' + redisPort);
cache.startClient(redisPort, redisHost);

var contents =  "var serverConfig = { "
  + "'protocol' : '"+configHttpServer.protocol+"',"
  + "'host' : '"+ configHttpServer.host+"',"
  + "'port' : '"+ configHttpServer.port+"'};";

//Write http server configuration (from contents) in server.js so that it can be used from UI to hit REST API's
//at this server configuration
fs.writeFile(__dirname+'/public/js/server.js', contents, function(err) {
  if(err) {
    console.log(err);
  }
  else {
    console.log('server file, server.js, written okay.');
  }
});

var httpServer = http.createServer(endpoint.getExpressRef());

//Start Server
httpServer.listen(configHttpServer.port, function() {
  console.log((new Date()) + ' Server is listening on'+ configHttpServer.protocol + configHttpServer.host+":"+configHttpServer.port);
});
}

