"use strict";

var path = require("path");
var execFile = require("child_process").execFile;

var phantomjsCmd = require("phantomjs").path;
var converterFileName = path.resolve(__dirname, "./converter.js");

module.exports = function svgToPngWithScale(sourceFileName, destFileName, param1, param2, cb) {
    var args;
    if (typeof param1 === "function") {
        cb = param1;
        args = [converterFileName, sourceFileName, destFileName, 1.0];
    } else if (typeof param2 === "function") {
        cb = param2;
        args = [converterFileName, sourceFileName, destFileName, param1];       // convert with a given scale
    } else {
        args = [converterFileName, sourceFileName, destFileName, param1, param2];  // convert with a target dimension
    }

    execFile(phantomjsCmd, args, function (err, stdout, stderr) {
        if (err) {
            cb(err);
        } else if (stdout.length > 0) { // PhantomJS always outputs to stdout.
            cb(new Error(stdout.toString().trim()));
        } else if (stderr.length > 0) { // But hey something else might get to stderr.
            cb(new Error(stderr.toString().trim()));
        } else {
            cb(null);
        }
    });
};
