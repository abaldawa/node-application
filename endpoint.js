/*
 * Author: Abhijit Baldawa
 *
 * In this module we initialize express.js object, configure its middleware, and expose REST API's
 * */


// Module dependencies
var express = require('express'),
    app = express(),
    serverApis = require('./routes/serverapis'),
    authentication = require('./routes/security/authentication');

exports.getExpressRef=function(){
	return app;
}

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');

  if ('GET' == req.method) {
    res.header('Cache-Control', 'no-cache');
  }

  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
	  next();
  }
}

//Standard express.js middleware. 
app.configure(function(){
	app.use(express.logger('dev'));  //enable logging
	app.use(express.bodyParser());
	app.use(allowCrossDomain);
	app.use(express.static('public'));  //standard express middleware to expose static html/js
	app.use("/", authentication.checkSessionValid); //Added session check in express middleware
});

//REST API's exposed by this server for user/employee management
app.post('/api/v1/login', serverApis.login);
app.post('/api/v1/logout', serverApis.logout);
app.post('/api/v1/createuser', serverApis.createUserAccount);
app.put('/api/v1/employee/:id', serverApis.updateEmployee);
app.get('/api/v1/employee', serverApis.getEmployees);
app.post('/api/v1/employee', serverApis.createEmployee);
app.delete('/api/v1/employee/:id', serverApis.deleteEmployee);


