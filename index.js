'use strict';

var gutil = require('gulp-util');
var swaggerSpec = require('loopback-swagger').generateSwaggerSpec;
var diff = require('deep-diff');
var path = require('path');
var yaml = require('js-yaml');
var fs   = require('fs');
var semver = require('semver');

var patchLoopbackXAny = function(loopbackSpec) {
	if(loopbackSpec.definitions && loopbackSpec.definitions['x-any']) {
		delete loopbackSpec.definitions['x-any'];
	}
};

var patchVersion = function(loopbackSpec) {
	if(loopbackSpec.info && loopbackSpec.info.version) {
		loopbackSpec.info.version = semver.major(loopbackSpec.info.version) + "." + semver.minor(loopbackSpec.info.version);
	}
};

module.exports = {
	exec : function(opt) {

		if(opt.src && opt.app) {

			var options = {
				'apiInfo': opt.app.get('apiInfo'),
				'consumes':opt.app.get('consumes'),
				'produces':opt.app.get('produces')
			};
			var loopbackSpec = swaggerSpec(opt.app,options);
			patchLoopbackXAny(loopbackSpec);
			patchVersion(loopbackSpec);

			var yamlSpec = {};
			try {
				yamlSpec = yaml.safeLoad(fs.readFileSync(opt.src, 'utf8'));
			} catch (e) {
				console.log(e);
			}

			var differences = diff(yamlSpec,loopbackSpec);

			if(differences && Array.isArray(differences) && differences.length > 0) {
				differences.forEach(function(difference) {
					gutil.log('gulp-loopback-swagger-validator:',
						gutil.colors.red(JSON.stringify(difference)));
				});
				throw new gutil.PluginError('gulp-loopback-swagger-validator', 'Mismatch detected');
			} else {
				gutil.log('gulp-loopback-swagger-validator:',
					gutil.colors.green('Swagger specification matches loopback application'));
			}

		} else {
			throw new gutil.PluginError('gulp-loopback-swagger-validator', 'Source folder is not specified');
		}
	}
};
