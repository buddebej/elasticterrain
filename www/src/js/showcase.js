var Showcase = function(viewer) {
    'use strict';

    var left = '<span class="fa-stack">\
                <i class="fa fa-circle fa-stack-1x white"></i>\
                <i class="fa fa-chevron-circle-left fa-stack-1x"></i>\
                </span>';

    var right = '<span class="fa-stack">\
                <i class="fa fa-circle fa-stack-1x white"></i>\
                <i class="fa fa-chevron-circle-right fa-stack-1x"></i>\
                </span>';

    var bubble = '<div class="bubble">Click here to customize the Elastic Terrain Map</div>';

    var CONTAINER = $('.container'),
        CONTROL_LEFT = $('<div>' + left + '</div>').addClass('showcaseControl').addClass('controlLeft'),
        CONTROL_RIGHT = $('<div>' + right + '</div>').addClass('showcaseControl').addClass('controlRight'),
        SHOWCASE_HINT = $('<div>' + bubble + '</div>').addClass('showcaseHint').hide();


    $('.map').append(CONTROL_RIGHT).append(CONTROL_LEFT);

    var exampleIndex = 0,
        examplesSeen = 0,
        changeExample = function(i) {
            viewer.swapConfig(viewer.getConfigStore()[i]);
        },
        showHint = function() {
            examplesSeen++;

            if (examplesSeen > 3) {
                SHOWCASE_HINT.fadeIn('slow');
            }
        };


    CONTROL_RIGHT.click(function() {
        if (exampleIndex < viewer.getConfigStore().length) {
            exampleIndex++;
            showHint();
        } else {
            exampleIndex = 0;
        }
        changeExample(exampleIndex);
    });

    CONTROL_LEFT.click(function() {
        if (exampleIndex > 0) {
            exampleIndex--;
            showHint();
        } else {
            exampleIndex = viewer.getConfigStore().length;
        }
        changeExample(exampleIndex);
    });

    this.hide = function() {
        CONTROL_LEFT.fadeOut();
        CONTROL_RIGHT.fadeOut();
        SHOWCASE_HINT.fadeOut('fast');
    };

    this.show = function() {
        CONTROL_LEFT.fadeIn();
        CONTROL_RIGHT.fadeIn();
    };

    CONTAINER.append(SHOWCASE_HINT);
    SHOWCASE_HINT.click(function() {
        viewer.controlBar.show();
    });

    viewer.setShowCase(this);
};
