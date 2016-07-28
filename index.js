'use strict';

var gutil = require('gulp-util');
var swaggerSpec = require('loopback-swagger').generateSwaggerSpec;
var diff = require('deep-diff');
var path = require('path');
var yaml = require('js-yaml');
var fs   = require('fs');
var semver = require('semver');
var supportsColor = require('supports-color');
var through = require("through2");
var NAME = 'gulp-loopback-swagger-validator';


module.exports = function (options) {

    if(!options && !options.appPath) {
        throw new gutil.PluginError(NAME, 'options appPath is required');
    }

    if (require.cache[options.appPath])
        delete require.cache[options.appPath];

    try {
        var app = require(options.appPath);
    } catch (e) {
        console.log(e);
        throw new gutil.PluginError(NAME, 'Error occured while loading loopback application');
    }

    if(!app.loopback) {
        throw new gutil.PluginError(NAME, 'Provided applicaiton is not a valid loopback application');
    }

    // through2.obj(fn) is a convenience wrapper around through2({ objectMode: true }, fn)
    return through.obj(function (file, encoding, callback) {

        // Always error if file is a stream since gulp doesn't support a stream of streams
        if ( file.isStream() ) {
            throw new gutil.PluginError(NAME, 'Streaming not supported');
        }

        var leftLabel, rightLabel = 'Loopback';
        try {
            if(file.path.indexOf('json') < 0) {
                leftLabel = 'YAML';
                var spec = yaml.safeLoad(file.contents);
            } else {
                leftLabel = 'JSON';
                var spec = JSON.parse(file.contents);
            }

        } catch (e) {
            console.log(e);
            throw new gutil.PluginError(NAME, 'Unable to load input YAMLs');
        }

        var loopbackSpec = swaggerSpec(app,{});

        patchLoopbackXAny(loopbackSpec);
        patchVersion(loopbackSpec);


        var errorDetected = false;
        var report = [];

        var swaggerVersionDiff = diff(spec.swagger,loopbackSpec.swagger);
        var basePathDiff = diff(spec.basePath,loopbackSpec.basePath);
        var definitionsDiff = diff(spec.definitions,loopbackSpec.definitions);
        var pathDiff = diff(spec.paths,loopbackSpec.paths);

        console.log(JSON.stringify(pathDiff));

        var reportWidth = 80;

        report.push(makeLine(reportWidth));
        report.push('|'
            + centeredText('Swagger specification comparison report',reportWidth-2)
            + '|');
        report.push(makeLine(reportWidth));
        report.push('|' + centeredText('Area',reportWidth/2-2)
            +'|'+ centeredText(leftLabel,reportWidth/4-1) +'|'
            + centeredText(rightLabel,reportWidth/4-1) +'|');
        report.push(makeLine(reportWidth));

        if(swaggerVersionDiff) {
            var result = generateReport(swaggerVersionDiff);
            var obj = result[0];
            report.push(textLine('Swagger Version',obj.leftText,
                                    obj.rightText,reportWidth,'red'));
        } else {
            report.push(textLine('Swagger Version','OK','OK',reportWidth, 'green'));
        }

        if(basePathDiff) {
            var result = generateReport(basePathDiff);
            var obj = result[0];
            report.push(textLine('Base Path',obj.leftText,
                                    obj.rightText,reportWidth,'red'));
        } else {
            report.push(textLine('Base Path','OK','OK',reportWidth, 'green'));
        }

        if(definitionsDiff) {
            var result = generateReport(definitionsDiff);
            report.push(textLine('Definitions','',
                                    '',reportWidth,'red'));
            result.forEach(function(obj,index){
                report.push(textLine(' - ' +
                        definitionsDiff[index].path,obj.leftText,
                        obj.rightText,reportWidth,
                        definitionsDiff[index].kind==='E'?'orange':'red'));
            })

        } else {
            report.push(textLine('Definitions','OK','OK',reportWidth, 'green'));
        }

        if(pathDiff) {
            var result = generateReport(pathDiff);
            report.push(textLine('Paths','',
                                    '',reportWidth,'red'));
            result.forEach(function(obj,index){
                report.push(textLine(' - ' +
                        pathDiff[index].path,obj.leftText,
                        obj.rightText,reportWidth,
                        pathDiff[index].kind==='E'?'orange':'red'));
            })

        } else {
            report.push(textLine('Paths','OK','OK',reportWidth, 'green'));
        }


        report.push(makeLine(reportWidth));


        console.log(report.join('\n'));

        if(errorDetected) {
            callback(new gutil.PluginError(NAME, 'Mismatch detected'));
            return;
        }

        callback();
    });
};

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

var compareSwaggerVersion = function(left,right) {

}
var PCT_COLS = 9,
    MISSING_COL = 15,
    TAB_SIZE = 1,
    DELIM = ' |',
    COL_DELIM = '-|';

function padding(num, ch) {
    var str = '',
        i;
    ch = ch || ' ';
    for (i = 0; i < num; i += 1) {
        str += ch;
    }
    return str;
}

function makeLine(width) {
    var elements = [];
    elements.push('|');
    elements.push(padding(width-2,'-'));
    elements.push('|');
    return elements.join('');
}

function centeredText(text, width,color) {
    var elements = [];
    var whiteSpaceLen = width - text.length;
    var len1 = Math.round(whiteSpaceLen/2);
    var len2 = whiteSpaceLen-len1;
    elements.push(padding(len1));
    elements.push(colorize(text,color));
    elements.push(padding(len2));
    return elements.join('');
}

function alignedText(text, width, leftAligned,color) {

    if(leftAligned == undefined) {
        leftAligned = true;
    }

    var elements = [];
    var whiteSpaceLen = width - text.length;

    var len1,len2;
    if(leftAligned) {
        len1 = 1;
        len2 = whiteSpaceLen-len1;
    } else {
        len2 = 1;
        len1 = whiteSpaceLen-len2;
    }
    elements.push(padding(len1));
    elements.push(colorize(text,color));
    elements.push(padding(len2));
    return elements.join('');
}

function textLine(heading,leftText,rightText,reportWidth, color) {

    if(heading.length >= reportWidth/2-5) {
        heading = heading.substring(0,(reportWidth/2-5)) + '..';
    }

    return '|' + alignedText(heading,reportWidth/2-2, color)
    +'|'+ centeredText(leftText,reportWidth/4-1, color) +'|'
    + centeredText(rightText,reportWidth/4-1, color) +'|';
}

function colorize(text, code) {
    /* istanbul ignore if: untestable in batch mode */
    var colors = {
        red: '31;1',
        orange: '33;1',
        green: '32;1'
    };

    if (supportsColor && colors[code]) {
        return '\u001b[' + colors[code] + 'm' + text + '\u001b[0m';
    }
    return text;
}

function generateReport(diff) {
    var result = [];
    if(diff && Array.isArray(diff) && diff.length > 0) {
        diff.forEach(function(DiffEdit){
            var obj = {
                leftText: '',
                rightText: ''
            };
            if(DiffEdit.kind === 'N') {
                obj.leftText = 'Missing';
                obj.rightText = '';
            } else if(DiffEdit.kind === 'D') {
                obj.leftText = '';
                obj.rightText = 'Missing';
            } else {
                obj.leftText = 'Edited';
                obj.rightText = 'Edited';
            }

            result.push(obj);
        });
    }
    return result;
}
