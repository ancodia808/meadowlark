// APIs
var attractionApi = require('./apis/attraction.js');

module.exports = function(rest){

  //*****************************************************************************
  // Routes
  //*****************************************************************************
  rest.post('/attraction',     attractionApi.postAttraction);
  rest.get ('/attraction/:id', attractionApi.getAttraction);
  rest.get ('/attractions',    attractionApi.getAttractions);
};
