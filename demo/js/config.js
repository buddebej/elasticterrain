var Config = function(viewer) {
    'use strict';

    this.c = {
        ambientLight: 0.1, // 0:1
        colorScale: [0, 4000], // min:max [m]  
        colorRamp: 0, // id                 
        shading: true, // bool
        shadingDarkness: 0.2, // 0:1
        shadingExaggeration: 0.2, // 0:1         
        lightAzimuth: 315, // 0:360
        lightZenith: 50, // 0:90
        obliqueInclination: 90.0, // 0:90
        texture: -1, // -1 = hypsometric or layer number          
        resolution: 0.2, // 0;1
        debug: false, // bool       
        terrainInteraction: true, // bool
        waterBodies: true, // bool
        viewRotation: 0, // 0:360
        viewCenter: [15.0, 38.0], // center of map in latlon          
        viewZoom: 12, // zoomlevel

        // shearingInteraction 
        iCriticalElevationThreshold: 0.75, // 0:1               
        iShearingThreshold: 0.333, // in pixel
        iSpringCoefficient: 0.08, // 0:1
        iFrictionForce: 0.17, // 0:1             
        iMaxInnerShearingPx: 40.0, // radius in pixel
        iMaxOuterShearingPx: 80.0, // radius in pixel
        iStaticShearFadeOutAnimationSpeed: 1.5
    };

    this.set = function (attr, val){
        this.c[attr]=val;
    };

    this.get = function(attr){
        return this.c[attr];
    };
};
