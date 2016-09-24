// tours data (hard-coded)
/*
var tours = [
  { id: 0, name: 'Hood River',   price: 99.99 },
  { id: 1, name: 'Oregon Coast', price: 149.95 }
];
*/

exports.hoodRiver = function(req, res){
  res.render('tours/hood-river');
};

exports.oregonCoast = function(req, res){
  res.render('tours/oregon-coast');
};

exports.requestGroupRate = function(req, res){
  res.render('tours/request-group-rate');
};
