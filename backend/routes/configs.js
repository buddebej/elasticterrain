var Config = require('../models/config');
var express = require('express');
var router = express.Router();

// get and post
router.route('/configs')
  .get(function(req, res) {
    Config.find(function(err, configs) {
      if (err) {
        return res.send(err);
      }
 
      res.json(configs);
    });
  })
  .post(function(req, res) {
    var config = new Config(req.body);
 
    config.save(function(err) {
      if (err) {
        return res.send(err);
      }
 
      res.send({ message: 'Config Added' });
    });
  });

module.exports = router;
