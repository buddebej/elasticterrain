var ControlBar = function(viewer) {
    'use strict';
    var ui = this,
        ote = {};

    this.config = viewer.config;

    // HELPER FUNCTIONS
    var toSlider = function(v, k) {
            var m = (k !== undefined) ? k : 100.0;
            return v * m;
        },
        fromSlider = function(v, k) {
            var m = (k !== undefined) ? k : 100.0;
            return v / m;
        };

    // SELECT DOM ELEMENTS
    var MAP = $('.map'),
        CHECKED = 'checked',
        CONTROL_BAR = $('.controlBar'),
        CONTROL_BAR_BUTTON = $('#controlButton'),
        COLOR_CONTROLS = $('.colorControls'),
        KNOB_INCLINATION = $('.inclinationKnob'),
        KNOB_AZIMUTH = $('.lightAzimuthKnob'),
        KNOB_ZENITH = $('.lightZenithKnob'),
        KNOB_ROTATION = $('.rotationKnob'),
        KNOB_ROTATION1 = $('.rotationKnob1'),
        SWITCH_SHADING = $('.shadingSwitch'),
        SWITCH_WATERBODIES = $('.waterBodiesSwitch'),
        SWITCH_STACKED_CARDBOARD = $('.stackedCardboardSwitch'),
        SWITCH_SHEARING_INTERACTION = $('.shearingInteractionsSwitch'),
        SWITCH_DEBUG = $('.debugModeSwitch'),
        SLIDER_AMBIENT_LIGHT = $('.ambientLightSlider'),
        SLIDER_COLOR = $('.colorSlider'),
        SLIDER_DARKNESS = $('.darknessSlider'),
        SLIDER_EXAGGERATION = $('.exaggerationSlider'),
        SLIDER_SPRING_COEFFICIENT = $('.springCoefficientSlider'),
        SLIDER_SPRING_FRICTION = $('.springFrictionSlider'),
        SLIDER_SPRING_FADEOUT = $('.springFadeoutSlider'),
        SLIDER_HYBRID_DAMPING = $('.springHybridDamping'),
        SLIDER_SPRING_INNRAD = $('.springInnerRadiusSlider'),
        SLIDER_SPRING_OUTRAD = $('.springOuterRadiusSlider'),
        SLIDER_RESOLUTION = $('.resolutionSlider'),
        SELECT_TEXTURE = $('.textureSelect'),
        SELECT_COLOR_RAMP = $('.colorRampSelect'),
        SELECT_CONFIG = $('.configSelect'),
        SELECT_NEIGHBORHOOD_SIZE = $('.minMaxRadiusSelect'),
        INFOCONTENT = $('.infoBox .content'),
        INFOMENUE = $('.infoBox .menue'),

        SWITCH_SAVE_ZOOM = $('.saveLimitZoomlevelSwitch'),
        SWITCH_SAVE_EXTENT = $('.saveLimitExtentSwitch'),
        SWITCH_SAVE_ROTATION = $('.saveLimitRotationSwitch'),
        TEXT_SAVE_TITLE = $('.configTitleText'),
        BUTTON_SAVE_CONFIG = $('.saveconfig');

    // config control bar
    ui.options = {
        knobcolor: '#4479E3',
        collapsed: false,
        enabled: true,
        controlAnimation: 'blind', // animation of collapsing and expanding
        controlAnimationSpeed: 300, // animation of collapsing and expanding
        maxElevation: 8600, // max value for scaling of hypsometric color ramp
    };

    // config available control boxes
    ui.controls = {
        info: {
            enabled: true,
            collapsed: false
        },
        config: {
            enabled: false,
            collapsed: true
        },
        inclination: {
            enabled: false,
            collapsed: false
        },
        texture: {
            enabled: true,
            collapsed: false
        },
        shading: {
            enabled: true,
            collapsed: true,
            inactive: false
        },
        shearing: {
            enabled: true,
            collapsed: true,
            inactive: false
        },
        debug: {
            enabled: true,
            collapsed: true
        },
        rotation: {
            enabled: true,
            collapsed: true
        },
        saveConfig: {
            enabled: true,
            collapsed: true
        }
    };

    // init control boxes
    ui.initControls = function() {
        $.each(ui.controls, function(key, val) {
            var className = '.' + key;
            ui.controls[key].cont = $(className);
            ui.controls[key].head = $(className + ' .controlHeader');
            ui.controls[key].body = $(className + ' .controlBody');
            if (val.collapsed) {
                val.body.hide();
            } else {
                val.body.show();
            }
            if (val.enabled) {
                val.cont.show();
            } else {
                val.cont.hide();
            }
            // hide controls when clicked on header (ignore clicks on onoffswitch)
            val.head.click(function(e) {
                if (!val.inactive && !$(e.target).hasClass('ows')) {
                    if (val.collapsed) {
                        val.body.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
                        val.collapsed = false;
                        // collapse info box content
                        INFOCONTENT.children().hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
                        INFOMENUE.children().removeClass('active');
                    } else {
                        val.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
                        val.collapsed = true;
                    }
                }
            });
        });
    }();

    // enable or disable control 
    ui.controlActive = function(c, state) {
        if (!state) {
            c.inactive = true;
            c.head.addClass('controlHeaderInactive');
        } else {
            c.inactive = false;
            c.head.removeClass('controlHeaderInactive');
        }
    };


    ui.collapseAll = function() {
        $.each(ui.controls, function(key, val) {
            val.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            val.collapsed = true;
        });
    };
    ui.expandAll = function() {
        $.each(ui.controls, function(key, val) {
            val.body.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            val.collapsed = false;
        });
    };

    // update control tools to current parameters
    ui.updateControlTools = function() {
        KNOB_INCLINATION.val(viewer.get('obliqueInclination')).trigger('change');
        KNOB_AZIMUTH.val(viewer.get('lightAzimuth')).trigger('change');
        KNOB_ZENITH.val(viewer.get('lightZenith')).trigger('change');
        KNOB_ROTATION.val(viewer.get('viewRotation')).trigger('change');

        ui.controlActive(ui.controls.rotation, viewer.get('viewRotationEnabled'));
        SWITCH_WATERBODIES.prop(CHECKED, viewer.get('waterBodies'));
        SWITCH_STACKED_CARDBOARD.prop(CHECKED, viewer.get('stackedCardboard'));
        SWITCH_SHADING.setState(viewer.get('shading'));
        SWITCH_SHEARING_INTERACTION.setState(viewer.get('terrainInteraction'));
        SWITCH_DEBUG.prop(CHECKED, viewer.get('debug'));

        SLIDER_AMBIENT_LIGHT.slider({
            value: toSlider(viewer.get('ambientLight'))
        });
        SLIDER_COLOR.slider({
            values: viewer.get('colorScale')
        });
        SLIDER_DARKNESS.slider({
            value: toSlider(viewer.get('shadingDarkness'))
        });
        SLIDER_EXAGGERATION.slider({
            value: toSlider(viewer.get('shadingExaggeration'))
        });
        SLIDER_SPRING_COEFFICIENT.slider({
            value: toSlider(viewer.get('iSpringCoefficient'), 500)
        });
        SLIDER_SPRING_FRICTION.slider({
            value: toSlider(viewer.get('iFrictionForce'), 500)
        });
        SLIDER_SPRING_INNRAD.slider({
            value: viewer.get('iMaxInnerShearingPx')
        });
        SLIDER_SPRING_OUTRAD.slider({
            value: viewer.get('iMaxOuterShearingPx')
        });
        SLIDER_SPRING_FADEOUT.slider({
            value: toSlider(viewer.get('iStaticShearFadeOutAnimationSpeed'), 50)
        });
        SLIDER_HYBRID_DAMPING.slider({
            value: toSlider(viewer.get('iHybridDampingDuration'), 50)
        });
        SLIDER_RESOLUTION.slider({
            value: toSlider(viewer.get('resolution'))
        });

        SELECT_TEXTURE.find('option[value=' + viewer.get('texture') + ']').attr('selected', true).change();
        SELECT_COLOR_RAMP.find('option[value=' + viewer.get('colorRamp') + ']').attr('selected', true);
        SELECT_NEIGHBORHOOD_SIZE.find('option[value=' + viewer.get('iminMaxNeighborhoodSize') + ']').attr('selected', true);

    };


    // LOAD PREDEFINED CONFIGURATIONS
    ui.configManager = null;

    // update select box with configs from newStore
    ui.updateConfigStore = function(newStore) {
        viewer.setConfigStore(newStore);

        // show control
        ui.controls.config.cont.show();

        // empty select box
        SELECT_CONFIG.empty();
        SELECT_CONFIG.append($('<option></option>').val('default').html('Default')).attr('selected', true);

        // populate select box with available configs
        $.each(viewer.getConfigStore(), function(val, obj) {
            var name = (obj.title !== "") ? obj.title : obj.viewCenter[1].toFixed(2) + ', ' + obj.viewCenter[0].toFixed(2) + ' (z ' + obj.viewZoom + ')';
            SELECT_CONFIG.append($('<option></option>').val(val).html(name));
        });
    };

    // on config select change
    SELECT_CONFIG.change(function() {
        // use a copy of config for read only access during runtime
        var option = SELECT_CONFIG.find($('option:selected')).val();
        if (option !== 'default') {
            var configCopy = $.extend(true, {}, viewer.getConfigStore()[option]);
            this.config.swap(configCopy);
        } else {
            this.config.swap(this.config.init);
        }
        ui.updateControlTools();
        viewer.update();
    }.bind(this));

    BUTTON_SAVE_CONFIG.reset = function() {
        SWITCH_SAVE_ZOOM.prop(CHECKED, false);
        SWITCH_SAVE_EXTENT.prop(CHECKED, false);
        SWITCH_SAVE_ROTATION.prop(CHECKED, true);
        TEXT_SAVE_TITLE.val('');
    };

    // SAVE PREDEFINED CONFIGURATIONS
    BUTTON_SAVE_CONFIG.click(function() {
        var z = viewer.view.getZoom(),
            extent = viewer.view.calculateExtent(viewer.map.getSize()),
            zoomConstraint = (SWITCH_SAVE_ZOOM.prop(CHECKED)) ? [z, z] : viewer.get('viewZoomConstraint'),
            centerConstraint = (SWITCH_SAVE_EXTENT.prop(CHECKED)) ? extent : [],
            rotationConstraint = SWITCH_SAVE_ROTATION.prop(CHECKED),
            constraints = {
                center: centerConstraint,
                rotation: rotationConstraint,
                zoom: zoomConstraint
            };
        ui.configManager.saveConfig(TEXT_SAVE_TITLE.val(), constraints);
        BUTTON_SAVE_CONFIG.reset();
    });

    // PLAN OBLIQUE 
    // set inclination for planoblique relief
    KNOB_INCLINATION.knob({
        'width': 110,
        'height': 70,
        'max': 90,
        'min': 10,
        'step': ui.options.degreeSteps,
        'thickness': '.15',
        'readOnly': false,
        'angleOffset': -90,
        'angleArc': 90,
        'cursor': 8,
        'displayInput': false,
        'fgColor': ui.options.knobcolor,
        'change': function(v) {
            viewer.set('obliqueInclination', v);
        }
    });


    // OVERLAY MAP
    // find available overlayers and populate dropdown menu
    // create copy of layers
    var sortedLayers = [];

    Object.keys(viewer.layers).forEach(function(key) {
        sortedLayers.push({
            id: viewer.layers[key].id,
            layer: viewer.layers[key]
        });
    });

    // sort layers by pos attribute for select box
    sortedLayers.sort(function(obj1, obj2) {
        return obj1.layer.pos - obj2.layer.pos;
    }.bind(this));

    // append options to dom
    $.each(sortedLayers, function(val, obj) {
        SELECT_TEXTURE.append($('<option></option>').val(obj.layer.id).html(obj.layer.title));
    });

    // on layer changed
    SELECT_TEXTURE.change(function() {
        var selectedLayer = SELECT_TEXTURE.find($('option:selected')).val();
        if (selectedLayer === 'hypso') {
            viewer.set('texture', 'hypso');
            // hide all overlayers             
            viewer.hideLayersExcept(null);
            // show hypsometric color controls               
            COLOR_CONTROLS.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        } else {
            viewer.set('texture', selectedLayer);
            // hide other layers                             
            viewer.hideLayersExcept(selectedLayer);
            // hide hypsometric color controls
            COLOR_CONTROLS.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
    });


    // HYPSOMETRIC COLORS
    SELECT_COLOR_RAMP.change(function() {
        viewer.set('colorRamp', parseInt(SELECT_COLOR_RAMP.find($('option:selected')).val()));
    });

    // slider to stretch hypsometric colors  
    SLIDER_COLOR.slider({
        min: 0,
        max: ui.options.maxElevation,
        range: true,
        slide: function(event, ui) {
            viewer.set('colorScale', ui.values);
        }
    });

    // detection of inland waterbodies
    SWITCH_WATERBODIES.click(function() {
        var checkbox = SWITCH_WATERBODIES.find($('input'));
        if (viewer.get('waterBodies')) {
            viewer.set('waterBodies', false);
            checkbox.prop(CHECKED, false);
        } else {
            viewer.set('waterBodies', true);
            checkbox.prop(CHECKED, true);
        }
        viewer.render();
    });

    SWITCH_STACKED_CARDBOARD.click(function() {
        var checkbox = SWITCH_STACKED_CARDBOARD.find($('input'));
        if (viewer.get('stackedCardboard')) {
            viewer.set('stackedCardboard', false);
            checkbox.prop(CHECKED, false);
        } else {
            viewer.set('stackedCardboard', true);
            checkbox.prop(CHECKED, true);
        }
        viewer.render();
    });


    // SHADING
    SWITCH_SHADING.collapse = function(state) {
        if (state) {
            ui.controls.shading.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        } else {
            ui.controls.shading.body.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
    };
    SWITCH_SHADING.setState = function(state) {
        viewer.set('shading', state);
        SWITCH_SHADING.prop(CHECKED, state);
        ui.controlActive(ui.controls.shading, state);
        if (!state) {
            SWITCH_SHADING.collapse(true);
        }
        viewer.render();
    };
    //  turn shading on / off
    SWITCH_SHADING.click(function() {
        SWITCH_SHADING.setState(!viewer.get('shading'));
    });

    KNOB_AZIMUTH.knob({
        'max': 360,
        'min': 0,
        'step': ui.options.degreeSteps,
        'fgColor': ui.options.knobcolor,
        'width': 60,
        'height': 60,
        'thickness': 0.25,
        'draw': function() {
            $(this.i).val(this.cv + '°');
        },
        'change': function(v) {
            viewer.set('lightAzimuth', viewer.toStep(v));
        }
    });

    KNOB_ZENITH.knob({
        'width': 110,
        'height': 70,
        'max': 90,
        'min': 0,
        'step': ui.options.degreeSteps,
        'thickness': '.15',
        'readOnly': false,
        'angleOffset': -90,
        'displayInput': false,
        'angleArc': 90,
        'cursor': 8,
        'fgColor': ui.options.knobcolor,
        'change': function(v) {
            viewer.set('lightZenith', viewer.toStep(v));
        }
    });

    SLIDER_AMBIENT_LIGHT.slider({
        min: -100,
        max: 100,
        slide: function(event, ui) {
            viewer.set('ambientLight', fromSlider(ui.value, 200.0));
        }
    });

    SLIDER_DARKNESS.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            viewer.set('shadingDarkness', fromSlider(ui.value));
        }
    });

    SLIDER_EXAGGERATION.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            viewer.set('shadingExaggeration', fromSlider(ui.value));
        }
    });

    // TERRAIN INTERACTION
    SWITCH_SHEARING_INTERACTION.collapse = function(state) {
        if (state) {
            ui.controls.shearing.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            ui.controls.inclination.cont.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        } else {
            ui.controls.shearing.body.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
    };
    SWITCH_SHEARING_INTERACTION.setState = function(state) {
        viewer.set('terrainInteraction', state);
        viewer.shearingInteraction.setActive(state);
        SWITCH_SHEARING_INTERACTION.prop(CHECKED, state);
        ui.controlActive(ui.controls.shearing, state);
        if (!state) {
            SWITCH_SHEARING_INTERACTION.collapse(true);
        } else {
            ui.controls.inclination.cont.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
        viewer.render();
    };
    //  turn shearing on / off
    SWITCH_SHEARING_INTERACTION.click(function() {
        SWITCH_SHEARING_INTERACTION.setState(!viewer.get('terrainInteraction'));
    });

    SLIDER_SPRING_COEFFICIENT.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            viewer.set('iSpringCoefficient', fromSlider(ui.value, 500));
        }
    });
    SLIDER_SPRING_FRICTION.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            viewer.set('iFrictionForce', fromSlider(ui.value, 500));
        }
    });
    SLIDER_SPRING_INNRAD.slider({
        min: 0,
        max: 150,
        slide: function(event, ui) {
            viewer.set('iMaxInnerShearingPx', ui.value);
        }
    });
    SLIDER_SPRING_OUTRAD.slider({
        min: 0,
        max: 150,
        slide: function(event, ui) {
            viewer.set('iMaxOuterShearingPx', ui.value);
        }
    });
    SLIDER_SPRING_FADEOUT.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            viewer.set('iStaticShearFadeOutAnimationSpeed', fromSlider(ui.value, 50));
        }
    });
    SLIDER_HYBRID_DAMPING.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            viewer.set('iHybridDampingDuration', fromSlider(ui.value, 50));
        }
    });
    SELECT_NEIGHBORHOOD_SIZE.change(function() {
        viewer.set('iminMaxNeighborhoodSize', parseInt(SELECT_NEIGHBORHOOD_SIZE.find($('option:selected')).val()));
    });

    // ROTATION 
    KNOB_ROTATION.knob({
        'width': 60,
        'max': 360,
        'min': 0,
        'val': 180,
        'step': ui.options.degreeSteps,
        'thickness': '.25',
        'fgColor': ui.options.knobcolor,
        'draw': function() {
            $(this.i).val(this.cv + '°');
        },
        'change': function(v) {
            viewer.view.setRotation(viewer.toRadians(v));
            viewer.shearingInteraction.disable(); // disable shearing during rotation
            viewer.render();
        },
        'release': function(v) {
            viewer.shearingInteraction.enable(); // enable shearing during rotation
        }
    });

    // update gui rotation knob, when rotated with alt+shift+mouse
    KNOB_ROTATION.updateKnob = function(){
        var alpha = viewer.view.getRotation();
        var deg = viewer.toStep(viewer.toDegrees(alpha % (2.0 * Math.PI)));
        if (alpha < 0.0) {
            alpha = 360.0 - deg;
        } else {
            alpha = deg;
        }
        KNOB_ROTATION.val(alpha).trigger('change');
    };

    viewer.map.on('postrender', function() {
        KNOB_ROTATION.updateKnob();
    });


    // DEBUG    
    SWITCH_DEBUG.click(function() {
        var checkbox = SWITCH_DEBUG.find($('input'));
        if (viewer.get('debug')) {
            viewer.set('debug', false);
            checkbox.prop(CHECKED, false);
        } else {
            viewer.set('debug', true);
            checkbox.prop(CHECKED, true);
        }
        viewer.render();
    });

    // change resolution of rendered tiles
    SLIDER_RESOLUTION.slider({
        min: 1,
        max: 100,
        slide: function(event, ui) {
            viewer.set('resolution', fromSlider(ui.value, 100));
        }
    });

    // export
    var exportPNGElement = document.getElementById('export-png');
    if ('download' in exportPNGElement) {
        exportPNGElement.addEventListener('click', function(e) {
            viewer.map.once('postcompose', function(event) {
                var canvas = event.glContext.getCanvas();
                exportPNGElement.href = canvas.toDataURL('image/png');
            });
            viewer.map.renderSync();
        }, false);
    } else {
        var info = document.getElementById('no-download');
        info.style.display = '';
    }

    // INFO    

    INFOMENUE.click(function(e) {
        ui.collapseAll();
        var eClass = '#' + e.target.id,
            eId = '.' + e.target.id;

        if (!INFOMENUE.children(eClass).hasClass('active')) {
            INFOCONTENT.children().hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            INFOCONTENT.children(eId).show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            INFOMENUE.children().removeClass('active');
            INFOMENUE.children(eClass).addClass('active');
        } else {
            INFOCONTENT.children().hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            INFOMENUE.children().removeClass('active');
        }
    });
    INFOCONTENT.children().hide();



    // HIDE & SHOW CONTROL BOX
    if (ui.options.enabled) {
        var updateMapSize = function() {
            viewer.map.updateSize();
        };
        var showControlBar = function() {
            CONTROL_BAR.show();
            MAP.animate({
                width: $(document).width() - CONTROL_BAR.outerWidth()
            }, {
                duration: ui.options.controlAnimationSpeed,
                step: updateMapSize,
                complete: function() {
                    CONTROL_BAR.css('z-index', '100');
                }
            });
            ui.options.collapsed = false;
            $('#controlButton').html('<i class="fa fa-angle-double-right"></i>');
        };
        var hideControlBar = function() {
            MAP.animate({
                width: '100%'
            }, {
                duration: ui.options.controlAnimationSpeed,
                step: updateMapSize,
                complete: function() {
                    CONTROL_BAR.hide();
                    CONTROL_BAR.css('z-index', '-100');
                }
            });
            ui.options.collapsed = true;
            $('#controlButton').html('<i class="fa fa-cog"></i>');
        };
        var toggleControlBar = function() {
            if (ui.options.collapsed) {
                showControlBar();
            } else {
                hideControlBar();
            }
        };
        ui.controlBarButton = function() {
            var anchor = document.createElement('button');
            anchor.innerHTML = '<i class="fa fa-cog"></i>';
            anchor.id = 'controlButton';
            var handleControlBarButton = function(e) {
                e.preventDefault();
                toggleControlBar();
            };
            anchor.addEventListener('click', handleControlBarButton, false);
            anchor.addEventListener('touchstart', handleControlBarButton, false);
            var element = document.createElement('div');
            element.className = 'controlBarButton ol-control ol-unselectable';
            element.appendChild(anchor);
            ol.control.Control.call(this, {
                element: element,
            });
        };
        ol.inherits(ui.controlBarButton, ol.control.Control);
        viewer.map.addControl(new ui.controlBarButton());

        $(window).on('resize', function() {
            if (!ui.options.collapsed) {
                MAP.width($(document).width() - CONTROL_BAR.outerWidth());
                updateMapSize();
            }
        });

        // init control bar
        if (!ui.options.collapsed) {
            CONTROL_BAR.show();
            MAP.width($(document).width() - CONTROL_BAR.outerWidth());
            updateMapSize();
            $('#controlButton').html('<i class="fa fa-angle-double-right"></i>');
        }

        // init control tools        
        ui.updateControlTools();
    }


};
