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


// update
router.route('/configs/:id').put(function(req,res){
  Config.findOne({ _id: req.params.id }, function(err, configs) {
    if (err) {
      return res.send(err);
    }
 
    for (prop in req.body) {
      configs[prop] = req.body[prop];
    }
 
    // save the configs
    configs.save(function(err) {
      if (err) {
        return res.send(err);
      }
 
      res.json({ message: 'Config updated!' });
    });
  });
});


module.exports = router;
