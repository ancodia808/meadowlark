// 3rd Party Modules
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

// Custom Modules
var credentials = require('./credentials.js');

// Set up the transport for sending email...
/*
var mailTransport = nodemailer.createTransport('SMTP', {
  host: 'smtpout.secureserver.net',
  secureConnection: true,
  port: 465, // use SSL
  auth: {
    user: credentials.godaddySmtp.user,
    pass: credentials.godaddySmtp.password,
  }
});
*/
/*
var mailTransport = nodemailer.createTransport(smtpTransport('smtps://' +
                                               credentials.godaddySmtp.user +
                                               ':' +
                                               credentials.godaddySmtp.password +
                                               '@smtpout.secureserver.net'));
*/
var mailTransport = nodemailer.createTransport(smtpTransport({
  host: 'smtpout.secureserver.net',
  secureConnection: true,
  port: 465, // use SSL
  auth: {
    user: credentials.godaddySmtp.user,
    pass: credentials.godaddySmtp.password
  }
}));

// Text Email
/*
var mailOptions = {
  from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
  to: 'ancodia@ancodia.net',
  subject: 'Your Meadowlark Travel Tour',
  text: 'Thank you for booking your trip with Meadowlark Travel.  ' +
        'We look forward to your visit!'
};
*/

// Text and HTML Email
/*
var mailOptions = {
  from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
  to: 'ancodia@ancodia.net',
  subject: 'Your Meadowlark Travel Tour',
  html: '<h1>Meadowlark Travel</h1>\n<p>Thank you for booking your trip with Meadowlark Travel.  ' +
        '<b>We look forward to your visit!</b>',
  text: 'Thank you for booking your trip with Meadowlark Travel.  ' +
        'We look forward to your visit!'
};
*/

// HTML with generated Text Email
var mailOptions = {
  from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
  to: 'ancodia@ancodia.net',
  subject: 'Your Meadowlark Travel Tour',
  html: '<h1>Meadowlark Travel</h1>\n' +
        '<p>Thank you for booking your trip with Meadowlark Travel.  ' +
        '<b>We look forward to your visit!</b>\n' +
        '<img src="https://s3.postimg.io/l7frtbnur/Cover.jpg" alt="Meadowlark Travel">',
  generateTextFromHtml: true
};

mailTransport.sendMail(mailOptions, function(error, info){
  if(error){
    return console.error('Unable to send email: ' + error );
  }
  console.log('Message sent: ' + info.response);
});
