// 3rd Party Modules
var bodyParser    = require('body-parser');
var connect       = require('connect');
var connectRest   = require('connect-rest');
var mongoose      = require('mongoose');

// Custom Modules
var credentials = require('./credentials.js');

var app = connect()
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json());

// Set up database persistence...
var opts = {
  server: {
    socketOptions: { keepAlive: 1 }
  }
};

mongoose.connect(credentials.mongo.development.connectionString, opts);

// Load data...
require('./loaders/vacations.js')();

// Establish static server object to support shutdown for fatal errors...
var server;


//*****************************************************************************
// Middlewares - Pre-Process
//*****************************************************************************


// Use middleware to configure logging...
app.use(require('morgan')('dev'));
/*
app.use(require('express-logger')({
  path: '/var/log/node/meadowlark.log'
}));
*/

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

var rest = connectRest.create(apiOptions);

// adds connect-rest middleware to connect
app.use( rest.processRequest() );


//*****************************************************************************
// Routes
//*****************************************************************************
require('./routes-rest.js')(rest);



//*****************************************************************************
// Middlewares - Post-Process
//*****************************************************************************



//*****************************************************************************
// Cluster Support
//*****************************************************************************
function startServer(){
  server = app.listen(3000, function(){
    console.log('Express started in development ' +
                ' mode on http://localhost:3000' +
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
