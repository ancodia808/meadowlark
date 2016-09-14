// 3rd Party Modules
var express       = require('express');
var formidable    = require('formidable');
var jqupload      = require('jquery-file-upload-middleware');
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

// Custom Modules
var credentials = require('./credentials.js');
var fortune     = require('./lib/fortune.js');
var weather     = require('./lib/weather.js');
var emailModule = require('./lib/email.js')(credentials);

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

// slightly modified version of the official W3C HTML5 email regex:
// https://html.spec.whatwg.org/multipage/forms.html#valid-mail-address
var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z-0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
                                   '[a-zA-Z-0-9](?:[a-zA-Z-0-9]{0,61}[a-zA-Z-0-9])?' +
                                   '(?:\.[a-zA-Z-0-9](?:[a-zA-Z-0-9]{0,61}[a-zA-Z-0-9])?)+$');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);


// Set up the transport for sending email...
/*
var mailTransport = nodemailer.createTransport(smtpTransport({
  host: 'smtpout.secureserver.net',
  secureConnection: true,
  port: 465, // use SSL
  auth: {
    user: credentials.godaddySmtp.user,
    pass: credentials.godaddySmtp.password
  }
}));
*/

//*****************************************************************************
// Middlewares
//*****************************************************************************

// Set static middleware...
app.use(express.static(__dirname + '/public'));

// Set middleware to support form posts...
app.use(require('body-parser').urlencoded({ extended: true }));

// Set middleware to support cookies...
app.use(require('cookie-parser')(credentials.cookieSecret));

// Set middleware to support sessions...
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret
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

app.get('/cart', function(req, res){
  // We will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render('cart/cart', { csrf: 'CSRF token goes here' });
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
  res.render('newsletter/newsletter', { csrf: 'CSRF token goes here' });
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
app.post('/cart/checkout', function(req, res, next) {
//  var cart = req.session.cart;
var cart = {
  number: 0,
  billing: {
    name: 'Unspecified',
    email: 'Unspecified'
  }
};

//  if(!cart) next(new Error('Cart does not exist.'));

  var name = req.body.name || '';
  var email = req.body.email || '';

  // input validation
  if(!email.match(VALID_EMAIL_REGEX)) {
    if(req.xhr) return res.json({ error: 'Invalid name email address.' });

    req.session.flash = {
      type: 'danger',
      intro: 'Validation error!',
      message: 'The email address you entered was not valid.'
    }

    return res.redirect(303, '/cart');
  }

  // assign a random cart ID; normally we would us a database ID here
  cart.number = Math.random().toString().replace(/^0\.0*/, '');
  cart.billing = {
    name: name,
    email: email
  }

  res.render('cart/email/cart-thank-you',
             { layout: 'email', cart: cart },
             function(err, html){
               if(err) console.log('error in email template');

               /*
               var mailOptions = {
                 from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
                 to: cart.billing.email,
                 subject: 'Thank You for Booking Your Trip with Meadowlark',
                 html: html,
                 generateTextFromHtml: true
               };

               mailTransport.sendMail(mailOptions, function(err){
                 if(err) console.error('Unable to send confirmation: ' +
                                       err.stack);
               });
               */
               emailModule.send(cart.billing.email,
                                'Thank You for Booking Your Trip with Meadowlark',
                                html);
             }
  );

  req.session.flash = {
    type: 'success',
    intro: 'Thank you!',
    message: 'Thank you for booking your trip with Meadowlark.'
  }

  res.render('cart/cart-thank-you', { cart: cart });
});

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

app.post('/newsletter', function(req, res) {
  var name = req.body.name || '';
  var email = req.body.email || '';

  // input validation
  if(!email.match(VALID_EMAIL_REGEX)) {
    if(req.xhr) return res.json({ error: 'Invalid name email address.' });

    req.session.flash = {
      type: 'danger',
      intro: 'Validation error!',
      message: 'The email address you entered was not valid.'
    }

    return res.redirect(303, '/newsletter/archive');
  }
/*
  new NewsletterSignup({ name: name, email: email }).save(function(err){
    if(err) {
      if(req.xhr) return res.json({ error: 'Database error.' });

      req.session.flash = {
        type: 'danger',
        intro: 'Database error!',
        message: 'There was a database error; please try again later.'
      }

      return res.redirect(303, '/newsletter/archive');
    }
  });
*/
  if(req.xhr) return res.json({ success: true });

  req.session.flash = {
    type: 'success',
    intro: 'Thank you!',
    message: 'You have now been signed up for the newsletter.'
  }

  return res.redirect(303, '/newsletter/archive');
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
