var Attraction = require('../models/attraction.js');

exports.getAttractions = function(req, res){
  Attraction.find({ approved: true }, function(err, attractions){
    if(err) return res.status(500).send('Error occured: database error.');
    res.json(attractions.map(function(a){
      return {
        name: a.name,
        id: a._id,
        description: a.description,
        location: a.location
      }
    }));
  });
};

exports.postAttraction = function(req, res){
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
    if(err) return res.status(500).send('Error occured: database error.');
    res.json({ id: attraction._id });
  });
};

exports.getAttraction = function(req, res){
  Attraction.findById(req.params.id, function(err, attraction){
    if(err) return res.status(500).send('Error occured: database error.');
    res.json({
      name: attraction.name,
      id: attraction._id,
      description: attraction.description,
      location: attraction.location
    });
  });
};
