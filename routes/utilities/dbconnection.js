/*
 * Author: Abhijit Baldawa
 * 
 * This module initialize node.js mongodb client so that it can connect to mongoDB.
 * This module also handles all MongoDb I/O operations via its exposed API's
 * 
 * I could have also used mongoose instead of node.js mongodb native driver but I have
 * faced some memory leak issues with mongoose previously so not using it here.
 * 
 * MongoDB details are as below:
 * 
 * @DatabaseName "appdb"
 * 
 * @DatabaseCollections 1] users  Schema --> {"userName" : "<user name>", "password" : "<encrypted password>", "_id" : "<Mongo generated ID>"}  
 * 						2] employees  Schema --> {"firstName" : "<Employee First Name>", "lastName" : "<Employee Last Name>", "address" : "<Employee Address>", "userId" : "<user Id from users collection (_id value)>", "_id" : "<Mongo generated ID>"}
 * */

// Module dependencies
var mongo = require('mongodb'),
	ReplSetServers = require('mongodb').ReplSetServers;
    Server = mongo.Server,
    Db = mongo.Db,
    ObjectID = mongo.ObjectID,
    passwordHash = require('password-hash');
    
var dbMain,
	dbMainServers = [];

var usersCollection, employeeCollection;

/*
 * Local function to initialize mongodb collections which can later directly be used for querying 
 * */
function initDbCollections() {
	dbMain.collection('users', function (err, collection) {
		usersCollection = collection;
	});
	
	dbMain.collection('employees', function (err, collection) {
		employeeCollection = collection;
	});
}


/*
 * Local function to encrypt user password before storing it in users collections 
 * */
function hashPassword(password) {
  var hashedPassword = passwordHash.generate(password);
  return hashedPassword;
}

/* 
 * Function to confirm that a string is appropriate for conversion to a MongoDB Object ID 
 * */
function isValidObjectIdString(str) {
  if (str && ((str.length == 24 && str.match("[0-9A-Fa-f]+") !== null) || str.length == 12)) {
    return true;
  }
  return false;
}
 
/*
 * This function is used to initialize node.js mongodb client and connect it on "appdb" database
 * 
 * @param {String} hostMain
 * @param {int} portMain
 * @param {int} poolSizeMain
 * */
exports.startClient = function(hostMain, portMain, poolSizeMain) {
	if (!hostMain) {
		throw new Error("You must specify the host address for the MongoDB server.")
	} else {
	    hostsMain = hostMain.split(",");
		for (var i = 0; i < hostsMain.length; i++) {
			var dbMainServer = new Server(hostsMain[i], portMain, {auto_reconnect: true, poolSize: poolSizeMain, readPreference: "secondaryPreferred"});
		    dbMainServers.push(dbMainServer);
		    console.log('Connecting to MongoDB main at ' + hostsMain[i] + ':' + portMain);
		}
		
		var replStatMain = new ReplSetServers(dbMainServers);
		var dbOptions = { w: 1, wtimeout: 3000 };
		dbMain = new Db('appdb', replStatMain, dbOptions);
		
		dbMain.open(function (err, db) {
			if (!err) {
			  initDbCollections();
		      console.log("Connected to 'appdb' database");
			}
		});
	}
}


/*
 * This function is used to verify and query user record from users collection
 * 
 * @param {String} userName
 * @param {String} password
 * @param {function} callback
 * */
exports.login = function(userName, password, callback) {
	usersCollection.findOne({userName: userName}, function (err, userRecord) {
		if(err) {
			callback(err);
		} else if(!userRecord) {
			callback('Invalid username');
		} else if(!passwordHash.verify(password, userRecord.password)) {
			callback('Invalid Password');
		} else {
			delete userRecord.password;
			callback(null, userRecord);
		}
	});
}


/*
 * This function is used to create user record in users collection
 * 
 * @param {String} userName
 * @param {String} password
 * @param {function} callback
 * */
exports.createUserAccount = function(userName, password, callback) {	
	// Check if user record with same email ID exists. If yes callback('username exists') else allow 
	// user to create account 
	usersCollection.findOne({userName:userName}, function(err, foundUser){
		if(err) {
			callback(err);
		} else if(foundUser){
			callback('username exists');
		} else {
			var userJson = {};
			userJson.userName = userName;
			userJson.password = hashPassword(password);
			userJson.createdAt = new Date().toISOString();
			
			usersCollection.insert(userJson, function (err, usersArr) {
		    	callback(err, usersArr[0]);
		    });
		}
	});
}


/*
 * This function is used to create employee record in employees collection
 * 
 * @param {String} userId
 * @param {JSON} employeeJson
 * @param {function} callback
 * */
exports.createEmployee = function(userId, employeeJson, callback) {
	if(!isValidObjectIdString(userId)) {
		callback('Invalid ID');
		return;
	}
	
	var empObj = {};
	empObj.firstName = employeeJson.firstName;
	empObj.lastName = employeeJson.lastName;
	empObj.address = employeeJson.address;
	empObj.userId = userId;
	
	employeeCollection.insert(empObj, function (err, empArr) {
    	callback(err, empArr[0]);
    });
}


/*
 * This function is used to update employee record in employees collection
 * 
 * @param {String} employeeId
 * @param {String} userId
 * @param {JSON} employeeJson
 * @param {function} callback
 * */
exports.updateEmployee = function(employeeId, userId, employeeJson, callback) {
	if(!isValidObjectIdString(employeeId) || !isValidObjectIdString(userId)) {
		callback('Invalid ID');
		return;
	}
	
	var setObj = {};
	setObj.firstName = employeeJson.firstName;
	setObj.lastName = employeeJson.lastName;
	setObj.address = employeeJson.address;
	
	employeeCollection.findAndModify({_id: ObjectID(employeeId), userId:userId}, {}, {$set: setObj}, {new: true}, function (err, updatedEmployee) {
		if(err) {
			callback(err);
		} else if(!updatedEmployee){
			callback('not found');
		} else {
			callback(null, updatedEmployee);
		}
	});
}


/*
 * This function is used to get employees for a user from employees collection
 * 
 * @param {String} userId
 * @param {function} callback
 * */
exports.getEmployees = function(userId, callback) {
	if(!isValidObjectIdString(userId)) {
		callback('Invalid ID');
		return;
	}
	
	employeeCollection.find({userId:userId}).toArray(function(err, empList){
		callback(err, empList);
	});
}


/*
 * This function is used to delete employee of a user from employees collection
 * 
 * @param {String} employeeId
 * @param {String} userId
 * @param {function} callback
 * */
exports.deleteEmployee = function(employeeId, userId, callback) {
	if(!isValidObjectIdString(employeeId) || !isValidObjectIdString(userId)) {
		callback('Invalid ID');
		return;
	}
	
	employeeCollection.remove({userId:userId, _id: ObjectID(employeeId)}, {}, function (err, noOfEmpDeleted) {
		if(err) {
			callback(err);
		} else if(noOfEmpDeleted == 0) {
			callback('not found');
		} else {
			callback(null, 'Employee Deleted');
		}
 	});
}