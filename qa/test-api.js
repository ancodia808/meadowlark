var assert = require('chai').assert;
var http = require('http');
var restler = require('restler');

suite('API Tests', function(){

  var attraction = {
    lat:   45.516011,
    lng: -122.682062,
    name: 'Portland Art Museum',
    description: 'Founded in 1892, the Portland Art Museum\'s collection ' +
                 'of native art is not to be missed.  If modern art is more to your ' +
                 'liking, there are size stories of modern art for your enjoyment.',
    email: 'test@meadowlarktravel.com'
  };

  var base = 'http://localhost:3000';

  test('should be able to add an attraction', function(done){
    restler.post(base + '/api/attraction', {data:attraction}).on('success', function(data){
      assert.match(data.id, /\w/, 'id must be set');
      done();
    });
  });

  test('should be able to retrieve an attraction', function(done){
    restler.post(base + '/api/attraction', {data:attraction}).on('success', function(data){
      restler.get(base + '/api/attraction/' + data.id).on('success', function(data){
        assert(data.name===attraction.name);
        assert(data.description===attraction.description);
        done();
      });
    });
  });

});
