"use strict";
/*global phantom: false*/

var webpage = require("webpage");
var system = require("system");

if (system.args.length === 4) {
    convertWithScale(system.args[1], system.args[2], Number(system.args[3]));
} else if (system.args.length === 5) {
    convertWithTargetSize(system.args[1], system.args[2], Number(system.args[3]), Number(system.args[4]));
} else {
    console.error("Usage: converter.js source dest scale");
    console.error("Usage: converter.js source dest targetWidth targetHeight");
    phantom.exit();
}

function convertWithScale(source, dest, scale) {
    var page = webpage.create();

    page.open(source, function (status) {
        if (status !== "success") {
            console.error("Unable to load the source file.");
            phantom.exit();
            return;
        }

        try {
            var dimensions = getSvgDimensions(page);
            page.viewportSize = {
                width: Math.round(dimensions.width * scale),
                height: Math.round(dimensions.height * scale)
            };
            if (dimensions.shouldScale) {
                page.zoomFactor = scale;
            }
        } catch (e) {
            console.error("Unable to calculate dimensions.");
            console.error(e);
            phantom.exit();
            return;
        }

        // This delay is I guess necessary for the resizing to happen?
        setTimeout(function () {
            page.render(dest);
            phantom.exit();
        }, 0);
    });
}

function convertWithTargetSize(source, dest, targetWidth, targetHeight) {
    var page = webpage.create();

    page.open(source, function (status) {
        if (status !== "success") {
            console.error("Unable to load the source file.");
            phantom.exit();
            return;
        }

        try {
            var dimensions = getSvgDimensions(page);
            var scale = 1.0;

            if (targetHeight === 0) {
                scale = targetWidth / dimensions.width;
                targetHeight = dimensions.height * scale;
            } else if (targetWidth === 0) {
                scale = targetHeight / dimensions.height;
                targetWidth = dimensions.width * scale;
            }

            page.viewportSize = {
                width: Math.round(targetWidth),
                height: Math.round(targetHeight)
            };
        } catch (e) {
            console.error("Unable to calculate dimensions.");
            console.error(e);
            phantom.exit();
            return;
        }

        setTimeout(function () {
            page.render(dest);
            phantom.exit();
        }, 0);
    });
}

function getSvgDimensions(page) {
    return page.evaluate(function () {
        /*global document: false*/

        var el = document.documentElement;
        var bbox = el.getBBox();

        var widthAttr = el.getAttribute("width") || "";
        var heightAttr = el.getAttribute("height") || "";   
        var width = widthAttr.match(/^[0-9.]+(px)?$/)? parseFloat(widthAttr) : undefined;
        var height = heightAttr.match(/^[0-9.]+(px)?$/)? parseFloat(heightAttr) : undefined;
        var hasWidthOrHeight = width || height;
        var viewBoxWidth = el.viewBox.animVal.width;
        var viewBoxHeight = el.viewBox.animVal.height;
        var usesViewBox = viewBoxWidth && viewBoxHeight;

        if (usesViewBox) {
            if (width && !height) {
                height = width * viewBoxHeight / viewBoxWidth;
            }
            if (height && !width) {
                width = height * viewBoxWidth / viewBoxHeight;
            }
            if (!width && !height) {
                width = viewBoxWidth;
                height = viewBoxHeight;
            }
        }

        if (!width) {
            width = bbox.width + bbox.x;
        }
        if (!height) {
            height = bbox.height + bbox.y;
        }

        return { width: width, height: height, shouldScale: hasWidthOrHeight || !usesViewBox };
    });
}
