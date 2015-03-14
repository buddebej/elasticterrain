var OteUi = function(map) {
    'use strict';

    var ui = this, ote;
    ui.layers = map.getLayers().getArray(); 
    ote = ui.layers[ui.layers.length-1];
    ote.layers = ui.layers;
    ote.overlayers = $.extend({}, ote.layers.slice(0,-1));
    ote.view = map.getView();    

    // INIT   
      ui.options = {
          dom: $('.controlBar'),
          knobcolor: '#4479E3',
          collapsed : false
      };

      // state of controls
      ui.controls = {
          inclination: {enabled: false, collapsed: false},
          texture: {enabled: true, collapsed: false}, 
          shading: {enabled: true, collapsed: false},
          shearing: {enabled: true, collapsed: false},
          debug: { enabled: true, collapsed: true},
          rotation: {enabled: true, collapsed: true}      
      };

      ui.init = {
          angleSteps : 1.0,
          ambientLight : 0.1,
          colorScale : [0, 8000],    
          criticalElevationThreshold : 0.5,        
          hillShading : true,
          hillShadingOpacity : 0.2,
          hillShadingExaggeration : 0.2,          
          lightAzimuth : 315.0,
          lightZenith : 50.0,   
          maxElevation : 8600,
          resolution : 20,
          testing : false,        
          obliqueInclination : 50.0,
          waterBodies : true,
          terrainInteraction : true,
      };

      // init controls  
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
          val.head.click(function(e){ if(!$(e.target).hasClass('onoffswitch-checkbox')){val.body.toggle('blind', 300);}});       
      });

      // init control values
      $('#colorScale .scaleMin').text(ui.init.colorScale[0]);
      $('#colorScale .scaleMax').text(ui.init.colorScale[1]);
      $('.inclinationKnob').val(ui.init.obliqueInclination);
      $('.lightAzimuth').val(ui.init.lightAzimuth);
      $('.lightZenith').val(ui.init.lightZenith);
      $('.t_HillShading').prop('checked', ui.init.hillShading);    
      $('.t_Testing').prop('checked', ui.init.testing);
      $('.t_WaterBodies').prop('checked', ui.init.waterBodies);
      $('.t_Interaction').prop('checked', ui.init.terrainInteraction);

      // init map values
      ote.setAmbientLight(ui.init.ambientLight / 100.0);
      ote.setColorScale(ui.init.colorScale);
      ote.setHillShading(ui.init.hillShading);    
      ote.setHillShadingOpacity(ui.init.hillShadingOpacity);    
      ote.setHillShadingExaggeration(ui.init.hillShadingExaggeration);          
      ote.setLightAzimuth(ui.init.lightAzimuth);
      ote.setLightZenith(ui.init.lightZenith);
      ote.setResolution(ui.init.resolution / 100.0); 
      ote.setTesting(ui.init.testing);
      ote.setObliqueInclination(ui.init.obliqueInclination);
      ote.setWaterBodies(ui.init.waterBodies);
      ote.setTerrainInteraction(ui.init.terrainInteraction);

    // HELPER FUNCTIONS
      var renderMap = function() {
        ote.redraw();
      },
      hideAllOtherOverlayers = function(id){
        $.each(ote.overlayers, function(val, obj) {
          if(obj == ote.overlayers[id]){obj.setVisible(true);}else{obj.setVisible(false);}
        });  
      },
      setLayerPreload = function(l){
        $.each(ote.layers, function(val, obj) {
          obj.setPreload(l);
        });  
      },
      // round given number to closest step
      toStep = function(n) {
        var rest = n % ui.init.angleSteps;
        if (rest <= (ui.init.angleSteps / 2)) {
          return n - rest;
        } else {
          return n + ui.init.angleSteps - rest;
        }
      },
      toRadians = function(a) {
        return a * Math.PI / 180.0;
      },
      toDegrees = function(a) {
        return Math.abs(a) * 180 / Math.PI;
      };     

    // INTERACTIONS & SHEARING
      ote.optionsShearStatic =      {threshold: 0.01, // in pixel
                                     springCoefficient: 0.1,
                                     frictionForce: 0.1,
                                     duration: 1500,
                                     keypress: ol.events.condition.shiftKeyOnly,
                                     minZoom: 5,
                                     map: map};

      ote.optionsShearIntegrated =  {threshold: 0.333, // in pixel
                                     springCoefficient: 0.08,
                                     frictionForce: 0.17,              
                                     maxInnerShearingPx: 40.0, // radius in pixel
                                     maxOuterShearingPx: 80.0, // radius in pixel
                                     staticShearFadeOutAnimationSpeed: 1.5,
                                     criticalElevationThreshold: ui.init.criticalElevationThreshold,
                                     keypress : ol.events.condition.noModifierKeys,
                                     minZoom: 9,
                                     map: map};

      ote.staticShearing = new ol.interaction.DragShearStatic(ote.optionsShearStatic);
      map.addInteraction(ote.staticShearing);

      ote.integratedShearing =  new ol.interaction.DragShearIntegrated(ote.optionsShearIntegrated);
      map.addInteraction(ote.integratedShearing);

      // switch to activate terrain interactions
      $('.t_Interaction').click(function() {
        var checkbox = $('.t_Interaction input');
        if (ote.getTerrainInteraction()) {
          ote.setTerrainInteraction(false);
          ote.staticShearing.setActive(false);
          ote.integratedShearing.setActive(false);
          checkbox.prop('checked', false);
          ui.controls.shearing.body.hide('blind', 300);                    
          ui.controls.inclination.cont.show('blind', 300);
        } else {
          ote.setTerrainInteraction(true);
          ote.staticShearing.setActive(true);
          ote.integratedShearing.setActive(true);
          checkbox.prop('checked', true);
          ui.controls.shearing.body.show('blind', 300);                    
          ui.controls.inclination.cont.hide('blind', 300);
        }
      });    

      var sliderRange = 50.0;
      $('.springCoefficientSlider').slider({
        min: 0,
        max: sliderRange,
        value: ote.optionsShearIntegrated.springCoefficient*sliderRange,
        slide: function(event, ui) {
            ote.optionsShearIntegrated.springCoefficient = ui.value/sliderRange;
        }
      });
      $('.springFadeoutSlider').slider({
        min: 0,
        max: sliderRange,
        value: ote.optionsShearIntegrated.staticShearFadeOutAnimationSpeed*sliderRange,
        slide: function(event, ui) {
            ote.optionsShearIntegrated.staticShearFadeOutAnimationSpeed = ui.value/sliderRange*2;
        }
      });      
      $('.springFrictionSlider').slider({
        min: 0,
        max: sliderRange,
        value: ote.optionsShearIntegrated.frictionForce*sliderRange,
        slide: function(event, ui) {
            ote.optionsShearIntegrated.frictionForce = ui.value/sliderRange;
        }
      });
      $('.springInnerRadiusSlider').slider({
        min: 0,
        max: 100,
        value: ote.optionsShearIntegrated.maxInnerShearingPx,
        slide: function(event, ui) {
            ote.optionsShearIntegrated.maxInnerShearingPx = ui.value;
        }
      });
     $('.springOuterRadiusSlider').slider({
        min: 0,
        max: 100,
        value: ote.optionsShearIntegrated.maxOuterShearingPx,
        slide: function(event, ui) {
            ote.optionsShearIntegrated.maxOuterShearingPx = ui.value;
        }
      });      
      $('.criticalElevationSlider').slider({
        min: 0,
        max: 100,
        value: ui.init.criticalElevationThreshold*100,
        slide: function(event, ui) {
            var normval = ui.value/100.0;
            ote.optionsShearIntegrated.criticalElevationThreshold = normval;
            // pass to shader for debug view
            ote.setCriticalElevationThreshold(normval); 
            if(ote.getTesting()){
              renderMap();
            }
        }
      });           

    // COORDINATE AND ELEVATION INDICATOR
        map.addControl(new ol.control.MousePositionDem(ote));

    // PLAN OBLIQUE 
      // set inclination for planoblique relief
      $('.inclinationKnob').knob({
        'width': 110,
        'height': 70,
        'max': 90,
        'min': 10,
        'value': ui.init.inclination,
        'step': ui.init.angleSteps,
        'thickness': '.15',
        'readOnly': false,
        'angleOffset': -90,
        'angleArc': 90,
        'cursor': 8,
        'displayInput': false,
        'fgColor': ui.options.knobcolor,
        'change': function(v) {
          ote.setObliqueInclination(v);
          renderMap();
        }
      });

    // HYPSOMETRIC COLORS
      // slider to stretch hypsometric colors  
      $('.colorSlider').slider({
        min: 0,
        max: ui.init.maxElevation,
        values: ui.init.colorScale,
        range: true,
        slide: function(event, ui) {
          ote.setColorScale(ui.values);
          $('#colorScale .scaleMin').text(ui.values[0]);
          $('#colorScale .scaleMax').text(ui.values[1]);
          renderMap();
        }
      });

      // detection of inland waterbodies
      $('.t_WaterBodies').click(function() {
        var checkbox = $('.t_WaterBodies input');
        if (ote.getWaterBodies()) {
          ote.setWaterBodies(false);
          checkbox.prop('checked', false);
        } else {
          ote.setWaterBodies(true);
          checkbox.prop('checked', true);
        }
        renderMap();
      });

    // SHADING
      //  turn shading on / off
      $('.t_HillShading').click(function() {
        var checkbox = $('.t_HillShading input');
        if (ote.getHillShading()) {
          ote.setHillShading(false);
          checkbox.prop('checked', false);
          renderMap();
          ui.controls.shading.body.hide('blind', 300);
        } else {
          ote.setHillShading(true);
          checkbox.prop('checked', true);
          renderMap();        
          ui.controls.shading.body.show('blind', 300);
        }
        renderMap();
      });

      $('.lightAzimuth').knob({
        'max': 360,
        'min': 0,
        'step': ui.init.angleSteps, 
        'fgColor': ui.options.knobcolor,
        'width' : 60,
        'height': 60,
        'thickness' : 0.25,
        'cursor': 20,
        'data-skin':'tron',
        'displayInput' : 'true',
        'draw': function () {
                $(this.i).val(this.cv + '°'); //Puts a percent after values
        },
        'change': function(v) {
          ote.setLightAzimuth(toStep(v));
          renderMap();
        }
      });

      // set zenith to compute direction of light
      $('.lightZenith').knob({
        'width': 110,
        'height': 70,
        'max': 90,
        'min': 0,
        'step': ui.init.angleSteps,
        'thickness': '.15',
        'readOnly': false,        
        'angleOffset': -90,
        'angleArc': 90,
        'cursor': 8,
        'displayInput': false,
        'fgColor': ui.options.knobcolor,
        'change': function(v) {
          ote.setLightZenith(toStep(v));
          renderMap();
        }
      });

      // slider to adjust the intensity of an ambient light
      $('.ambientLightSlider').slider({
        min: -100,
        max: 100,
        value: ui.init.ambientLight,
        slide: function(event, ui) {
          ote.setAmbientLight(ui.value / 200.0);
          renderMap();
        }
      });

      // slider to adjust the intensity of an ambient light
      $('.opacitySlider').slider({
        min: 0,
        max: 100,
        value: ui.init.hillShadingOpacity*100.0,
        slide: function(event, ui) {
          ote.setHillShadingOpacity(ui.value / 100.0);
          renderMap();
        }
      });  

      // slider to adjust the intensity of an ambient light
      $('.exaggerationSlider').slider({
        min: 0,
        max: 100,
        value: ui.init.hillShadingExaggeration*100.0,
        slide: function(event, ui) {
          ote.setHillShadingExaggeration(ui.value / 100.0);
          renderMap();
        }
      });    

    // OVERLAY TILES SELECT
      // find available overlayers and populate dropdown menu
      if(ote.layers.length>0){
        ui.controls.texture.body.show();
        $.each(ote.overlayers, function(val, obj) {
              $('.selectTexture').append( $('<option></option>').val(val).html(obj.t));
        }); 

        // init layers  
        hideAllOtherOverlayers(ote);
        setLayerPreload(5);

        // on change
        $('.selectTexture').change(function(){
            var selectedLayer = $('.selectTexture option:selected').val();
            if( selectedLayer === 'dem'){
              ote.setOverlayTiles(null);
              hideAllOtherOverlayers(ote);
              renderMap();            
              $('.colorControls').show('blind', 300);
            } else if(ote.overlayers.hasOwnProperty(selectedLayer)) {
              ote.setOverlayTiles(ote.overlayers[selectedLayer]);
              hideAllOtherOverlayers(selectedLayer);            
              renderMap();
              $('.colorControls').hide('blind', 300);          
            } 
        });
      } else{
        ui.controls.texture.body.hide();
      }

    // ROTATION 
        $('.rotateView').knob({
          'width': 60,
          'max': 360,
          'min': 0,
          'step': ui.init.angleSteps,
          'thickness': '.25',
          'fgColor': ui.options.knobcolor,
          'draw': function () {
                $(this.i).val(this.cv + '°'); //Puts a percent after values
           },
          'change': function(v) {
            ote.view.setRotation(toRadians(toStep(v)));
            ote.integratedShearing.disable(); // disable shearing during rotation
            renderMap();
          },
          'release' : function (v) { 
            ote.integratedShearing.enable(); // enable shearing during rotation
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
          $('.rotateView').val(angle).trigger('change');
        });

    // TEST & DEBUG    
      $('.t_Testing').click(function() {
        var checkbox = $('.t_Testing input');
        if (ote.getTesting()) {
          ote.setTesting(false);
          checkbox.prop('checked', false);
        } else {
          ote.setTesting(true);
          checkbox.prop('checked', true);
        }
        renderMap();
      });

      // change resolution of rendered tiles
      $('.resolutionSlider').slider({
        min: 1,
        max: 100,
        value: ui.init.resolution,
        slide: function(event, ui) {
          ote.setResolution(ui.value / 100.0);
          renderMap();
        }
      });

    // HIDE & SHOW GUI BOX
      var updateMapSize = function(){map.updateSize();};
      var showControlBar = function(){
        ui.options.dom.show();
        $('.map').animate({width: $(document).width()-ui.options.dom.outerWidth()}, 
                            {duration:300, 
                             step:updateMapSize, 
                             complete: function(){ui.options.dom.css('z-index', '100');} });
        ui.options.collapsed = false;
        $('#controlButton').html('<i class="fa fa-angle-double-right"></i>');
      };
      var hideControlBar = function(){
        $('.map').animate({width: '100%'}, 
                            {duration:300, 
                             step:updateMapSize, 
                             complete: function(){
                              ui.options.dom.hide();                                                                                              
                              ui.options.dom.css('z-index', '-100');}
                             });
        ui.options.collapsed = true;
        $('#controlButton').html('<i class="fa fa-cog"></i>');
      };  
      var toggleControlBar = function(){
        if (ui.options.collapsed) {
          showControlBar();
          ui.Indicator.hide();
        } else {
          hideControlBar();
          ui.Indicator.show();
        }
      }; 
      ui.ShowControlBar = function() {
        var anchor = document.createElement('button');
        anchor.innerHTML = '<i class="fa fa-cog"></i>';
        anchor.id = 'controlButton';
        var handleShowControlBar = function(e) {
          e.preventDefault();  
          toggleControlBar();
        };
        anchor.addEventListener('click', handleShowControlBar, false);
        anchor.addEventListener('touchstart', handleShowControlBar, false);
        var element = document.createElement('div');
        element.className = 'showControlBar ol-control ol-unselectable';
        element.appendChild(anchor);
        ol.control.Control.call(this, {
          element: element,
        });
      };
      ol.inherits(ui.ShowControlBar, ol.control.Control);
      map.addControl(new ui.ShowControlBar());

      $(window).on('resize', function(){
        if(!ui.options.collapsed){
           $('.map').width($(document).width()-ui.options.dom.outerWidth());
           updateMapSize();
        } 
      });
      
      // init control bar
      if (!ui.options.collapsed) {
        ui.options.dom.show();
        $('.map').width($(document).width()-ui.options.dom.outerWidth()); 
        updateMapSize();
        $('#controlButton').html('<i class="fa fa-angle-double-right"></i>');
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
