'use strict';

var path = require('path');
var fs = require('fs');
var url = require('url');
var es = require('event-stream');
var iconv = require('iconv-lite');
var gutil = require('gulp-util');
var fetchUrl = require("fetch").fetchUrl;
var asyncReplace = require("async-replace");

module.exports = function(filePath) {

    var go = function(file, callback) {

        // Decode input file:
        var fileContent = iconv.decode(file.contents, 'utf-8');
        if(fileContent.indexOf('�') > -1){
            fileContent = iconv.decode(file.contents, 'gbk');
            fileContent = iconv.encode(fileContent, 'utf-8');
        }


        // Catch expression like <img src="*.svg"> or <img src='*.svg'/> or <img id="*" src="*.svg" class="*" otherTag="*" />
        // Group 1 = prepend attributes (with whitespace)
        // Group 2 = svg url
        // Group 3 = append attributes (with whitespace)
        var regex = /<img([^\/>]*)\ssrc=["']([^\s]*.svg)["']([^\/>]*)\/?>/ig;

        asyncReplace(
            fileContent,
            regex,
            replaceFunction,
            function(error, result) {
                if(error!=null) {
                    throw new gutil.PluginError({
                        plugin: 'gulp-inject-svg',
                        message: 'Error in asyncReplace: '+error
                    });
                }

                // Encode output file:
                file.contents = iconv.encode(result, 'utf-8');
                callback(null, file);
            }
        );


    };

    return es.map(go);


    function replaceFunction(match, group1, group2, group3, offset, string, done){
        var src = group2;
        var attributesToEmbed = group1+group3;

        if(isLocal(src)) {
            fs.readFile("./" + src, function(error, fileContent) {
                if(error!=null){
                    throw new gutil.PluginError({
                        plugin: 'gulp-inject-svg',
                        message: 'Could not find/read SVG file (' + src + '): '+error
                    });
                }
                buildReplacingString(fileContent.toString(), attributesToEmbed);
            });
        }
        else {
            // source file is iso-8859-15 but it is converted to utf-8 automatically
            fetchUrl(
                src,
                {rejectUnauthorized: false},// useful for developers
                function(error, meta, fileContent) {
                    if(error!=null){
                        throw new gutil.PluginError({
                            plugin: 'gulp-inject-svg',
                            message: 'Could not fetch/read SVG file (' + src + '): '+error
                            +'\nIf the file is accessible from your browser, be sure to be CONNECTED to the network (it is probalby a DNS issue, not configured when no network adapter is connected)'
                        });
                    }
                    buildReplacingString(fileContent.toString(), attributesToEmbed);
                }
            );
        }

        function buildReplacingString(inlineSvg, attributesToEmbed) {
            inlineSvg = inlineSvg.replace( "<svg","<svg"+attributesToEmbed )
            done(null, inlineSvg);// done(error , replacingString)
        }

        function isLocal(href) {
            return href && !url.parse(href).hostname;
        }

    }

}