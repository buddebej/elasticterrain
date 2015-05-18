var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var configSchema = new Schema({
    title: String,
    ambientLight: Number,
    colorScale: [Number],
    dynamicColors: Boolean,
    colorRamp: Number,
    stackedCardboard: Boolean,    
    shading: Boolean,
    shadingDarkness: Number,
    shadingExaggeration: Number,
    lightAzimuth: Number,
    lightZenith: Number,
    obliqueInclination: Number,
    texture: String,
    resolution: Number,
    debug: Boolean,
    terrainInteraction: Boolean,
    waterBodies: Boolean,
    viewRotation: Number,
    viewRotationEnabled: Boolean,        
    viewCenter: [Number],
    viewCenterConstraint: [Number],    
    viewZoomConstraint: [Number],        
    viewZoom: Number,
    iminMaxNeighborhoodSize: Number,
    iShearingThreshold: Number,
    iSpringCoefficient: Number,
    iFrictionForce: Number,
    iMaxInnerShearingPx: Number,
    iMaxOuterShearingPx: Number,
    iStaticShearFadeOutAnimationSpeed: Number
});

module.exports = mongoose.model('Config', configSchema);
