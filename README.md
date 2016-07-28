# gulp-loopback-swagger-validator
--------------------------

[![NPM](https://nodei.co/npm/gulp-loopback-swagger-validator.png?downloads=true)](https://nodei.co/npm/gulp-loopback-swagger-validator/)

 [![NPM](https://nodei.co/npm-dl/gulp-loopback-swagger-validator.png?months=3&height=3)](https://nodei.co/npm/gulp-loopback-swagger-validator/)

 [![Build status](https://img.shields.io/travis/yantrashala/gulp-loopback-swagger-validator/master.svg?style=flat-square)](https://travis-ci.org/yantrashala/gulp-loopback-swagger-validator)

[Gulp][gulp] plugin that parses [Swagger][swagger] specifications in YAML format, validates against the official [Swagger 2.0 schema][swagger2spec], and compares against loopback application

Usage
--------------------------

Pre-requisite changes in [Loopback][loopback] configuration:

1. Create a folder called 'spec' and store your YAML specification file
2. Make changes to component-config.json
    Modify the configuration of the loopback-explorer component as:

```js
{
  "loopback-component-explorer": {
    "mountPath": "/explorer",
    "consumes": "${consumes}",
    "produces" : "${produces}",
    "apiInfo": "${apiInfo}"
  }
}
```

3. Make changes to config.json
    At the end of config.json file add the follow configuration:

```js
{
      "apiInfo": {
        "title": Title of the your API application as written in YAML
      },
      "consumes":Array of mime types that your application consumes (as written in YAML),
      "produces":Array of mime types that your application produces (as written in YAML)
}
```    

4. Add gulpfile task

```js
var gulp = require('gulp');
var loopbackValidator = require('gulp-loopback-swagger-validator');

gulp.task('swagger-validate', function() {
  loopbackValidator.exec({
            src: "./spec/swagger.yaml",
            app: require('./server/server')
          });
});

gulp.task('default', ['swagger-validate']);
```

Roadmap
--------------------------
- Pretty print differences
- Allow multiple spec files / Allow includes
- Test coverage

See Also
--------------------------

- [Gulp][gulp]
- [Swagger][swagger]

[gulp]: http://github.com/gulpjs/gulp
[swagger]: http://swagger.io
[loopback]: http://loopback.io
