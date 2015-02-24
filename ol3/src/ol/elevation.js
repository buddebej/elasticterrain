goog.provide('ol.Elevation');

/**
 * Decode Elevation from Color Values 
 * @public
 * @param {Array} rgba
 * @return {number} elevationM Elevation in meters
 */
ol.Elevation.decode = function(rgba) {
    var elevationM = ((rgba[0] + rgba[1]*256.0)-1000.0)/10.0;
    return elevationM;
};

/**
 * @public
 * @const 
 * @type {number}
 */
ol.Elevation.MAX = 9000;

/**
 * @public
 * @const 
 * @type {number}
 */
ol.Elevation.MIN = -500;
