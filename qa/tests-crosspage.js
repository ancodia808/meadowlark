var Browser = require('zombie');

var assert = require('chai').assert;
var browser;

suite('Cross-Page Tests', function(){

  setup(function(){
    browser = new Browser();
  });

  test('requesting a group rate quote from the hood river tour page should ' +
       'populate the referrer field', function(done){
    var referrer = 'http://localhost:3000/tours/hood-river';
    browser.visit(referrer, function(){
      browser.clickLink('.requestGroupRate', function(){
//        process.stdout.write('Referrer value: ' + browser.field('referrer').value + '\n');
//        assert(browser.field('referrer').value === referrer);
//        browser.assert.input('form input[name=referrer]', 'http://localhost:3000/tours/hood-river');
        browser.assert.input('#referrer', referrer);
        done();
      });
    });
  });

  test('requesting a group rate quote from the oregon coast tour page should ' +
       'populate the referrer field', function(done){
    var referrer = 'http://localhost:3000/tours/oregon-coast';
    browser.visit(referrer, function(){
      browser.clickLink('.requestGroupRate', function(){
        browser.assert.input('#referrer', referrer);
        done();
      });
    });
  });

/*
  test('visiting the "request group rate" page directly should result ' +
       'in an empty referrer field', function(done){
    var referrer = '';
    browser.visit('http://localhost:3000/tours/request-group-rate', function(){
      browser.assert.input('#referrer', referrer)
      done();
    });
  });
*/
});
