var ControlBar = function(viewer) {
    'use strict';
    var ui = this,
        ote = {};

    this.config = viewer.config;
    viewer.setControlBar(this);

    $(function() {
        $(document).tooltip();
    });

    // HELPER FUNCTIONS
    this.initSlider = function(container, attr) {
        var sliderSize = 200;
        var constraints = this.config.getConstraints(attr);
        // init jquery ui slider
        container.slider({
            min: 0,
            max: sliderSize,
            slide: function(event, slider) {
                // provide a normalized value based on parameter constraints defined in config.js
                var normalizedValue = slider.value * ((constraints[1] - constraints[0]) / sliderSize) + constraints[0];
                viewer.set(attr, normalizedValue);
            }
        });
        // slider value updater
        container.update = function() {
            // provide a normalized value based on parameter constraints defined in config.js            
            var normalizedValue = sliderSize * (viewer.get(attr) - constraints[0]) / (constraints[1] - constraints[0]);
            this.slider({
                value: normalizedValue
            });
        };
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
        SWITCH_DYNAMIC_COLORS = $('.dynamicColorsSwitch'),
        SWITCH_STACKED_CARDBOARD = $('.stackedCardboardSwitch'),
        SWITCH_SHEARING_INTERACTION = $('.shearingInteractionsSwitch'),
        SWITCH_DEBUG = $('.debugModeSwitch'),
        SWITCH_WIREFRAME = $('.wireframeModeSwitch'),
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
        INFOCONTENT = $('.infoBox .content'),
        INFOMENUE = $('.infoBox .menue'),

        SWITCH_SAVE_ZOOM = $('.saveLimitZoomlevelSwitch'),
        SWITCH_SAVE_EXTENT = $('.saveLimitExtentSwitch'),
        SWITCH_SAVE_ROTATION = $('.saveLimitRotationSwitch'),
        TEXT_SAVE_TITLE = $('.configTitleText'),
        BUTTON_SAVE_CONFIG = $('.saveconfig'),
        BUTTON_EDIT_CONFIG = $('.editconfig').hide();


    // config control bar
    ui.options = {
        knobcolor: '#4479E3',
        collapsed: true,
        enabled: true,
        controlAnimation: 'blind', // animation of collapsing and expanding
        controlAnimationSpeed: 300, // animation of collapsing and expanding
        maxElevation: 9000, // max value for scaling of hypsometric color ramp
        minElevation: -11000, // max value for scaling of hypsometric color ramp        
    };

    ui.enable = function() {
        ui.options.enabled = true;
        ui.init();
    };

    // config available control boxes
    ui.controls = {
        info: {
            enabled: true,
            collapsed: false
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
            collapsed: false,
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
        config: {
            enabled: false,
            collapsed: true
        },
        saveConfig: {
            enabled: false,
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

        SWITCH_WATERBODIES.prop(CHECKED, viewer.get('waterBodies'));
        SWITCH_DYNAMIC_COLORS.setState(viewer.get('dynamicColors'));
        SWITCH_STACKED_CARDBOARD.prop(CHECKED, viewer.get('stackedCardboard'));
        SWITCH_SHADING.setState(viewer.get('shading'));
        SWITCH_SHEARING_INTERACTION.setState(viewer.get('terrainInteraction'));
        SWITCH_DEBUG.prop(CHECKED, viewer.get('debug'));
        SWITCH_WIREFRAME.prop(CHECKED, viewer.get('wireframe'));


        SLIDER_COLOR.slider({
            values: viewer.get('colorScale')
        });
        SLIDER_AMBIENT_LIGHT.update();
        SLIDER_DARKNESS.update();
        SLIDER_EXAGGERATION.update();
        SLIDER_SPRING_COEFFICIENT.update();
        SLIDER_SPRING_FRICTION.update();
        SLIDER_SPRING_INNRAD.update();
        SLIDER_SPRING_OUTRAD.update();
        SLIDER_SPRING_FADEOUT.update();
        SLIDER_HYBRID_DAMPING.update();
        SLIDER_RESOLUTION.update();

        SELECT_TEXTURE.find('option[value=' + viewer.get('texture') + ']').attr('selected', true).change();
        SELECT_COLOR_RAMP.find('option[value=' + viewer.get('colorRamp') + ']').attr('selected', true);

        ui.controlActive(ui.controls.rotation, viewer.get('viewRotationEnabled'));

        SWITCH_SAVE_ZOOM.prop(CHECKED, (viewer.get('viewZoomConstraint')[0] !== this.config.defaultZoomLevelRange[0] && viewer.get('viewZoomConstraint')[1] !== this.config.defaultZoomLevelRange[1]));
        SWITCH_SAVE_EXTENT.prop(CHECKED, (viewer.get('viewCenterConstraint')[0] !== this.config.defaultMapExtent[0] && viewer.get('viewCenterConstraint')[1] !== this.config.defaultMapExtent[1]));
        SWITCH_SAVE_ROTATION.prop(CHECKED, !viewer.get('viewRotationEnabled'));

    };


    // LOAD PREDEFINED CONFIGURATIONS
    ui.configManager = null;

    // update select box with configs from newStore
    ui.updateConfigStore = function(newStore) {
        if (ui.controls.config.enabled) {
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
        }
    };

    // on config select change
    SELECT_CONFIG.change(function() {
        var option = SELECT_CONFIG.find($('option:selected')).val();
        if (option !== 'default') {
            viewer.swapConfig(viewer.getConfigStore()[option]);
            BUTTON_EDIT_CONFIG.show();
        } else {
            viewer.swapConfig(this.config.init);
            BUTTON_EDIT_CONFIG.hide();
        }
        ui.updateControlTools();
    }.bind(this));


    SWITCH_SAVE_ZOOM.click(function() {
        var checkbox = SWITCH_SAVE_ZOOM.find($('input'));
        if (viewer.get('viewZoomConstraint')[0] !== this.config.defaultZoomLevelRange[0] && viewer.get('viewZoomConstraint')[1] !== this.config.defaultZoomLevelRange[1]) {
            viewer.set('viewZoomConstraint', this.config.defaultZoomLevelRange);
            checkbox.prop(CHECKED, false);
        } else {
            var z = viewer.view.getZoom();
            viewer.set('viewZoomConstraint', [z, z]);
            checkbox.prop(CHECKED, true);
        }
        viewer.render();
    }.bind(this));

    SWITCH_SAVE_EXTENT.click(function() {
        var checkbox = SWITCH_SAVE_EXTENT.find($('input'));
        if (viewer.get('viewCenterConstraint')[0] !== this.config.defaultMapExtent[0] && viewer.get('viewCenterConstraint')[1] !== this.config.defaultMapExtent[1]) {
            viewer.set('viewCenterConstraint', this.config.defaultMapExtent);
            checkbox.prop(CHECKED, false);
        } else {
            var extent = viewer.view.calculateExtent(viewer.map.getSize()),
                // add padding to extent constraint
                padding = 512 * viewer.view.getResolution(),
                extentPlus = [extent[0] - padding, extent[1] - padding * 0.5, extent[2] + padding, extent[3] + padding * 0.5];
            viewer.set('viewCenterConstraint', extentPlus);
            checkbox.prop(CHECKED, true);
        }
        viewer.render();
    }.bind(this));

    SWITCH_SAVE_ROTATION.click(function() {
        var checkbox = SWITCH_SAVE_ROTATION.find($('input'));
        viewer.set('viewRotationEnabled', !viewer.get('viewRotationEnabled'));
        checkbox.prop(CHECKED, !viewer.get('viewRotationEnabled'));
        viewer.render();
    }.bind(this));

    // SAVE AND EDIT PREDEFINED CONFIGURATIONS
    BUTTON_SAVE_CONFIG.click(function() {
        ui.configManager.saveConfig(TEXT_SAVE_TITLE.val());
        BUTTON_SAVE_CONFIG.reset();
    });
    BUTTON_SAVE_CONFIG.reset = function() {
        TEXT_SAVE_TITLE.val('');
    };

    BUTTON_EDIT_CONFIG.click(function() {
        if (viewer.config.dynamic.hasOwnProperty('_id')) {
            ui.configManager.updateConfig();
        }
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
            // show hypsometric color controls               
            COLOR_CONTROLS.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        } else {
            // hide hypsometric color controls
            COLOR_CONTROLS.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
        // FIXME for hidden update from showCase
        if (!ui.options.collapsed) {
            viewer.set('texture', selectedLayer);
        }
    });


    // HYPSOMETRIC COLORS
    SELECT_COLOR_RAMP.change(function() {
        viewer.set('colorRamp', parseInt(SELECT_COLOR_RAMP.find($('option:selected')).val()));
    });


    SWITCH_DYNAMIC_COLORS.setState = function(state) {
        viewer.set('dynamicColors', state);
        SWITCH_DYNAMIC_COLORS.prop(CHECKED, state);
        if (state) {
            $('.staticColorsScale').hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        } else {
            $('.staticColorsScale').show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
        viewer.render();
    };
    SWITCH_DYNAMIC_COLORS.click(function() {
        SWITCH_DYNAMIC_COLORS.setState(!viewer.get('dynamicColors'));
    });


    // slider to stretch hypsometric colors  
    SLIDER_COLOR.slider({
        min: ui.options.minElevation,
        max: ui.options.maxElevation,
        range: true,
        slide: function(event, slider) {
            viewer.set('colorScale', slider.values);
            console.log(slider.values);
        }
    });

    // detection of inland waterbodies
    SWITCH_WATERBODIES.click(function() {
        var checkbox = SWITCH_WATERBODIES.find($('input'));
        viewer.set('waterBodies', !viewer.get('waterBodies'));
        checkbox.prop(CHECKED, !viewer.get('waterBodies'));
        viewer.render();
    });

    SWITCH_STACKED_CARDBOARD.click(function() {
        var checkbox = SWITCH_STACKED_CARDBOARD.find($('input'));
        viewer.set('stackedCardboard', !viewer.get('stackedCardboard'));
        checkbox.prop(CHECKED, !viewer.get('stackedCardboard'));
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

    this.initSlider(SLIDER_AMBIENT_LIGHT, 'ambientLight');
    this.initSlider(SLIDER_DARKNESS, 'shadingDarkness');
    this.initSlider(SLIDER_EXAGGERATION, 'shadingExaggeration');

    // TERRAIN INTERACTION
    SWITCH_SHEARING_INTERACTION.collapse = function(state) {
        if (state) {
            ui.controls.shearing.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            ui.controls.inclination.cont.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            viewer.elevationIndicator.disable();
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
            viewer.elevationIndicator.enable();
        }
        viewer.render();
    };
    //  turn shearing on / off
    SWITCH_SHEARING_INTERACTION.click(function() {
        SWITCH_SHEARING_INTERACTION.setState(!viewer.get('terrainInteraction'));
    });

    this.initSlider(SLIDER_SPRING_COEFFICIENT, 'springCoefficient');
    this.initSlider(SLIDER_SPRING_FRICTION, 'frictionForce');
    this.initSlider(SLIDER_SPRING_INNRAD, 'maxTerrainDistortion');
    this.initSlider(SLIDER_SPRING_OUTRAD, 'dragDistanceBeforePan');
    this.initSlider(SLIDER_SPRING_FADEOUT, 'explicitFadeOutAnimationSpeed');
    this.initSlider(SLIDER_HYBRID_DAMPING, 'hybridTransitionDampingDuration');

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
    KNOB_ROTATION.updateKnob = function() {
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
        viewer.set('debug', !viewer.get('debug'));
        checkbox.prop(CHECKED, !viewer.get('debug'));
        viewer.render();
    });

    SWITCH_WIREFRAME.click(function() {
        var checkbox = SWITCH_WIREFRAME.find($('input'));
        viewer.set('wireframe', !viewer.get('wireframe'));
        checkbox.prop(CHECKED, !viewer.get('wireframe'));
        viewer.render();
    });

    this.initSlider(SLIDER_RESOLUTION, 'resolution');

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
    ui.init = function() {
        if (ui.options.enabled) {
            var updateMapSize = function() {
                viewer.map.updateSize();
            };
            var showControlBar = function() {
                CONTROL_BAR.fadeIn();
                MAP.animate({
                    width: $(document).width() - CONTROL_BAR.outerWidth()
                }, {
                    duration: ui.options.controlAnimationSpeed,
                    start: function() {
                        if (viewer.showCase !== undefined) {
                            viewer.showCase.hide();
                        }
                    },
                    step: updateMapSize,
                });
                ui.options.collapsed = false;
                $('#controlButton').html('<i class="fa fa-angle-double-right" title="Hide Controls"></i>');
            };
            var hideControlBar = function() {
                MAP.animate({
                    width: '100%'
                }, {
                    duration: ui.options.controlAnimationSpeed,
                    step: updateMapSize,
                    start: function() {
                        if (viewer.showCase !== undefined) {
                            viewer.showCase.show();
                        }
                    },
                    complete: function() {
                        CONTROL_BAR.fadeOut();
                    },
                });
                ui.options.collapsed = true;
                $('#controlButton').html('<i class="fa fa-cog" title="Show Controls"></i>');
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
                anchor.innerHTML = '<i class="fa fa-cog" title="Show Controls"></i>';
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
                $('#controlButton').html('<i class="fa fa-angle-double-right" title="Hide Controls"></i>');
            }

            // init control tools        
            ui.updateControlTools();

            ui.show = function() {
                showControlBar();
            };
        }
    };

    ui.init();

};
