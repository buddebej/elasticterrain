var Showcase = function(viewer) {
    'use strict';

    var left = '<span class="fa-stack" title="Browse maps">\
                <i class="fa fa-circle fa-stack-1x white fa-lg"></i>\
                <i class="fa fa-chevron-circle-left fa-stack-1x"></i>\
                </span>';

    var right = '<span class="fa-stack" title="Browse maps">\
                <i class="fa fa-circle fa-stack-1x white fa-lg"></i>\
                <i class="fa fa-chevron-circle-right fa-stack-1x"></i>\
                </span>';


    var CONTAINER = $('.map'),
        CONTROL_LEFT = $('<div>' + left + '</div>').addClass('showcaseControl').addClass('controlLeft').hide(),
        CONTROL_RIGHT = $('<div>' + right + '</div>').addClass('showcaseControl').addClass('controlRight').hide(),
        SHOWCASE_HINT = $('<div><div class="bubble">Click here to customize the Elastic Terrain Map</div></div>').addClass('showcaseHintControlPanel').hide();


    CONTAINER.append(CONTROL_RIGHT).append(CONTROL_LEFT);

    var exampleIndex = 0,
        examplesSeen = 0,
        changeExample = function(i) {
            viewer.swapConfig(viewer.getConfigStore()[i]);
            viewer.controlBar.updateControlTools();
            // reset low mesh resolution for new config
            viewer.dem.setAutoResolution({
                low: false
            });
        },
        showHint = function() {
            examplesSeen++;
            if (examplesSeen === 1) {
                SHOWCASE_HINT.fadeIn('slow');
            }
        };


    CONTROL_RIGHT.click(function() {
        if (exampleIndex < viewer.getConfigStore().length-1) {
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
            exampleIndex = viewer.getConfigStore().length-1;
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
    this.show();

    // fps alert
    var ALERT_BUBBLE = $('<div class="alertBubble"><b>Slow Animation <i class="fa fa-times"></i></b><br>Shrink your browser window to increase rendering performance.<br>Performance is best with an up-to-date version of Google Chrome or Chromium.</div>').hide().click(function() {
        $(this).fadeOut();
    });
    CONTAINER.append(ALERT_BUBBLE);
    var lowFpsAlert = function(state) {
        if (state) {
            if (this.hasOwnProperty('alerts')) {
                this.alerts++;
            } else {
                this.alerts = 1;
            }
            if (this.alerts < 5) {
                ALERT_BUBBLE.fadeIn();
            }
        } else {
            ALERT_BUBBLE.fadeOut();
        }
    };
    viewer.shearingInteraction.setLowFpsAlert(lowFpsAlert);

    // reset low mesh resolution on resize
    $(window).resize(function() {
        viewer.dem.setAutoResolution({
            low: false
        });
    });

    viewer.swapConfig(viewer.getConfigStore()[exampleIndex]);
    viewer.controlBar.updateControlTools();
};
