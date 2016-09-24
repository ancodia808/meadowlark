//  3rd-party Modules
var sleep       = require('sleep');

//  Custom Modules
var fortune     = require('../lib/fortune.js');

exports.home = function(req, res){
  res.render('home');
};

exports.about = function(req, res){
    res.render('about',
               {
                 fortune: fortune.getFortune(),
                 pageTestScript: '/qa/tests-about.js'
               });
};

exports.bootstrapThemeExample = function(req, res){
  res.render('bootstrap/theme-example');
};

exports.epicFail = function(req, res){
  process.nextTick(function(){
    throw new Error('Kaboom!');
  });
};

exports.blocks = function(req, res){
  res.render('examples/blocks', {
    currency: {
      name: 'United States Dollars',
      abbrev: 'USD'
    },
    tours: [
      { name: 'Hood River', price: '$99.95' },
      { name: 'Oregon Coast', price: '$159.95' }
    ],
    specialsUrl: '/january-specials',
    currencies: [ 'USD', 'GBP', 'BTC'],
    copyrightYear: '2061'
  });
};

exports.headers = function(req, res){
  res.set('Content-Type', 'text/plain');
  var s = '';
  for(var name in req.headers) s += name + ": " + req.headers[name] + '\n';
  res.send(s);
};

exports.jqueryTest = function(req, res){
  res.render('jquery-test');
};

exports.nurseryRhyme =  function(req, res){
  res.render('nursery-rhyme');
};

exports.nurseryRhymeData = function(req, res){
  res.json({
    animal: 'squirrel',
    bodyPart: 'tail',
    adjective: 'bushy',
    noun: 'heck'
  });
};

exports.setCurrency = function(req, res){
  req.session.currency = req.params.currency;
  return res.redirect(303, '/vacations');
};

exports.sleep = function(req, res){
  sleep.sleep(1);

  res.render('sleep');
};
