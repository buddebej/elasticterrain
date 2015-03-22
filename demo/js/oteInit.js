$(document).ready(function() {
    'use strict';
    if (webgl_detect()) {

        var config, map, ui, save, layers = {};

        layers.dem = new ol.layer.TileDem({
            source: new ol.source.XYZ({
                // url: 'http://buddebej.de/tiles/world/{z}/{x}/{y}.png',
                // url: 'http://buddebej.de/storage/global/tiles/{z}/{x}/{y}.png',        
                // url: 'http://cartography.oregonstate.edu/tiles/PlanObliqueEurope/data/tiles/{z}/{x}/{y}.png',
                // url: 'http://elasticreliefmap.s3-website-us-east-1.amazonaws.com/data/tiles/{z}/{x}/{y}.png',
                // url: '../demo/data/eudem/{z}/{x}/{y}.png',                
                url: '../demo/data/tiles/{z}/{x}/{y}.png',
                dem: true
            })
        });

        layers.mapboxStreet = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            })
        });
        layers.mapboxStreet.t = 'Mapbox Streets';

        layers.mapboxSatellite = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://api.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            })
        });
        layers.mapboxSatellite.t = 'Mapbox Satellite';      

        layers.mapboxOutdoors = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://api.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            })
        });
        layers.mapboxOutdoors.t = 'Mapbox Outdoors';        

        layers.osm = new ol.layer.Tile({
            source: new ol.source.OSM()
        });
        layers.osm.t = 'Open Street Map';

        layers.stamen = new ol.layer.Tile({
            source: new ol.source.Stamen({
                layer: 'watercolor'
            })
        });
        layers.stamen.t = 'Stamen Watercolor';

        layers.bing = new ol.layer.Tile({
            source: new ol.source.BingMaps({
            key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
            imagerySet: 'Aerial'
            })
        });
        layers.bing.t = "Bing Aerial";

        map = new ol.Map({
            controls: ol.control.defaults({attribution:false}).extend([new ol.control.ScaleLine(),new ol.control.MousePositionDem(layers.dem)]),
            view: new ol.View({ maxZoom: 12, minZoom: 1}),            
            target: 'map',
            renderer: 'webgl',
            layers: [   layers.mapboxStreet, 
                        layers.mapboxSatellite, 
                        layers.mapboxOutdoors, 
                        layers.osm, 
                        layers.stamen, 
                        layers.bing, 
                        layers.dem
                    ] // base dem has always to be the last added layer
        });

        config = {ambientLight : 0.1, // 0:1
                  colorScale : [0, 4000], // min:max [m]  
                  colorRamp : 0, // id                 
                  criticalElevationThreshold : 0.5, // 0:1       
                  shading : true, // bool
                  shadingDarkness : 0.2, // 0:1
                  shadingExaggeration : 0.2, // 0:1         
                  lightAzimuth :315, // 0:360
                  lightZenith : 50, // 0:90
                  maxElevation : 8600, // -n : +n
                  obliqueInclination : 90.0, // 0:90
                  overlayMap: null, // null or texture id         
                  resolution : 0.2, // 0;1
                  debug : false, // bool       
                  terrainInteraction : true, // bool
                  waterBodies : true, // bool
                  viewRotation: 0, // 0:360
                  viewCenter: [7.754974, 46.375803], // center of map in latlon          
                  viewZoom : 6, // zoomlevel
                  shearingInteraction : {threshold: 0.333, // in pixel
                                         springCoefficient: 0.08, // 0:1
                                         frictionForce: 0.17, // 0:1             
                                         maxInnerShearingPx: 40.0, // radius in pixel
                                         maxOuterShearingPx: 80.0, // radius in pixel
                                         staticShearFadeOutAnimationSpeed: 1.5, 
                                         criticalElevationThreshold: 0.5,
                                         keypress : ol.events.condition.noModifierKeys,
                                         map: map}   
        };

        ui = new OteUi(map, config);

        save = new OteSave(ui, config);

       

    } else {
        $('body').append('<div class="webglMissing"><p><span class="title">WebGL Not Supported!</span><br> WebGL is required for this application, and your Web browser does not support WebGL. Google Chrome or Firefox are recommended browsers with WebGL support. Click <a href="http://www.browserleaks.com/webgl" target="_blank">here</a> to check the WebGL specifications of your browser.</p></div>');
    }
});
