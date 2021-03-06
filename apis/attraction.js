var Attraction = require('../models/attraction.js');

exports.getAttractions = function(req, content, cb){
  //Attraction.find({ approved: true }, function(err, attractions){
  Attraction.find(function(err, attractions){
    if(err) return cb({ error: 'Internal error.'});
    cb(null, attractions.map(function(a){
      return {
        name: a.name,
        id: a._id,
        description: a.description,
        location: a.location
      };
    }));
  });
};

exports.postAttraction = function(req, content, cb){
  var a = new Attraction({
    name: req.body.name,
    description: req.body.description,
    location: {
      lat: req.body.lat,
      lng: req.body.lng
    },
    history: {
      event: 'created',
      email: req.body.email,
      date: new Date()
    },
    approved: false
  });

  a.save(function(err, attraction){
    if(err) return cb({ error: 'Unable to add attraction.'});
    cb(null, { id: attraction._id });
  });
};

exports.getAttraction = function(req, content, cb){
  Attraction.findById(req.params.id, function(err, attraction){
    if(err) return cb({ error: 'Unable to retrieve attraction.'});
    cb(null, {
      name: attraction.name,
      id: attraction._id,
      description: attraction.description,
      location: attraction.location
    });
  });
};
