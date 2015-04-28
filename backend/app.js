var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var configs = require('./routes/configs'); 
var app = express(); 

var dbName = 'ote';
var connectionString = 'mongodb://localhost:27017/' + dbName;
 
mongoose.connect(connectionString);

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://elasticterrain.xyz');
    res.header('Access-Control-Allow-Origin', 'http://eu.elasticterrain.xyz');
    res.header('Access-Control-Allow-Origin', 'http://us-west.elasticterrain.xyz');    
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

//configure body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(allowCrossDomain);
app.use('/api', configs); 
 
module.exports = app;
