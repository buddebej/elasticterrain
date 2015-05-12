var Config = function() {
    'use strict';

    // static config
    this.dbUrl = 'http://54.69.7.112:8000/api/configs';
    // dynamic config 
    // can be saved and loaded by configManager
    // can be modified by controlBar
    // initial values
    this.init = {
        // shading
        shading: true, // bool
        shadingDarkness: 0.1, // 0:1
        shadingExaggeration: 0.6, // 0:1         
        lightAzimuth: 315, // 0:360
        lightZenith: 50, // 0:90
        ambientLight: 0.1, // 0:1

        // texture
        texture: 'hypso', // see layers.js

        // hypsometric colors
        stackedCardboard: false, // bool
        waterBodies: true, // bool
        colorScale: [-11000, 9000], // min:max [m]  
        colorRamp: 1, // id   

        // debug         
        resolution: 0.2, // 0;1
        debug: false, // bool       

        // view
        viewRotation: 0, // 0:360
        viewRotationEnabled: true, // 0:360

        viewCenter: [17, 37], // center of map in latlon 
        // potsdam 13.04,52.40
        // sicily 17,37
        // vienna 16.4,48.22
        // portland -122.8, 45.7     
        viewCenterConstraint: [], // [] | [minx, miny, maxx, maxy]
        //[0, 2504688.542848654, 5009377.085697311, 7514065.628545965]
        // vienna [1790460.950551968, 6124746.202434603, 1868732.4675159885, 6203017.719398623]
        // berlin [1428455.184593372, 6848757.734351791, 1584998.218521413, 7005300.768279833]
          
        viewZoom: 5, // zoomlevel
        viewZoomConstraint: [1,12], // [minZoom, maxZoom]
        
        // static plan oblique
        obliqueInclination: 90.0, // 0:90

        // shearingInteraction 
        terrainInteraction: true, // bool
        iShearingThreshold: 0.333, // in pixel
        iSpringCoefficient: 0.08, // 0:1
        iFrictionForce: 0.17, // 0:1             
        iMaxInnerShearingPx: 10.0, // radius in pixel
        iMaxOuterShearingPx: 10.0, // radius in pixel
        iStaticShearFadeOutAnimationSpeed: 1.0,
        iHybridDampingDuration: 0.3
    };

    this.dynamic = this.init;

    this.set = function(attr, val) {
        this.dynamic[attr] = val;
    };

    this.get = function(attr) {
        return (attr !== undefined) ? this.dynamic[attr] : this.dynamic;
    };

    this.swap = function(newConfig) {
        this.dynamic = newConfig;
    };
};
