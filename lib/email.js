// 3rd Party Modules
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

module.exports = function(credentials){

  var mailTransport = nodemailer.createTransport(smtpTransport({
    host: 'smtpout.secureserver.net',
    secureConnection: true,
    port: 465, // use SSL
    auth: {
      user: credentials.godaddySmtp.user,
      pass: credentials.godaddySmtp.password
    }
  }));

  var from = '"Meadowlark Travel" <info@meadowlarktravel.com>';
  var errorRecipient = 'ancodia@ancodia.net';

  return{
    send: function(to, subj, body){

      var mailOptions = {
        from: from,
        to: to,
        subject: subj,
        html: body,
        generateTextFromHtml: true
      };

      mailTransport.sendMail(mailOptions, function(err){
        if(err) console.error('Unable to send email: ' + err);
      });
    },
    emailError: function(message, filename, exception){
      var body = '<h1>Meadowlark Travel Site Error</h1>' +
                 'message:<br><pre>' + message + '</pre><br>';
      if(exception) body += 'exception:<br><pre>' + exception + '<pre><br>';
      if(filename) body += 'filename:<br><pre>' + filename + '<pre><br>';

      var mailOptions = {
        from: from,
        to: errorRecipient,
        subject: 'Meadowlark Travel Site Error',
        html: body,
        generateTextFromHtml: true
      };

      mailTransport.sendMail(mailOptions, function(err){
        if(err) console.error('Unable to send email: ' + err);
      });
    }
  };
};
