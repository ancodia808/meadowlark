var constants   = require('../lib/constants.js');

exports.getNewsletter = function(req, res){
  // We will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render('newsletter/newsletter', { csrf: 'CSRF token goes here' });
};

exports.postNewsletter = function(req, res) {
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
};

exports.process = function(req, res) {

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
};
