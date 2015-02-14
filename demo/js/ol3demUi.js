var Ol3demUi = function(map) {
    'use strict';

    $('.controlBox').show();
    var ui = this, 
        layers = map.getLayers().getArray(),
        ol3dem, optionsShearStatic, optionsShearIntegrated;

    ol3dem = layers[layers.length-1];
    ol3dem.overlayers = $.extend({}, layers.slice(0,-1));
    ol3dem.view = map.getView();    

    map.on('click', function(evt){
        var coord = evt.coordinate;
        var transformed_coordinate = ol.proj.transform(coord, "EPSG:3857", "EPSG:4326");
        var elevation = map.getRenderer().getLayerRenderer(ol3dem).getElevation(coord,ol3dem.view.getZoom());
        console.log(transformed_coordinate,elevation+' meters');
    });

    optionsShearStatic =      {threshold: 0.01, 
                               springCoefficient: 0.1,
                               frictionForce: 0.1,
                               duration: 1500,
                               keypress: ol.events.condition.shiftKeyOnly,
                               minZoom: 5,
                               map: map};

    optionsShearIntegrated =  {threshold: 0.0001, 
                               springCoefficient: 0.1,
                               frictionForce: 0.15,              
                               hybridShearingRadiusPx: 0.0, // radius in pixel
                               keypress : ol.events.condition.noModifierKeys,
                               minZoom: 9,
                               map: map};

    ol3dem.staticShearing = new ol.interaction.DragShearStatic(optionsShearStatic);
    map.addInteraction(ol3dem.staticShearing);
    ol3dem.integratedShearing =  new ol.interaction.DragShearIntegrated(optionsShearIntegrated);
    map.addInteraction(ol3dem.integratedShearing);

    // initial options for the ui
    ui.option = {
        'angleSteps' : 1.0,
        'ambientLight' : 0,
        'colorScale' : [0, 3000],        
        'hillShade' : true,
        'lightAzimuth' : 225.0,
        'lightZenith' : 45.0,   
        'maxElevation' : 4900,
        'resolution' : 15,
        'testing' : false,        
        'obliqueInclination' : 50.0,
        'waterBodies' : true,
        'terrainInteraction' : true
    };

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


    ol3dem.setAmbientLight(ui.option.ambientLight / 100.0);
    ol3dem.setColorScale(ui.option.colorScale);
    ol3dem.setHillShading(ui.option.hillShade);    
    ol3dem.setLightAzimuth(ui.option.lightAzimuth);
    ol3dem.setLightZenith(ui.option.lightZenith);
    ol3dem.setResolution(ui.option.resolution / 100.0); 
    ol3dem.setTesting(ui.option.testing);
    ol3dem.setObliqueInclination(ui.option.obliqueInclination);
    ol3dem.setWaterBodies(ui.option.waterBodies);
    ol3dem.setTerrainInteraction(ui.option.terrainInteraction);

    var renderMap = function() {
      ol3dem.redraw();
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

    // hide / show controlBox 
    $('.controlBoxHeader').click(function() {
      if ($('.controls').is(':visible')) {
        $('.controls').hide('blind', 300, function() {
          $('.controlBoxHeader .ui-icon-title').text('Show Controls');
          $('.controlBoxHeader .ui-icon').removeClass('ui-icon-minusthick');
          $('.controlBoxHeader .ui-icon').addClass('ui-icon-plusthick');
        });
      } else {
        $('.controls').show('blind', 300, function() {
          $('.controlBoxHeader .ui-icon-title').text('Hide Controls');
          $('.controlBoxHeader .ui-icon').removeClass('ui-icon-plusthick');
          $('.controlBoxHeader .ui-icon').addClass('ui-icon-minusthick');            
        });
      }
    });

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
        ol3dem.setObliqueInclination(v);
        renderMap();
      }
    });

    // slider to stretch hypsometric colors  
    $('.colorSlider').slider({
      min: 0,
      max: ui.option.maxElevation,
      values: ui.option.colorScale,
      range: true,
      slide: function(event, ui) {
        ol3dem.setColorScale(ui.values);
        $('#colorScale .scaleMin').text(ui.values[0]);
        $('#colorScale .scaleMax').text(ui.values[1]);
        renderMap();
      }
    });

    // slider to stretch resolution of dem mesh
    $('.resolutionSlider').slider({
      min: 1,
      max: 100,
      value: ui.option.resolution,
      slide: function(event, ui) {
        ol3dem.setResolution(ui.value / 100.0);
        renderMap();
      }
    });

    // switch to toggle detection of inland waterbodies
    $('.t_WaterBodies').click(function() {
      var checkbox = $('.t_WaterBodies input');
      if (ol3dem.getWaterBodies()) {
        ol3dem.setWaterBodies(false);
        checkbox.prop('checked', false);
      } else {
        ol3dem.setWaterBodies(true);
        checkbox.prop('checked', true);
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
        ol3dem.setLightAzimuth(toStep(v));
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
        ol3dem.setLightZenith(toStep(v));
        renderMap();
      }
    });

    // slider to adjust the intensity of an ambient light
    $('.ambientLightSlider').slider({
      min: -100,
      max: 100,
      value: ui.option.ambientLight,
      slide: function(event, ui) {
        ol3dem.setAmbientLight(ui.value / 200.0);
        renderMap();
      }
    });

    // select texture
    if(layers.length>0){
      $('.textureControls').show();
      $.each(ol3dem.overlayers, function(val, obj) {
            $('.selectTexture').append( $('<option></option>').val(val).html(obj.t));
      }); 
      var hideAllOtherOverlayers = function(id){
                $.each(ol3dem.overlayers, function(val, obj) {
                  if(obj == ol3dem.overlayers[id]){obj.setVisible(true);}else{obj.setVisible(false);}
                });  
          },
          preloadLayers = function(){
                $.each(layers, function(val, obj) {
                  obj.setPreload(0);
                });  
          };    

      hideAllOtherOverlayers(ol3dem);
      preloadLayers();

      $('.selectTexture').change(function(){
          var selectedLayer = $('.selectTexture option:selected').val();
          if( selectedLayer === 'dem'){
            ol3dem.setOverlayTiles(null);
            hideAllOtherOverlayers(ol3dem);
            renderMap();            
            $('.colorControls').show('blind', 300);
          } else if(ol3dem.overlayers.hasOwnProperty(selectedLayer)) {
            ol3dem.setOverlayTiles(ol3dem.overlayers[selectedLayer]);
            hideAllOtherOverlayers(selectedLayer);            
            renderMap();
            $('.colorControls').hide('blind', 300);          
          } 
      });
    } else{
      $('.textureControls').hide();
    }

    // switch to toggle shading
    $('.t_HillShading').click(function() {
      var checkbox = $('.t_HillShading input');
      if (ol3dem.getHillShading()) {
        ol3dem.setHillShading(false);
        checkbox.prop('checked', false);
        ol3dem.redraw();
        $('.shadingControls').hide('blind', 300);
      } else {
        ol3dem.setHillShading(true);
        checkbox.prop('checked', true);
        ol3dem.redraw();        
        $('.shadingControls').show('blind', 300);
      }
      renderMap();
    });

    // set angle to rotate map ol3dem.view
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
        ol3dem.view.setRotation(toRadians(toStep(v)));
        if(!ol3dem.view.getHints()[ol.ViewHint.INTERACTING]){
          ol3dem.view.setHint(ol.ViewHint.INTERACTING, 1); // starts block shearing during zooming
        }
        renderMap();
      },
      'release' : function (v) { 
          ol3dem.view.setHint(ol.ViewHint.INTERACTING, -1); // stops block shearing during zooming
      } 
    });

    // update control tool rotateView when rotated with alt+shift+mouse ol interaction
    map.on('postrender', function() {
      var angle = ol3dem.view.getRotation();
      if (angle < 0.0) {
        angle = 360.0 - toDegrees(ol3dem.view.getRotation() % (2.0 * Math.PI));
      } else {
        angle = toDegrees(ol3dem.view.getRotation() % (2.0 * Math.PI));
      }
      $('.rotateView').val(angle).trigger('change');
    });


    // switch to activate testing mode
    $('.t_Testing').click(function() {
      var checkbox = $('.t_Testing input');
      if (ol3dem.getTesting()) {
        ol3dem.setTesting(false);
        checkbox.prop('checked', false);
      } else {
        ol3dem.setTesting(true);
        checkbox.prop('checked', true);
      }
      renderMap();
    });

    // switch to activate terrain interactions
    $('.t_Interaction').click(function() {
      var checkbox = $('.t_Interaction input');
      if (ol3dem.getTerrainInteraction()) {
        ol3dem.setTerrainInteraction(false);

        ol3dem.staticShearing.setActive(false);
        ol3dem.integratedShearing.setActive(false);

        checkbox.prop('checked', false);
        $('.inclinationControls').show('blind', 300);
      } else {
        ol3dem.setTerrainInteraction(true);

        ol3dem.staticShearing.setActive(true);
        ol3dem.integratedShearing.setActive(true);

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
