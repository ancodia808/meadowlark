exports.getTours = function(req, res){
  var toursXml = '<?xml version="1.0"?><tours>' +
                 tours.map(function(p){
                   return '<tour price="' + p.price +
                          '" id="' + p.id + '">' + p.name + '</tour>';
                 }).join('') +
                 '</tours>';

  //console.log('toursXml: ' + toursXml);

  var toursText = tours.map(function(p){
                    return p.id + ': ' + p.name + ' (' + p.price + ')';
                  }).join('\n');

  res.format({
    'application/json': function(){
      res.json(tours);
    },
    'application/xml': function(){
      res.type('applicaiton/xml');
      res.send(toursXml);
    },
    'text/xml': function(){
      res.type('text/xml');
      res.send(toursXml);
    },
    'text/plain': function(){
      res.type('text/plain');
      res.send(toursText);
    }
  });
};
