var OteUi = function(map) {
    'use strict';

    var ui = this, ote;
    ui.layers = map.getLayers().getArray(); 
    ote = ui.layers[ui.layers.length-1];
    ote.layers = ui.layers;
    ote.overlayers = $.extend({}, ote.layers.slice(0,-1));
    ote.view = map.getView();    

    // INIT GUI
      ui.collapsed = true;

      ui.option = {
          'angleSteps' : 1.0,
          'ambientLight' : 0,
          'colorScale' : [0, 3000],        
          'hillShade' : true,
          'lightAzimuth' : 315.0,
          'lightZenith' : 45.0,   
          'maxElevation' : 4900,
          'resolution' : 15,
          'testing' : false,        
          'obliqueInclination' : 50.0,
          'waterBodies' : true,
          'terrainInteraction' : true
      };

      // update gui
      $('#colorScale .scaleMin').text(ui.option.colorScale[0]);
      $('#colorScale .scaleMax').text(ui.option.colorScale[1]);
      $('.inclination').val(ui.option.obliqueInclination);
      $('.lightAzimuth').val(ui.option.lightAzimuth);
      $('.lightZenith').val(ui.option.lightZenith);
      $('.t_HillShading input').prop('checked', ui.option.hillShade);    
      $('.t_Testing input').prop('checked', ui.option.testing);
      $('.t_WaterBodies input').prop('checked', ui.option.waterBodies);
      $('.t_Interaction input').prop('checked', ui.option.terrainInteraction);
      $('.inclinationControls').hide();

      // update engine
      ote.setAmbientLight(ui.option.ambientLight / 100.0);
      ote.setColorScale(ui.option.colorScale);
      ote.setHillShading(ui.option.hillShade);    
      ote.setLightAzimuth(ui.option.lightAzimuth);
      ote.setLightZenith(ui.option.lightZenith);
      ote.setResolution(ui.option.resolution / 100.0); 
      ote.setTesting(ui.option.testing);
      ote.setObliqueInclination(ui.option.obliqueInclination);
      ote.setWaterBodies(ui.option.waterBodies);
      ote.setTerrainInteraction(ui.option.terrainInteraction);

    // HELPER TOOLS
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
        var rest = n % ui.option.angleSteps;
        if (rest <= (ui.option.angleSteps / 2)) {
          return n - rest;
        } else {
          return n + ui.option.angleSteps - rest;
        }
      },
      toRadians = function(a) {
        return a * Math.PI / 180.0;
      },
      toDegrees = function(a) {
        return Math.abs(a) * 180 / Math.PI;
      };

    // HIDE & SHOW GUI BOX
      var updateMapSize = function(){map.updateSize();};
      var showControlBar = function(){
        $( ".controlBar" ).show();
        $( ".map" ).animate({width: $(document).width()-$(".controlBar").outerWidth()}, 
                            {duration:300, 
                             step:updateMapSize, 
                             complete: function(){$(".controlBar").css('z-index', '100');} });
        ui.collapsed = false;
        $('#controlButton').html('<i class="fa fa-angle-double-right"></i>');
      };
      var hideControlBar = function(){
        $( ".map" ).animate({width: '100%'}, 
                            {duration:300, 
                             step:updateMapSize, 
                             complete: function(){$(".controlBar").hide();                                                                                              $(".controlBar").css('z-index', '-100');}});
        ui.collapsed = true;
        $('#controlButton').html('<i class="fa fa-cog"></i>');
      };  

      var toggleControlBar = function(){
        if (ui.collapsed) {
          showControlBar();
        } else {
          hideControlBar();
        }
      }; 

      $(".map").css('z-index', '100');
      ui.ShowControlBar = function(opt_options) {
        var options = opt_options || {};

        var anchor = document.createElement('button');
        anchor.href = '#rotate-north';
        anchor.innerHTML = '<i class="fa fa-cog"></i>';
        anchor.id = 'controlButton';

        var this_ = this;
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
          target: options.target
        });
      };
      ol.inherits(ui.ShowControlBar, ol.control.Control);
      map.addControl(new ui.ShowControlBar());

      $(window).on('resize', function(){
        if(!ui.collapsed){
           $( ".map" ).width($(document).width()-$(".controlBar").outerWidth());
           updateMapSize();
        } 
      });
      

    // INTERACTIONS & SHEARING
      ote.optionsShearStatic =      {threshold: 0.01, 
                                 springCoefficient: 0.1,
                                 frictionForce: 0.1,
                                 duration: 1500,
                                 keypress: ol.events.condition.shiftKeyOnly,
                                 minZoom: 5,
                                 map: map};

      ote.optionsShearIntegrated =  {threshold: 0.001, 
                                 springCoefficient: 0.10,
                                 frictionForce: 0.20,              
                                 hybridShearingRadiusPx: 70.0, // radius in pixel
                                 keypress : ol.events.condition.noModifierKeys,
                                 minZoom: 9,
                                 map: map};

      ote.staticShearing = new ol.interaction.DragShearStatic(ote.optionsShearStatic);
      map.addInteraction(ote.staticShearing);

      ote.integratedShearing =  new ol.interaction.DragShearIntegrated(ote.optionsShearIntegrated);
      map.addInteraction(ote.integratedShearing);

    // COORDINATE AND ELEVATION INDICATOR
      map.on('click', function(evt){
        var coord = evt.coordinate;
        var transformed_coordinate = ol.proj.transform(coord, "EPSG:3857", "EPSG:4326");
        var elevation = map.getRenderer().getLayerRenderer(ote).getElevation(coord,ote.view.getZoom());
        console.log(transformed_coordinate,elevation+' meters');
      });

    // PLAN OBLIQUE 
      // set inclination for planoblique relief
      $('.inclination').knob({
        'width': 110,
        'height': 70,
        'max': 90,
        'min': 10,
        'value': ui.option.inclination,
        'step': ui.option.angleSteps,
        'thickness': '.15',
        'readOnly': false,
        'angleOffset': -90,
        'angleArc': 90,
        'cursor': 5,
        'displayInput': false,
        'bgColor': '#000000',
        'fgColor': '#888888',
        'change': function(v) {
          ote.setObliqueInclination(v);
          renderMap();
        }
      });

    // HYPSOMETRIC COLORS
      // slider to stretch hypsometric colors  
      $('.colorSlider').slider({
        min: 0,
        max: ui.option.maxElevation,
        values: ui.option.colorScale,
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

    // RESOLUTION SLIDER
      $('.resolutionSlider').slider({
        min: 1,
        max: 100,
        value: ui.option.resolution,
        slide: function(event, ui) {
          ote.setResolution(ui.value / 100.0);
          renderMap();
        }
      });

    // SHADING
      //  turn shading on / off
      $('.t_HillShading').click(function() {
        var checkbox = $('.t_HillShading input');
        if (ote.getHillShading()) {
          ote.setHillShading(false);
          checkbox.prop('checked', false);
          ote.redraw();
          $('.shadingControls').hide('blind', 300);
        } else {
          ote.setHillShading(true);
          checkbox.prop('checked', true);
          ote.redraw();        
          $('.shadingControls').show('blind', 300);
        }
        renderMap();
      });

      // set azimuth to compute direction of light
      $('.lightAzimuth').knob({
        'width': 60,
        'height': 60,
        'max': 360,
        'min': 0,
        'step': ui.option.angleSteps,
        'thickness': '.3',
        'readOnly': false,
        'fgColor': '#888888',
        'bgColor': '#000000',
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
        'step': ui.option.angleSteps,
        'thickness': '.15',
        'readOnly': false,        
        'angleOffset': -90,
        'angleArc': 90,
        'cursor': 5,
        'displayInput': false,
        'bgColor': '#000000',
        'fgColor': '#888888',
        'change': function(v) {
          ote.setLightZenith(toStep(v));
          renderMap();
        }
      });

      // slider to adjust the intensity of an ambient light
      $('.ambientLightSlider').slider({
        min: -100,
        max: 100,
        value: ui.option.ambientLight,
        slide: function(event, ui) {
          ote.setAmbientLight(ui.value / 200.0);
          renderMap();
        }
      });

    // OVERLAY TILES SELECT
      // find available overlayers and populate dropdown menu
      if(ote.layers.length>0){
        $('.textureControls').show();
        $.each(ote.overlayers, function(val, obj) {
              $('.selectTexture').append( $('<option></option>').val(val).html(obj.t));
        }); 

        // init layers  
        hideAllOtherOverlayers(ote);
        setLayerPreload(0);

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
        $('.textureControls').hide();
      }

    // ROTATION
        // knob for rotation angle
        $('.rotateView').knob({
          'width': 60,
          'height': 60,
          'max': 360,
          'min': 0,
          'step': ui.option.angleSteps,
          'thickness': '.3',
          'readOnly': false,        
          'fgColor': '#888888',
          'bgColor': '#000000',
          'change': function(v) {
            ote.view.setRotation(toRadians(toStep(v)));
            if(ote.integratedShearing.activeInteraction()){
              ote.integratedShearing.disable(); // disable shearing during rotation
            }
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
      // switch to activate testing mode
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

      // switch to activate terrain interactions
      $('.t_Interaction').click(function() {
        var checkbox = $('.t_Interaction input');
        if (ote.getTerrainInteraction()) {
          ote.setTerrainInteraction(false);

          ote.staticShearing.setActive(false);
          ote.integratedShearing.setActive(false);

          checkbox.prop('checked', false);
          $('.inclinationControls').show('blind', 300);
        } else {
          ote.setTerrainInteraction(true);

          ote.staticShearing.setActive(true);
          ote.integratedShearing.setActive(true);

          checkbox.prop('checked', true);
          $('.inclinationControls').hide('blind', 300);
        }
      });    


    //
    // EXPORT FUNCTIONALITY
    //
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
