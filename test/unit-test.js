var loopback = require('loopback');
var swaggerValidator = require('../');
var expect = require('chai').expect;
var application;
var gulp = require('gulp');
var path     = require('path');
describe('Compare Json Created from loopback application.', function() {

  it('should return table chart of missing items', function(done) {
      var swag = swaggerValidator({'appPath':path.resolve('./test/fixtures/loopback-example/server/server')})
      gulp.src('./test/fixtures/json/*.json')
      .pipe(swag)
      .on('finish', function() {
        done();
      })
      .on('error', function(e) {
        throw(e);
      })
  });

  it('should return return error if apppath is not provided.', function(done) {
      var testJson = require('./fixtures/json/pet.json');
      expect(swaggerValidator.bind()).to.throw(Error);
      done();
  });


});
