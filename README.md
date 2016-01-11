# Author: Abhijit Baldawa

node-application
================
This is a node.js application for user/employee management. This application is used to 
showcase how node.js can be used with express.js/redis/mongodb/clustering to build a scalable
restful http server which can expose REST API's for performing I/O operations with mongoDB as well as
serve html/js files so that user can interact with the server using UI. 

Redis is used to maintain user session info in its cache and is checked before executing
any REST API to check if the user session is valid.

Modules used in this application is as below
- Express.js
- mongodb
- redis
- node-uuid
- password-hash

Also used inbuilt "cluster" module 

1] Dependencies
----------------
- To run this application a user must have mongodb/redis servers installed and running
- The configuration for mongodb/redis/http servers can be updated in 
  node-application/settings/server-configuration.json as node-application reads this
  configuration and connects to those servers

2] Installation/Start node.js server
-------------------------------------
- Go to node-application folder on the terminal
- Execute "sudo npm install" command. This will install all the dependencies from package.json
- Once above step executes successfully then start the node.js server with "sudo node app" command

3] User Interface
------------------
- Once the server is started, in the browser, go to ex. "http://localhost:8080/html/login.html"
- From this page the user can create its account/login and can start using application

4] Functionality
--------------------
 - This is a node.js program which is used to manage user/employees
 - Once the server is started then on the login page ({protocol://server_host:server_port}/html/login.html) 
   the user can click create account and get the account created
 - Using this credentials the user can then login to the application
 - Once logged in the user can Create/Read/Update/Delete its employees from mongoDB from UI

5] Use of redis
--------------------------
- Redis is used to store user session information in its cache
- Before executing any REST API express.js middleware will check whether user session information exists in redis
- If the session info exists then it allows the call to REST API else it throws un-authorized error

6] Reason for using clustering
-------------------------------
- As Node.js is single threaded, if any uncaught exception occurs then the thread dies or becomes 
  unresponsive and we have to restart the server which is bad user experience.
  Clustering solves this problem by forking workers, so , if any uncaught exception occurs then
  the worker dies and a new worker is spawned but the master thread keeps running. Thus, the server never dies.
  Hence, clustering handles un-caught exception neatly and also utilizes all the cores of CPU. 


7] Reason for using node.js mongodb module instead of using mongoose
----------------------------------------------------------------------
- Mongoose is a very popular ODM for node.js application but I have faced memory leak issue with mongoose previously 
  so used mongodb native driver for this application.
  
8] Application Directory Structure/Files
------------------------------------------
a) node-application/app.js
   - This is the start point of the application

b) node-application/endpoint.js
   - This module is used to initialize express.js and its middleware and also 
     expose REST API's 
     
c) node-application/routes/serverapis.js
   - This module implements all REST API's routed by endpoint     
 
d) node-application/settings/server-configuration.json
   - This JSON contains http/mongodb/redis server configuration details
     
e) node-application/routes/common/errormessage.js 
   - This module contains common error messages which can be used by application
   
f) node-application/routes/utilities
   - This folder contains modules which are used to connect mongodb/redis servers and read 
     configuration from server-configuration.json making it available across application 

g) node-application/routes/security/authentication.js
   - This module is used to check session valid/invalid by express.js middleware
   
h) node-application/public
   - This folder contains html/js files which will not be included for session check
     by express.js middleware.   


   

 
    
   