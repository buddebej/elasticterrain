var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var configSchema = new Schema({
    ambientLight: Number,
    colorScale: [Number],
    colorRamp: Number,
    stackedCardboard: Boolean,    
    shading: Boolean,
    shadingDarkness: Number,
    shadingExaggeration: Number,
    lightAzimuth: Number,
    lightZenith: Number,
    obliqueInclination: Number,
    texture: Number,
    resolution: Number,
    debug: Boolean,
    terrainInteraction: Boolean,
    waterBodies: Boolean,
    viewRotation: Number,
    viewCenter: [Number],
    viewZoom: Number,
    iCriticalElevationThreshold: Number,
    iShearingThreshold: Number,
    iSpringCoefficient: Number,
    iFrictionForce: Number,
    iMaxInnerShearingPx: Number,
    iMaxOuterShearingPx: Number,
    iStaticShearFadeOutAnimationSpeed: Number
});

module.exports = mongoose.model('Config', configSchema);
