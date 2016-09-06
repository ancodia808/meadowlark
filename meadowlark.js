// 3rd Party Modules
var express = require('express');
var formidable = require('formidable');
var jqupload = require('jquery-file-upload-middleware');

// Custom Modules
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather.js');

var app = express();

// Test JSHint..
//if ( app.thing == null ) console.log( 'bleat!' );

// set up handlebars view engine
var handlebars = require('express-handlebars').create({
  defaultLayout: 'bootstrap-basic',
  helpers: {
      section: function(name, options){
          if(!this._sections) this._sections = {};
          this._sections[name] = options.fn(this);
          return null;
      }
  }
});

// tours data (hard-coded)
var tours = [
  { id: 0, name: 'Hood River',   price: 99.99 },
  { id: 1, name: 'Oregon Coast', price: 149.95 }
];


app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);


//*****************************************************************************
// Middlewares
//*****************************************************************************

// Set static middleware...
app.use(express.static(__dirname + '/public'));

// Set middleware to support form posts...
app.use(require('body-parser').urlencoded({ extended: true }));

// Set middleware for running page tests...
app.use(function(req, res, next){
  res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
  next();
});

// Use middleware to set copyright year for use global by the layout...
app.use(function(req, res, next){
  res.locals.copyrightYear = '2016';
  next();
});

// Use middleware to inject data used by weather partials...
app.use(function(req, res, next){
  if(!res.locals.partials) res.locals.partials = {};
  res.locals.partials.weatherContext = weather.getWeatherData();
  next();
});

// Use middleware to support jQuery file upload...
app.use('/upload', function(req, res, next){
  var now = Date.now();
  jqupload.fileHandler({
    uploadDir: function(){
      return __dirname + '/public/uploads/' + now;
    },
    uploadUrl: function(){
      return '/uploads/' + now;
    }
  })(req, res, next);
});


//*****************************************************************************
// Routes - Gets
//*****************************************************************************
app.get('/', function(req, res){
  res.render('home');
});

app.get('/about', function(req, res){
    res.render('about',
               {
                 fortune: fortune.getFortune(),
                 pageTestScript: '/qa/tests-about.js'
               });
});

app.get('/api/tours', function(req, res){
  var toursXml = '<?xml version="1.0"?><tours>' +
                 tours.map(function(p){
                   return '<tour price="' + p.price +
                          '" id="' + p.id + '">' + p.name + '</tour>'
                 }).join('') +
                 '</tours>';

  //console.log('toursXml: ' + toursXml);

  var toursText = tours.map(function(p){
                    return p.id + ': ' + p.name + ' (' + p.price + ')'
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
});

app.get('/contest/vacation-photo', function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo', {
    year: now.getFullYear(),
    month: now.getMonth()
  });
});

app.get('/contest/vacation-photo-jquery', function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo-jquery', {
    year: now.getFullYear(),
    month: now.getMonth()
  });
});

app.get('/data/nursery-rhyme', function(req, res){
  res.json({
    animal: 'squirrel',
    bodyPart: 'tail',
    adjective: 'bushy',
    noun: 'heck'
  });
});

app.get('/bootstrap-theme-example', function(req, res){
  res.render('bootstrap/theme-example');
});

app.get('/examples/blocks', function(req, res){
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
});

app.get('/headers', function(req, res){
  res.set('Content-Type', 'text/plain');
  var s = '';
  for(var name in req.headers) s += name + ": " + req.headers[name] + '\n';
  res.send(s);
});

app.get('/jquery-test', function(req, res){
  res.render('jquery-test');
});

app.get('/newsletter', function(req, res){
  // We will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.get('/nursery-rhyme', function(req, res){
  res.render('nursery-rhyme');
});

app.get('/tours/hood-river', function(req, res){
  res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res){
  res.render('tours/request-group-rate');
});



//*****************************************************************************
// Routes - Posts
//*****************************************************************************
app.post('/contest/vacation-photo/:year/:month', function(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files){

    if(err) return res.redirect(303, '/error');

    console.log('Received fields:');
    console.log(fields);
    console.log('Received files:');
    console.log(files);

    res.redirect(303, '/thank-you');
  });
});

app.post('/process', function(req, res) {

  console.log('Form (from querystring): ' + req.query.form);
  console.log('CSRF token (from hidden form field): ' + req.body._csrf);
  console.log('Name (from visible form field): ' + req.body.name);
  console.log('Email (from visible form field): ' + req.body.email);

  if (req.xhr || req.accepts('json,html')==='json'){
    // if there were an error, we would send { error: 'error description' }
    res.send({ success: true });
  } else {
    res.redirect(303, '/thank-you');
  }
});



// custom 404 page
app.use(function(req, res, next){
  res.status(404);
  res.render('404');
});

// custom 500 page
app.use(function(err, req, res, next) {
  console.error(err.stack);

  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' +
              app.get('port') + '; press Ctrl-C to terminate.');
});
