var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var configs = require('./routes/configs'); 
var app = express(); 

var dbName = 'ote';
var connectionString = 'mongodb://localhost:27017/' + dbName;
 
mongoose.connect(connectionString);

//configure body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use('/api', configs); 
 
module.exports = app;
