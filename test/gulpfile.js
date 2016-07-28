'use strict';


var gulp = require('gulp');
var swagger = require('gulp-swagger');
var lbValidator = require('../index');

var path     = require('path');
var fs       = require('fs');

// gulp task to validate swagger
gulp.task('default', function() {
    gulp.src('./fixtures/json/*.json')
    .pipe(swagger('schema.json'))
    .pipe(lbValidator({'appPath':path.resolve('./fixtures/loopback-example/server/server')}))
    .on('error',function(e){
        console.log(e.message);
    });
});
