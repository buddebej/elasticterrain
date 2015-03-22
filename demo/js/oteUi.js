var OteUi = function(map, config) {
    'use strict';

    var ui = this, ote = {};
    ui.layers = map.getLayers().getArray(); 
    ote.dem = ui.layers[ui.layers.length-1];
    ote.layers = ui.layers;
    ote.overlayers = $.extend({}, ote.layers.slice(0,-1));
    ote.view = map.getView();

    // HELPER FUNCTIONS
      var renderMap = function() {
        ote.dem.redraw();
      },
      hideAllOtherOverlayers = function(id){
        $.each(ote.overlayers, function(val, obj) {
          if(obj == ote.overlayers[id]){obj.setVisible(true);}else{obj.setVisible(false);}
        });  
      },
      toSlider = function(v,k){
        var m = (k !== undefined) ? k : 100.0;
        return v * m;
      },
      fromSlider = function(v,k){
        var m = (k !== undefined) ? k : 100.0;        
        return v / m;
      },
      setLayerPreload = function(l){
        $.each(ote.layers, function(val, obj) {
          obj.setPreload(l);
        });  
      },
      // round given number to closest step
      toStep = function(n) {
        var rest = n % ui.options.degreeSteps;
        if (rest <= (ui.options.degreeSteps / 2)) {
          return n - rest;
        } else {
          return n + ui.options.degreeSteps - rest;
        }
      },
      toRadians = function(a) {
        return a * Math.PI / 180.0;
      },
      toDegrees = function(a) {
        return Math.abs(a) * 180 / Math.PI;
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
          SWITCH_SHEARING_INTERACTION = $('.shearingInteractionsSwitch'),
          SWITCH_DEBUG =  $('.debugModeSwitch'),
          SLIDER_AMBIENT_LIGHT = $('.ambientLightSlider'),
          SLIDER_COLOR = $('.colorSlider'),
          SLIDER_DARKNESS = $('.darknessSlider'),
          SLIDER_EXAGGERATION = $('.exaggerationSlider'),
          SLIDER_SPRING_COEFFICIENT = $('.springCoefficientSlider'),        
          SLIDER_SPRING_FRICTION = $('.springFrictionSlider'),
          SLIDER_SPRING_FADEOUT = $('.springFadeoutSlider'),
          SLIDER_SPRING_INNRAD = $('.springInnerRadiusSlider'),
          SLIDER_SPRING_OUTRAD = $('.springOuterRadiusSlider'),
          SLIDER_CRITICAL_ELEVATION = $('.criticalElevationSlider'),
          SLIDER_RESOLUTION = $('.resolutionSlider'),
          SELECT_TEXTURE = $('.textureSelect');

    // INITIAL CONFIGURATION   
      // config control bar
      ui.options = {
          knobcolor: '#4479E3',
          collapsed : false,
          enabled: true,
          degreeSteps : 1.0,
          controlAnimation: 'blind',
          controlAnimationSpeed: 300
      };

      // config available control boxes
      ui.controls = {
          inclination: {enabled: false, collapsed: false},
          texture: {enabled: true, collapsed: false}, 
          shading: {enabled: true, collapsed: false, inactive: false},
          shearing: {enabled: true, collapsed: false, inactive: false},
          debug: { enabled: true, collapsed: true},
          rotation: {enabled: true, collapsed: true}      
      };

      // init control boxes
      ui.initControls = function(){
        $.each(ui.controls, function(key, val) {
            var className = '.'+key;
            ui.controls[key].cont = $(className);
            ui.controls[key].head = $(className+' .controlHeader');
            ui.controls[key].body = $(className+' .controlBody');
            if(val.collapsed){
              val.body.hide();
            } else {
              val.body.show();
            }
            if(val.enabled){
              val.cont.show();
            } else {
              val.cont.hide();
            }
            // hide controls when clicked on header (ignore clicks on onoffswitch)
            val.head.click(function(e){ 
              if(!val.inactive && !$(e.target).hasClass('ows')){
                if(val.collapsed){
                  val.body.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);   
                  val.collapsed = false; 
                } else {
                  val.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);      
                  val.collapsed = true; 
                }
              }}); 
        });
      }();

      ui.controlDeactivate = function(c){
          c.inactive = true;
          c.head.addClass('controlHeaderInactive');
      };

      ui.controlActivate = function(c){
          c.inactive = false;
          c.head.removeClass('controlHeaderInactive');          
      };

      // update control tools to current parameters
      ui.updateControlTools = function(){
        KNOB_INCLINATION.val(config.obliqueInclination).trigger('change');
        KNOB_AZIMUTH.val(config.lightAzimuth).trigger('change');
        KNOB_ZENITH.val(config.lightZenith).trigger('change');
        KNOB_ROTATION.val(config.viewRotation).trigger('change');
        KNOB_ROTATION1.val(config.viewRotation).trigger('change');        
        SWITCH_SHADING.prop(CHECKED, config.shading);    
        SWITCH_DEBUG.prop(CHECKED, config.debug);
        SWITCH_WATERBODIES.prop(CHECKED, config.waterBodies);
        SWITCH_SHEARING_INTERACTION.prop(CHECKED, config.terrainInteraction);
        SLIDER_AMBIENT_LIGHT.slider({value:toSlider(config.ambientLight)});
        SLIDER_COLOR.slider({values:config.colorScale}); // 1:N
        SLIDER_DARKNESS.slider({value:toSlider(config.shadingDarkness)});
        SLIDER_EXAGGERATION.slider({value:toSlider(config.shadingExaggeration)});
        SLIDER_SPRING_COEFFICIENT.slider({value:toSlider(config.shearingInteraction.springCoefficient,10)});
        SLIDER_SPRING_FRICTION.slider({value:toSlider(config.shearingInteraction.frictionForce,10)});
        SLIDER_SPRING_FADEOUT.slider({value:toSlider(config.shearingInteraction.staticShearFadeOutAnimationSpeed)});
        SLIDER_SPRING_INNRAD.slider({value:config.shearingInteraction.maxInnerShearingPx});
        SLIDER_SPRING_OUTRAD.slider({value:config.shearingInteraction.maxOuterShearingPx});
        SLIDER_CRITICAL_ELEVATION.slider({value:toSlider(config.criticalElevationThreshold)});
        SLIDER_RESOLUTION.slider({value:toSlider(config.resolution)});
        SELECT_TEXTURE.find('option[value='+config.overlayMap+']').attr('selected',true);
                
      };

      // update control tools to current parameters
      ui.updateConfig = function(){
        config.viewCenter = ol.proj.transform(ote.view.getCenter(), 'EPSG:3857', 'EPSG:4326');
        config.viewZoom = ote.view.getZoom();
        config.viewRotation = ote.view.getRotation();
        config.obliqueInclination = ote.dem.getObliqueInclination();
        config.lightAzimuth = ote.dem.getLightAzimuth();
        config.lightZenith = ote.dem.getLightZenith();
        config.shading = ote.dem.getHillShading();
        config.debug = ote.dem.getTesting();    
        config.waterBodies = ote.dem.getWaterBodies();
        config.terrainInteraction = ote.dem.getTerrainInteraction();
        config.ambientLight = ote.dem.getAmbientLight();
        config.colorScale = ote.dem.getColorScale();
        config.shadingDarkness = ote.dem.getHillShadingOpacity();
        config.shadingExaggeration = ote.dem.getHillShadingExaggeration();
        config.criticalElevationThreshold = ote.dem.getCriticalElevationThreshold();
        config.resolution = ote.dem.getResolution();
        config.texture = parseInt(SELECT_TEXTURE.find($('option:selected')).val());
      };      

      // update map to current parameters
      ui.updateMap = function(){
        ote.view.setCenter(ol.proj.transform(config.viewCenter, 'EPSG:4326', 'EPSG:3857'));
        ote.view.setRotation(toRadians(toStep(config.viewRotation)));        
        ote.view.setZoom(config.viewZoom);
        ote.dem.setAmbientLight(config.ambientLight);
        ote.dem.setColorScale(config.colorScale);
        ote.dem.setCriticalElevationThreshold(config.criticalElevationThreshold);
        config.shearingInteraction.criticalElevationThreshold = config.criticalElevationThreshold;
        ote.dem.setHillShading(config.shading);    
        ote.dem.setHillShadingOpacity(config.shadingDarkness);    
        ote.dem.setHillShadingExaggeration(config.shadingExaggeration);          
        ote.dem.setLightAzimuth(config.lightAzimuth);
        ote.dem.setLightZenith(config.lightZenith);
        ote.dem.setResolution(config.resolution); 
        ote.dem.setTesting(config.debug);
        ote.dem.setObliqueInclination(config.obliqueInclination);
        ote.dem.setWaterBodies(config.waterBodies);
        ote.dem.setTerrainInteraction(config.terrainInteraction);
        ote.dem.setOverlayTiles((config.overlayMap !== null) ? ote.overlayers[config.overlayMap] : null);
      };

      // update map to current parameters
      // ui.updateInteraction = function(){
      //   if(config.terrainInteraction){
      //     ote.shearingInteraction.setActive(true);
      //     ote.shearingInteraction.setActive(true);
      //   }
      // };      

    // PLAN OBLIQUE 
      // set inclination for planoblique relief
      KNOB_INCLINATION.knob({
        'width': 110,
        'height': 70,
        'max': 90,
        'min': 10,
        'value': config.inclination,
        'step': ui.options.degreeSteps,
        'thickness': '.15',
        'readOnly': false,
        'angleOffset': -90,
        'angleArc': 90,
        'cursor': 8,
        'displayInput': false,
        'fgColor': ui.options.knobcolor,
        'change': function(v) {
          ote.dem.setObliqueInclination(v);
          renderMap();
        }
      });

    // OVERLAY MAP
      // find available overlayers and populate dropdown menu
      if(ote.layers.length>0){
        ui.controls.texture.body.show();
        $.each(ote.overlayers, function(val, obj) {
              SELECT_TEXTURE.append( $('<option></option>').val(val).html(obj.t));
        }); 

        // init layers  
        hideAllOtherOverlayers(ote);
        setLayerPreload(5);

        // on change
        SELECT_TEXTURE.change(function(){
            var selectedLayer = SELECT_TEXTURE.find($('option:selected')).val();
            if( selectedLayer === 'dem'){
              ote.dem.setOverlayTiles(null);
              hideAllOtherOverlayers(ote);
              renderMap();           
              // show hypsometric color controls               
              COLOR_CONTROLS.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
            } else if(ote.overlayers.hasOwnProperty(selectedLayer)) {
              ote.dem.setOverlayTiles(ote.overlayers[selectedLayer]);
              hideAllOtherOverlayers(selectedLayer);            
              renderMap();
              // hide hypsometric color controls
              COLOR_CONTROLS.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);          
            } 
        });
      } else{
        ui.controls.texture.body.hide();
      }

    // HYPSOMETRIC COLORS
      // slider to stretch hypsometric colors  
      SLIDER_COLOR.slider({
        min: 0,
        max: config.maxElevation,
        range: true,
        slide: function(event, ui) {
          ote.dem.setColorScale(ui.values);
          renderMap();
        }
      });

      // detection of inland waterbodies
      SWITCH_WATERBODIES.click(function() {
        var checkbox = SWITCH_WATERBODIES.find($('input'));
        if (ote.dem.getWaterBodies()) {
          ote.dem.setWaterBodies(false);
          checkbox.prop(CHECKED, false);
        } else {
          ote.dem.setWaterBodies(true);
          checkbox.prop(CHECKED, true);
        }
        renderMap();
      });

    // SHADING
      //  turn shading on / off
      SWITCH_SHADING.click(function() {
        var checkbox = SWITCH_SHADING.find($('input'));
        if (ote.dem.getHillShading()) {
          ote.dem.setHillShading(false);   
          renderMap();
          checkbox.prop(CHECKED, false);
          ui.controlDeactivate(ui.controls.shading);                 
          ui.controls.shading.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        } else {
          ote.dem.setHillShading(true);                
          renderMap(); 
          checkbox.prop(CHECKED, true);
          ui.controlActivate(ui.controls.shading);    
          ui.controls.shading.body.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
        renderMap();
      });

      KNOB_AZIMUTH.knob({
        'max': 360,
        'min': 0,
        'step': ui.options.degreeSteps, 
        'fgColor': ui.options.knobcolor,
        'width' : 60,
        'height' : 60,        
        'thickness' : 0.25,
        'draw': function () {
          $(this.i).val(this.cv + '°'); 
        },
        'change': function(v) {
          ote.dem.setLightAzimuth(toStep(v));
          renderMap();
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
        'angleArc': 90,
        'cursor': 8,
        'fgColor': ui.options.knobcolor,
        'change': function(v) {
          ote.dem.setLightZenith(toStep(v));
          renderMap();
        }
      });

      // slider to adjust the intensity of an ambient light
      SLIDER_AMBIENT_LIGHT.slider({
        min: -100,
        max: 100,
        slide: function(event, ui) {
          ote.dem.setAmbientLight(fromSlider(ui.value,200.0));
          renderMap();
        }
      });

      // slider to adjust the intensity of an ambient light
      SLIDER_DARKNESS.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
          ote.dem.setHillShadingOpacity(fromSlider(ui.value));
          renderMap();
        }
      });  

      // slider to adjust the intensity of an ambient light
      SLIDER_EXAGGERATION.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
          ote.dem.setHillShadingExaggeration(fromSlider(ui.value));
          renderMap();
        }
      });    

    // INTERACTIONS
      ote.shearingInteraction = new ol.interaction.DragShearIntegrated(config.shearingInteraction);
      map.addInteraction(ote.shearingInteraction);

      // switch to activate terrain interactions
      SWITCH_SHEARING_INTERACTION.click(function() {        
        var checkbox = SWITCH_SHEARING_INTERACTION.find($('input'));
        if (ote.dem.getTerrainInteraction()) {
          ote.dem.setTerrainInteraction(false);
          ote.shearingInteraction.setActive(false);
          ui.controlDeactivate(ui.controls.shearing);
          checkbox.prop(CHECKED, false);
          ui.controls.shearing.body.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);                    
          ui.controls.inclination.cont.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        } else {
          ote.dem.setTerrainInteraction(true);
          ote.shearingInteraction.setActive(true);
          checkbox.prop(CHECKED, true);
          ui.controlActivate(ui.controls.shearing);          
          ui.controls.shearing.body.show(ui.options.controlAnimation, ui.options.controlAnimationSpeed);                    
          ui.controls.inclination.cont.hide(ui.options.controlAnimation, ui.options.controlAnimationSpeed);
        }
      });    

      SLIDER_SPRING_COEFFICIENT.slider({
        min: 0,
        max: 10,
        slide: function(event, ui) {
            config.shearingInteraction.springCoefficient = fromSlider(ui.value, 10);
        }
      });
      SLIDER_SPRING_FADEOUT.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            config.shearingInteraction.staticShearFadeOutAnimationSpeed = fromSlider(ui.value);
        }
      });      
      SLIDER_SPRING_FRICTION.slider({
        min: 0,
        max: 10,
        slide: function(event, ui) {
            config.shearingInteraction.frictionForce = fromSlider(ui.value, 10);
        }
      });
      SLIDER_SPRING_INNRAD.slider({
        min: 0,
        max: 150,
        slide: function(event, ui) {
            config.shearingInteraction.maxInnerShearingPx = ui.value;
        }
      });
     SLIDER_SPRING_OUTRAD.slider({
        min: 0,
        max: 150,
        slide: function(event, ui) {
            config.shearingInteraction.maxOuterShearingPx = ui.value;
        }
      });      
      SLIDER_CRITICAL_ELEVATION.slider({
        min: 0,
        max: 100,
        slide: function(event, ui) {
            config.shearingInteraction.criticalElevationThreshold = fromSlider(ui.value);
            ote.dem.setCriticalElevationThreshold(fromSlider(ui.value));           
            renderMap();
        }
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
          'draw': function () {
                $(this.i).val(this.cv + '°'); 
           },
          'change': function(v) {
            ote.view.setRotation(toRadians(toStep(v)));
            ote.shearingInteraction.disable(); // disable shearing during rotation
            renderMap();
          },
          'release' : function (v) { 
            ote.shearingInteraction.enable(); // enable shearing during rotation
          } 
        });

        // update gui rotation knob, when rotated with alt+shift+mouse
        map.on('postrender', function() {
          var angle = ote.view.getRotation();
          if (angle < 0.0) {
            angle = 360.0 - toDegrees(ote.view.getRotation() % (2.0 * Math.PI));
          } else {
            angle = toDegrees(ote.view.getRotation() % (2.0 * Math.PI));
          }
          KNOB_ROTATION.val(angle).trigger('change');
          // renderMap();
        });

    // DEBUG    
      SWITCH_DEBUG.click(function() {
        var checkbox = SWITCH_DEBUG.find($('input'));
        if (ote.dem.getTesting()) {
          ote.dem.setTesting(false);
          checkbox.prop(CHECKED, false);
        } else {
          ote.dem.setTesting(true);
          checkbox.prop(CHECKED, true);
        }
        renderMap();
      });

      // change resolution of rendered tiles
      SLIDER_RESOLUTION.slider({
        min: 1,
        max: 100,
        slide: function(event, ui) {
          ote.dem.setResolution(fromSlider(ui.value));
          renderMap();
        }
      });

    // HIDE & SHOW CONTROL BOX
      if(ui.options.enabled){
        var updateMapSize = function(){map.updateSize();};
        var showControlBar = function(){
          CONTROL_BAR.show();
          MAP.animate({width: $(document).width()-CONTROL_BAR.outerWidth()}, 
                              {duration:ui.options.controlAnimationSpeed, 
                               step:updateMapSize, 
                               complete: function(){CONTROL_BAR.css('z-index', '100');} });
          ui.options.collapsed = false;
          $('#controlButton').html('<i class="fa fa-angle-double-right"></i>');
        };
        var hideControlBar = function(){
          MAP.animate({width: '100%'}, 
                              {duration:ui.options.controlAnimationSpeed, 
                               step:updateMapSize, 
                               complete: function(){
                                CONTROL_BAR.hide();                                                                                              
                                CONTROL_BAR.css('z-index', '-100');}
                               });
          ui.options.collapsed = true;
          $('#controlButton').html('<i class="fa fa-cog"></i>');
        };  
        var toggleControlBar = function(){
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
        map.addControl(new ui.controlBarButton());
        
        $(window).on('resize', function(){
          if(!ui.options.collapsed){
             MAP.width($(document).width()-CONTROL_BAR.outerWidth());
             updateMapSize();
          } 
        });
        
        // init control bar
        if (!ui.options.collapsed) {
          CONTROL_BAR.show();
          MAP.width($(document).width()-CONTROL_BAR.outerWidth()); 
          updateMapSize();
          $('#controlButton').html('<i class="fa fa-angle-double-right"></i>');
        }

        // init map 
        ui.updateMap();

        // init control tools        
        ui.updateControlTools();
      }

    // EXPORT FUNCTIONALITY
        // export functionality, causes memory problems in chrome
        // preserveDrawingBuffer has to be true for canvas (webglmaprenderer.js)
        // add following lines to ui
        /*    <div id="no-download" class="alert alert-error" style="display: none">
              Your Browser does not support the 
              <a href="http://caniuse.com/#feat=download">link download</a> attribute.
            </div>
            <a id="export-png" class="btn" download="map.png"><i class="icon-download"></i> Export PNG</a>
        */
        /*var exportPNGElement = document.getElementById('export-png');

        if ('download' in exportPNGElement) {
          exportPNGElement.addEventListener('click', function(e) {
            e.target.href = map.getRenderer().getCanvas().toDataURL('image/png');
          }, false);
        } else {
          var info = document.getElementById('no-download');
          info.style.display = '';
        }*/
};
