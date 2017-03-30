'use strict';

var path = require('path');
var fs = require('fs');
var url = require('url');
var es = require('event-stream');
var iconv = require('iconv-lite');
var gutil = require('gulp-util');
var fetchUrl = require("fetch").fetchUrl;
var asyncReplace = require("async-replace");
var $ = require('cheerio');

module.exports = function(filePath) {

    var go = function(file, callback) {
        // Decode input file:
        var fileContent = iconv.decode(file.contents, 'utf-8');
        if(fileContent.indexOf('�') > -1){
            fileContent = iconv.decode(file.contents, 'gbk');
            fileContent = iconv.encode(fileContent, 'utf-8');
        }


        // Catch expression like <img src="*.svg"> or <img src='*.svg'/> or <img id="*" src="*.svg" class="*" otherTag="*" />
        // and when inside a js file: var item = '<img src="*.svg">' or item="<img src='*.svg'>"
        // Group 1 = enclosing quote
        // Group 2 = prepend attributes (with whitespace)
        // Group 3 = svg url
        // Group 4 = append attributes (with whitespace)
        // Group 5 = enclosing quote
        var regex = /(['"`]?)<img([^\/>]*)\ssrc=["']([^\s]*.svg)["']([^\/>]*)\/?>(['"`]?)/ig;

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


    function replaceFunction(match, group1, group2, group3, group4, group5, offset, string, done){
        var src = group3;
        var attributesToEmbed = '<div '+group2+group4+' />';
        var enclosingQuote = false;
        if (group1!=="" && group5!=="") {
            enclosingQuote = true;
        }

        if(isLocal(src)) {
            fs.readFile("./" + src, function(error, fileContent) {
                if(error!=null){
                    throw new gutil.PluginError({
                        plugin: 'gulp-inject-svg',
                        message: 'Could not find/read SVG file (' + src + '): '+error
                    });
                }
                buildReplacingString(fileContent.toString(), attributesToEmbed, enclosingQuote);
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
                    buildReplacingString(fileContent.toString(), attributesToEmbed, enclosingQuote);
                }
            );
        }

        function buildReplacingString(inlineSvg, attributesToEmbedHtml, enclosingQuote) {

           // Merge attributes:
            var attributesToEmbedArray = $('div', attributesToEmbedHtml).toArray()[0].attribs;
            var $svg = $('svg', inlineSvg);
            for (var key in attributesToEmbedArray) {
                var attribute = $svg.attr(key);
                if(attribute===undefined){
                    attribute = "";
                }
                $svg.attr(key, attribute+" "+attributesToEmbedArray[key]);
            }
            inlineSvg = iconv.encode($.html($svg), 'utf-8');


            // In case there are enclosing quotes, replace them with backtick char in order to handle svg elements with linebreak
            if(enclosingQuote) {
                inlineSvg = "`"+inlineSvg+"`";
            }


            // Return: done(error , replacingString)
            done(null, inlineSvg);
        }

        function mergeAttributes(htmlTag, attributesToEmbed){
            var svgAttributes = extractAttributesIntoArray(htmlTag);
            var imgAttributes = extractAttributesIntoArray(attributesToEmbed);
            // Catch attr="*" or attr='*'
            // Group1 = attr
            // Group2 = "*" or '*'
            var regex = /\s([^\s]+)=(["][^"]*["]|['][^']*['])/ig;
            var match;
            while( (match = regex.exec(htmlTag)) != null ) {
                var LinkText = match[1];
                var Match = match[0];
                htmlTag = htmlTag.replace(new RegExp(Match, "g"), '<a href="#">" + LinkText + "</a>');
            }
        }

        function extractAttributesIntoArray(htmlTag){
            // Catch attr="*" or attr='*'
            // Group1 = attr
            // Group2 = "*" or '*'
            var regex = /\s([^\s]+)=(["][^"]*["]|['][^']*['])/ig;
            var match;
            var result = [];
            while( (match = regex.exec(htmlTag)) != null ) {
                result[match[1]] = match[2].substring(1,match[2].length-1);
            }
            return result;
        }

        function isLocal(href) {
            return href && !url.parse(href).hostname;
        }

    }

}