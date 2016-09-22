// 3rd Party Modules
var express       = require('express');
var fs            = require('fs');
var jqupload      = require('jquery-file-upload-middleware');
var mongoose      = require('mongoose');

// Custom Modules
var credentials = require('./credentials.js');
var weather     = require('./lib/weather.js');

// Custom Models (for Persistence)
var Vacation                 = require('./models/vacation.js');

var app = express();

// Set up database persistence...
var opts = {
  server: {
    socketOptions: { keepAlive: 1 }
  }
};

switch(app.get('env')){
  case 'development':
    mongoose.connect(credentials.mongo.development.connectionString, opts);
    break;
  case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, opts);
    break;
  default:
    throw new Error('Unknown execution environment: ' + app.get('env'));
};

// Load data...
require('./loaders/vacation.js')();

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

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);


var server;



//*****************************************************************************
// Middlewares - Pre-Process
//*****************************************************************************

// Use middleware to establish as Node JS "domain"...
app.use(function(req, res, next){
  // create a domain for this requests
  var domain = require('domain').create();

  // handle errors on this domain
  domain.on('error', function(err){
    console.error('DOMAIN ERROR CAUGHT\n', err.stack);

    try {
      // failsafe shutdown in 5 seconods
      setTimeout(function(){
        console.error('Failsafe shutdown.');
        process.exit(1);
      }, 5000);

      // disconnect from the clustere
      var worker = require('cluster').worker;
      if(worker) worker.disconnect();

      // stop taking new requests
      server.close();

      try {
        // attempt to use Express error route
        next(err);
      } catch(e){
        // if Express error route failed, try
        // plain Node response
        console.error('Express error mechanism failed.\n', e.stack);
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Server error.');
      }
    } catch (e) {
      console.error('Enable to send 500 response.\n', e.stack);
    }
  });

  // add the requeust and response objects to the domain
  domain.add(req);
  domain.add(res);

  // execute the rest of the request chain in the domain
  domain.run(next);
});

// Set static middleware...
app.use(express.static(__dirname + '/public'));

// Set middleware to support form posts...
app.use(require('body-parser').urlencoded({ extended: true }));

// Set middleware to support cookies...
app.use(require('cookie-parser')(credentials.cookieSecret));

// Set middleware to support memory sessions...
//app.use(require('express-session')({
//  resave: false,
//  saveUninitialized: false,
//  secret: credentials.cookieSecret
//}));

// Set middleware to support MongoDB sessions...
/*
var MongoSessionStore = require('session-mongoose')(require('connect'));
var sessionStore = new MongoSessionStore({
  url: credentials.mongo[app.get('env')].connectionString
});
*/
var session = require('express-session');
var MongoSessionStore = require('connect-mongo')(session);
var sessionStore = new MongoSessionStore({
  url: credentials.mongo[app.get('env')].connectionString
});
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
  store: sessionStore
}));


// Set middleware to process header flash messages...
app.use(function(req, res, next){
  // if there's a flash message, transfer
  // it to the context, then clear it
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

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

// Use middleware to configure logging...
switch(app.get('env')){
  case 'development':
    // compact, colorful dev logging
    app.use(require('morgan')('dev'));
    break;
  case 'production':
    // module 'express-logger' supports daily log rotation
    app.use(require('express-logger')({
      path: '/var/log/node/meadowlark.log'
    }));
}

// Use middleware to log distribution of requests across cluster...
app.use(function(req,res,next){
  var cluster = require('cluster');
  if(cluster.isWorker) console.log('Worker %d received request...',
                                   cluster.worker.id);
  next();
});


//*****************************************************************************
// Routes
//*****************************************************************************
var routes = require('./routes.js')(app);



//*****************************************************************************
// Middlewares - Post-Process
//*****************************************************************************

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



function startServer(){
  server = app.listen(app.get('port'), function(){
    console.log('Express started in ' + app.get('env') +
                ' mode on http://localhost:' + app.get('port') +
                '; press Ctrl-C to terminate.');
  });
}

if(require.main === module){
  // application run directly; start app server
  startServer();
} else {
  // application immported as a module via "require": export function
  // to create server
  module.exports = startServer;
}
