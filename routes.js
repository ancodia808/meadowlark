var formidable    = require('formidable');
var fs            = require('fs');
var sleep         = require('sleep');

// Custom Modules
var credentials = require('./credentials.js');
var fortune     = require('./lib/fortune.js');
var emailModule = require('./lib/email.js')(credentials);

// Custom Models (for Persistence)
var Vacation                 = require('./models/vacation.js');
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');

// Set up file persistence...
// make sure data directory exists
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
  // TODO...this will come later
}

// tours data (hard-coded)
/*
var tours = [
  { id: 0, name: 'Hood River',   price: 99.99 },
  { id: 1, name: 'Oregon Coast', price: 149.95 }
];
*/

// slightly modified version of the official W3C HTML5 email regex:
// https://html.spec.whatwg.org/multipage/forms.html#valid-mail-address
var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z-0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
                                   '[a-zA-Z-0-9](?:[a-zA-Z-0-9]{0,61}[a-zA-Z-0-9])?' +
                                   '(?:\.[a-zA-Z-0-9](?:[a-zA-Z-0-9]{0,61}[a-zA-Z-0-9])?)+$');

function convertFromUSD(value, currency){
  switch(currency){
    case 'USD': return value * 1;
    case 'GBP': return value * 0.6;
    case 'BTC': return value * 0.00237037918444761;
    default: return NaN;
  }
}

module.exports = function(app){

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
  });

  app.get('/bootstrap-theme-example', function(req, res){
    res.render('bootstrap/theme-example');
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

  app.get('/epic-fail', function(req, res){
    process.nextTick(function(){
      throw new Error('Kaboom!');
    });
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

  app.get('/notify-me-when-in-season', function(req, res){
    res.render('notify-me-when-in-season', { sku: req.query.sku });
  });

  app.get('/nursery-rhyme', function(req, res){
    res.render('nursery-rhyme');
  });

  app.get('/set-currency/:currency', function(req, res){
    req.session.currency = req.params.currency;
    return res.redirect(303, '/vacations');
  });

  app.get('/sleep', function(req, res){
    sleep.sleep(1);

    res.render('sleep');
  });

  app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
  });

  app.get('/tours/oregon-coast', function(req, res){
    res.render('tours/oregon-coast');
  });

  app.get('/tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
  });

  app.get('/vacations', function(req, res){
    Vacation.find({ available: true }, function(err, vacations){
      var currency = req.session.currency || 'USD';
      var context = {
        vacations: vacations.map(function(vacation){
          return {
            sku: vacation.sku,
            name: vacation.name,
            description: vacation.description,
            inSeason: vacation.inSeason,
            price: convertFromUSD(vacation.priceInCents/100, currency),
            qty: vacation.qty
          };
        })
      };
      switch(currency){
        case 'USD': context.currencyUSD = 'selected'; break;
        case 'GBP': context.currencyGBP = 'selected'; break;
        case 'BTC': context.currencyBTC = 'selected'; break;
      }

      res.render('vacations', context);
    });
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
      };

      return res.redirect(303, '/cart');
    }

    // assign a random cart ID; normally we would us a database ID here
    cart.number = Math.random().toString().replace(/^0\.0*/, '');
    cart.billing = {
      name: name,
      email: email
    };

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
    };

    res.render('cart/cart-thank-you', { cart: cart });
  });

  app.post('/contest/vacation-photo/:year/:month', function(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files){

      if(err) {
        req.session.flash = {
          type: 'danger',
          intro: 'Oops!',
          message: 'There was an error processing your submission.  ' +
                   'Please try again.'
        };

        return res.redirect(303, '/contest/vacation-photo');
      }

  //    console.log('Received fields:');
  //    console.log(fields);
  //    console.log('Received files:');
  //    console.log(files);

      var photo = files.photo;
      var dir = vacationPhotoDir + '/' + Date.now();
      var path = dir + '/' + photo.name;

      fs.mkdirSync(dir);
      fs.renameSync(photo.path, dir + '/' + photo.name);

      saveContestEntry('vacation-photo', fields.email,
                       req.params.year, req.params.month, path);

      req.session.flash = {
        type: 'success',
        intro: 'Good luck!',
        message: 'You have been entered into the contest.'
      };

      res.redirect(303, '/contest/vacation-photo/entries');
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
      };

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
    };

    return res.redirect(303, '/newsletter/archive');
  });

  app.post('/notify-me-when-in-season', function(req, res){
    VacationInSeasonListener.update(
      { email: req.body.email },
      { $push: { skus: req.body.sku } },
      { upsert: true },
      function(err){
        if(err){
          console.error(err.stack);

          req.session.flash = {
            type: 'danger',
            intro: 'Ooops!',
            message: 'There was an error processing your request.'
          };

          return res.redirect(303, '/vacations');
        }

        req.session.flash = {
          type: 'success',
          intro: 'Thank You!',
          message: 'You will be notified when this vacation is in season.'
        };

        return res.redirect(303, '/vacations');
      }
    );
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

};
