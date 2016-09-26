// 3rd Party Modules
var bodyParser    = require('body-parser');
var connect       = require('connect');
var connectRest   = require('connect-rest');
var express       = require('express');
var fs            = require('fs');
var jqupload      = require('jquery-file-upload-middleware');
var mongoose      = require('mongoose');

// Custom Modules
var credentials = require('./credentials.js');
var weather     = require('./lib/weather.js');

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
require('./loaders/vacations.js')();

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


// Establish static server object to support shutdown for fatal errors...
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

// Use middleware to enable CORS for the API...
app.use('/api', require('cors')());


//*****************************************************************************
// REST API Support...
//*****************************************************************************
/*
var connectApp = connect()
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json());
*/

var apiOptions = {
  context: '/api',
  //logger: { file: 'mochaTest.log', level: 'debug' },
  //apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
  //// discover: { path: 'discover', secure: true },
  //// proto: { path: 'proto', secure: true },
  domain: require('domain').create()
};

apiOptions.domain.on('error', function(err){
  console.log('API domain error.\n', err.stack);
  setTimeout(function(){
    console.log('Server shutting down after API domain error.');
    process.exit(1);
  }, 5000);
  server.close();
  var worker = require('cluster').worker;
  if(worker) worker.disconnect();
});

//app.use(rest.rester(apiOptions));

var rest = connectRest.create(apiOptions);

// adds connect-rest middleware to connect
app.use( rest.processRequest() );


//*****************************************************************************
// Routes
//*****************************************************************************
require('./routes.js')(app);
require('./routes-rest.js')(rest);



//*****************************************************************************
// Middlewares - Post-Process
//*****************************************************************************

// Auto Views...
var autoViews = {};

app.use(function(req,res,next){
  var path = req.path.toLowerCase();

  // check cache; if it's there, render the view
  if(autoViews[path]) return res.render(autoViews[path]);

  // if it's not in the cache, see if there's
  // a .handlebars file that matches
  if(fs.existsSync(__dirname + '/views' + path + '.handlebars')){
    autoViews[path] = path.replace(/^\//, '');
    return res.render(autoViews[path]);
  }

  // no view found; pass on to 404 handler
  next();
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


//*****************************************************************************
// Cluster Support
//*****************************************************************************
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
  // application imported as a module via "require": export function
  // to create server
  module.exports = startServer;
}
