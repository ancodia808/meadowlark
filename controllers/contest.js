// 3rd Party Modules
var formidable    = require('formidable');
var fs            = require('fs');

// Set up file persistence...
// make sure data directory exists
var dataDir = __dirname + '/data';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);

var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
  // TODO...this will come later
}


exports.getVacationPhoto = function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo', {
    year: now.getFullYear(),
    month: now.getMonth()
  });
};

exports.getVacationPhotoJQuery = function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo-jquery', {
    year: now.getFullYear(),
    month: now.getMonth()
  });
};

exports.postVacationPhoto = function(req, res) {
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
};
