// Controllers
var cartController       = require('./controllers/cart.js');
var contestController    = require('./controllers/contest.js');
var mainController       = require('./controllers/main.js');
var newsletterController = require('./controllers/newsletter.js');
var tourController       = require('./controllers/tour.js');
var vacationController   = require('./controllers/vacation.js');

// APIs
var tourApi       = require('./apis/tour.js');


module.exports = function(app){

  //*****************************************************************************
  // Routes
  //*****************************************************************************
  app.get ('/',                         mainController.home);
  app.get ('/about',                    mainController.about);
  app.get ('/bootstrap-theme-example',  mainController.bootstrapThemeExample);
  app.get ('/epic-fail',                mainController.epicFail);
  app.get ('/examples/blocks',          mainController.blocks)
  app.get ('/headers',                  mainController.headers);
  app.get ('/jquery-test',              mainController.jqueryTest);
  app.get ('/nursery-rhyme',            mainController.nurseryRhyme);
  app.get ('/data/nursery-rhyme',       mainController.nurseryRhymeData);
  app.get ('/set-currency/:currency',   mainController.setCurrency);
  app.get ('/sleep',                    mainController.sleep);

  app.get ('/cart',          cartController.cart);
  app.post('/cart/checkout', cartController.checkout);

  app.get ('/contest/vacation-photo',              contestController.getVacationPhoto);
  app.get ('/contest/vacation-photo-jquery',       contestController.getVacationPhotoJQuery);
  app.post('/contest/vacation-photo/:year/:month', contestController.postVacationPhoto);

  app.get ('/newsletter', newsletterController.getNewsletter);
  app.post('/newsletter', newsletterController.postNewsletter);
  app.post('/process',    newsletterController.process);

  app.get ('/tours/hood-river',         tourController.hoodRiver);
  app.get ('/tours/oregon-coast',       tourController.oregonCoast);
  app.get ('/tours/request-group-rate', tourController.requestGroupRate);

  app.get ('/notify-me-when-in-season', vacationController.getNotifyMeWhenInSeason);
  app.post('/notify-me-when-in-season', vacationController.postNotifyMeWhenInSeason);
  app.get ('/vacations',                vacationController.vacations);

  app.get ('/api/tours', tourApi.getTours)
};
