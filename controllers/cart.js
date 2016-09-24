//  Custom Modules
var constants   = require('../lib/constants.js');
var credentials = require('../credentials.js');
var emailModule = require('../lib/email.js')(credentials);

exports.cart = function(req, res){
  // We will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render('cart/cart', { csrf: 'CSRF token goes here' });
};

exports.checkout = function(req, res, next) {
  //  var cart = req.session.cart;
  var cart = {
    number: 0,
    billing: {
      name: 'Unspecified',
      email: 'Unspecified'
    }
  };

  //if(!cart) next(new Error('Cart does not exist.'));

  var name = req.body.name || '';
  var email = req.body.email || '';

  // input validation
  if(!email.match(constants.VALID_EMAIL_REGEX)) {
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
};
