/*
 * Author: Abhijit Baldawa
 * 
 * This module is used to initialize redis client and and do I/O operations with redis server
 * */

var redis = require('redis');
var redis_client;
var expiredTime = 86400; //24 hours


/*
 * This function is used to initialize redis client so that it can connect to server
 * 
 * @param {int} redisPort
 * @param {String} redisHost
 * */
exports.startClient=function(redisPort,redisHost){
  redis_client = redis.createClient(redisPort, redisHost, { max_attempts:5});

  redis_client.on("error", function (err) {
    console.log(err);
    if(redis_client.attempts >= redis_client.max_attempts) {
      console.log("EXITING NOW.");
      process.exit();
    }
  });

  redis_client.on("reconnecting", function (reconnectInfo) {
    console.log("Reconnecting....");
  });
}


/*
 * Method to save in redis cache
 * */
exports.set=function(key,value){
  try{
    redis_client.set(key, value);
    return true;
  }catch(error){
    console.log("Error occurred in saving the key "+key +" in cache"+error);
    return false;
  }
}


/*
 * Method to fetch the value for the provided key
 * */
exports.get=function(key,callback){
  try{
    redis_client.get(key,callback);
  }catch(error){
    console.log("Error occurred in fetching the key "+key +" in cache"+error);
  }
}


/*
 * Method to remove the value for the given key
 * */
exports.remove=function(key){
  try{
    redis_client.del(key);
    return true;
  }catch(error){
    console.log("Error in removing key "+error);
    return false;
  }
}

/*
 * Method to set expiry time for a redis key
 * */
exports.setExpiry=function(key){
  try{
    redis_client.expire(key, expiredTime);
    return true;
  }catch(error){
    console.log("Error occurred in setting the expiry time of the key "+key +" in cache"+error);
    return false;
  }
}

exports.getRedisHandler=function(){
  return redis_client;
}


