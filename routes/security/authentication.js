/*
 * Author: Abhijit Baldawa
 * 
 * This module is used to verify whether session is valid using redis
 * */
// Module Dependencies
var url = require('url'),
	cache = require('./../utilities/cachehandler'),
	errors = require('./../common/errormessage');


/*
 * This method is called from express.js middleware such that before executing 
 * any API this method checks whether "x-session-id" entry is there in request header and 
 * the user session is still valid i.e. "users:x-session-id" value is there in redis cache.
 * If yes the it allows the call to EXECUTE rest API else it throws un-authorized (http code 401) or 
 * missing session info in header (http code 400) error to UI as appropriate.
 * */
exports.checkSessionValid = function(req, res, next) {
  var url_parts = url.parse(req.url, true);
  var path = url_parts.pathname.toLowerCase();
 
  // We do not want to force session check for login/createuser REST API's as user wont be logged in then
  if (path.indexOf("/api/v1/login") == -1 && path.indexOf("/api/v1/createuser") == -1) {
	  // read "x-session-id" from request header
	  var sessionId = req.get("x-session-id");
	  
	  if(sessionId) {
		  // Build redis key i.e. "users:sessionId"
	      var keyVal = "users:" + sessionId;
	      
	      // Get the value of this key from redis cache
	      cache.get(keyVal, function(err, result) {
	    	  if(err) {
	    		  res.send(500, errors.UNEXPECTED_ERROR_MESSAGE);
	    	  }else if (result != null && result != "") {
	    		  req.sessionInfo = JSON.parse(result);
	    		  cache.setExpiry(keyVal);
	    		  next();
	    	  } else {
	    		  res.send(401, errors.EXPIRED_SESSION_MESSAGE);
	    	  }
	      });
	  } else {
		  res.send(400, errors.MISSING_SESSION_MESSAGE);
	  }
  } else {
	  next();
  }
}