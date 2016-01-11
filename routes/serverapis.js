/*
 * Author: Abhijit Baldawa
 * 
 * This module implements all REST API's exposed by this server. 
 * For all Mongodb I/O operations every API gives calls to methods exposed by dbconnection module
 * */

// Module dependencies
var dbHandler = require('./utilities/dbconnection'),
	errors = require('./common/errormessage'),
	uuid = require('node-uuid'),
	cache = require('./utilities/cachehandler');

/*
 * This API is used to verify/login user, create a session info entry for that user in redis cache,
 * set its expiry time in redis and return user info JSON to UI
 * 
 * @requestJson {"email": "<email to login>", "password": "<password>"}
 * 
 * @responseJson {"userName" : "<logged in user email>", "_id" : "<mongoDb ID>",  "sessionId": "<unique session Id>"}
 * */
exports.login = function(req, res) {
	var email = req.body.email;
	var password = req.body.password;

	if (!email || !password) {
		res.send(400, errors.MISSING_INFO_MESSAGE);
		return;
	}
	
	dbHandler.login(email, password, function(err, userJson){
		if(err) {
			if(err == 'Invalid username' || err == 'Invalid Password')
				res.send(404, err);
			else
				res.send(500, errors.UNEXPECTED_ERROR_MESSAGE);
		} else {
			//Login is successful so initialize sessionInfo object
			var sessionInfo = {
				"userName":userJson.userName,
				"userId": userJson._id.toString(),
				"dateTime":new Date().toISOString()
			}
			console.log(sessionInfo);
			
			// Generate unique session ID
			var sessionId = uuid();
			userJson.sessionId = sessionId;
			
			// Set user info against users:sessionId key in redis
			cache.set('users:'+sessionId, JSON.stringify(sessionInfo));
		    cache.setExpiry('users:'+sessionId);
		    res.send(200, userJson);
		}
	});
}


/*
 * This API is used to create user account after which the user can login.
 * 
 * @requestJson {"email": "<email to create account>", "password": "<password>"}
 * 
 * @responseJson {"userName" : "<logged in user email>", "_id" : "<mongoDb ID>",  "sessionId": "<unique session Id>", "createdAt": "<created-at date ISO string>"}
 * */
exports.createUserAccount = function(req, res) {
	var email = req.body.email;
	var password = req.body.password;
	
	if (!email || !password) {
		res.send(400, errors.MISSING_INFO_MESSAGE);
		return;
	}
	
	dbHandler.createUserAccount(email, password, function(err, response){
		if(err) {
			if(err == 'username exists')
				res.send(409, errors.ACCOUNT_EXISTS_MESSAGE);
			else 
				res.send(500, errors.UNEXPECTED_ERROR_MESSAGE);
		} else {
			delete response.password;
			res.send(200, response);
		}
	});
}

/*
 * This API is used to create employee for a user
 * 
 * @requestJson {"firstName": "<Employee First Name>", "lastName": "<Employee Last Name>", "address": "<Employee address>"}
 * 
 * @responseJson {
 *	  	"firstName": "<Employee First Name>",
 *	  	"lastName": "<Employee Last Name>",
 *	  	"address": "<Employee Address>",
 *	  	"userId": "<Mongo Generated unique ID>",
 *	  	"_id": "<Mongo Generated unique employee ID>"
 *	}
 * */
exports.createEmployee = function(req, res) {
	var employeeJson = req.body;
	if(!employeeJson.firstName || !employeeJson.lastName || !employeeJson.address) {
		res.send(400, errors.MISSING_INFO_MESSAGE);
		return;
	}
	
	// Read logged in userId from sessionInfo object
	var userId = req.sessionInfo.userId;
	
	dbHandler.createEmployee(userId, employeeJson, function(err, response){
		if(err) {
			if(err == 'Invalid ID')
				res.send(400, errors.INVALID_INFO_MESSAGE);
			else
				res.send(500, errors.UNEXPECTED_ERROR_MESSAGE);
		} else {
			res.send(200, response);
		}
	});
}


/*
 * This API is used to update employee for a user
 * 
 * @param from REST URL ":id" -> Employee ID
 * 
 * @requestJson {"firstName": "<Employee First Name>", "lastName": "<Employee Last Name>", "address": "<Employee address>"}
 * 
 * @responseJson {
 *	  	"firstName": "<Employee First Name>",
 *	  	"lastName": "<Employee Last Name>",
 *	  	"address": "<Employee Address>",
 *	  	"userId": "<Mongo Generated unique ID>",
 *	  	"_id": "<Mongo Generated unique employee ID>"
 *	}
 * */
exports.updateEmployee = function(req, res) {
	var employeeId = req.params.id;
	var employeeJson = req.body;
	if(!employeeId || !employeeJson.firstName || !employeeJson.lastName || !employeeJson.address) {
		res.send(400, errors.MISSING_INFO_MESSAGE);
		return;
	}
	
	// Read logged in userId from sessionInfo object
	var userId = req.sessionInfo.userId;
	
	dbHandler.updateEmployee(employeeId, userId, employeeJson, function(err, response){
		if(err) {
			if(err == 'Invalid ID')
				res.send(400, errors.INVALID_INFO_MESSAGE);
			else if(err == 'not found')
				res.send(404, errors.NOT_FOUND_MESSAGE);
			else
				res.send(500, errors.UNEXPECTED_ERROR_MESSAGE);
		} else {
			res.send(200, response);
		}
	});
}


/*
 * This API is used to list employees managed by logged in user
 * 
 * @responseJson [
 *  	{
 *	  		"firstName": "<Employee First Name>",
 *	  		"lastName": "<Employee Last Name>",
 *	  		"address": "<Employee Address>",
 *	  		"userId": "<Mongo Generated unique ID>",
 *	  		"_id": "<Mongo Generated unique employee ID>"
 *		}
 *	]
 * */
exports.getEmployees = function(req, res) {
	// Read logged in userId from sessionInfo object
	var userId = req.sessionInfo.userId;
	
	dbHandler.getEmployees(userId, function(err, response){
		if(err) {
			if(err == 'Invalid ID')
				res.send(400, errors.INVALID_INFO_MESSAGE);
			else
				res.send(500, errors.UNEXPECTED_ERROR_MESSAGE);
		} else {
			res.send(200, response);
		}
	});
}


/*
 * This API is used to Delete employee of a user
 * 
 * @param from REST URL ":id" -> Employee ID
 * 
 * @responseText "Employee Deleted"
 * */
exports.deleteEmployee = function(req, res) {
	var employeeId = req.params.id;
	
	if(!employeeId) {
		res.send(400, errors.MISSING_INFO_MESSAGE);
		return;
	}
	var userId = req.sessionInfo.userId;
	
	dbHandler.deleteEmployee(employeeId, userId, function(err, response){
		if(err) {
			if(err == 'Invalid ID')
				res.send(400, errors.INVALID_INFO_MESSAGE);
			else if(err == 'not found')
				res.send(404, errors.NOT_FOUND_MESSAGE);
			else
				res.send(500, errors.UNEXPECTED_ERROR_MESSAGE);
		} else {
			res.send(200, response);
		}
	});
}

/*
 * This API is used to logout user by removing user sessionInfo entry from redis cache
 * */
exports.logout = function(req, res) {
	// Read session ID from header
	var sessionId = req.get("x-session-id");
	var userKey = "users:" + sessionId;
	
	// Remove user session info from redis cache.
	cache.remove(userKey);
	res.send(200);
}