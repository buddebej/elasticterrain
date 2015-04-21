var Config = function(viewer) {
    'use strict';

    // static config
    this.maxZoom = 19;
    this.minZoom = 1;
    this.domContainer = 'map';
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
        texture: -1, // -1 = hypsometric or layer number 

        // hypsometric colors
        stackedCardboard: true, // bool
        waterBodies: true, // bool
        colorScale: [0, 4000], // min:max [m]  
        colorRamp: 0, // id   

        // debug         
        resolution: 0.2, // 0;1
        debug: false, // bool       

        // view
        viewRotation: 0, // 0:360
        viewCenter: [-122.8, 45.7], // center of map in latlon          
        viewZoom: 11, // zoomlevel

        // static plan oblique
        obliqueInclination: 90.0, // 0:90

        // shearingInteraction 
        terrainInteraction: true, // bool
        iminMaxNeighborhoodSize: 16, // 0:1               
        iShearingThreshold: 0.333, // in pixel
        iSpringCoefficient: 0.08, // 0:1
        iFrictionForce: 0.17, // 0:1             
        iMaxInnerShearingPx: 90.0, // radius in pixel
        iMaxOuterShearingPx: 90.0, // radius in pixel
        iStaticShearFadeOutAnimationSpeed: 1.5
    };

    this.dynamic = this.init;

    this.set = function(attr, val) {
        this.dynamic[attr] = val;
        // console.log(attr,val);
    };

    this.get = function(attr) {
        return (attr !== undefined) ? this.dynamic[attr] : this.dynamic;
    };

    this.swap = function(newConfig) {
        this.dynamic = newConfig;
    };
};
