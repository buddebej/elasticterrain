goog.provide('ol.Elevation');

/**
 * Decode Elevation from Color Values 
 * @public
 * @param {Array} rgba
 * @return {number} elevationM Elevation in meters
 */
ol.Elevation.decode = function(rgba,zoom) {
    // use float decoding for higher zoomlevels
    var decimalDecode = 1.0;
    if(goog.isDef(zoom) && zoom > 12){
        decimalDecode = 0.01;
    }
    var elevationM = ((rgba[0] + rgba[1] * 256.0) - 11000.0)*decimalDecode;
    if (elevationM > 9000.0) {
        elevationM = 0.0;
    }
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
ol.Elevation.MIN = -11000;

/**
 * Decode Elevation from Color Values 
 * @public
 * @param {number} size
 */
ol.Elevation.setMinMaxNeighborhoodSize = function(size) {
    if (goog.isDef(size) && !goog.isNull(size)) {
        ol.Elevation.MinMaxNeighborhoodSize = size;
    }
};

/**
 * @public
 * @type {number}
 * Each elevation tile is split up in n blocks (segments) for min max computation
 * For a tile size of 256 pixel, the resulting neighborhood (see webgltiledemlayerrenderer.js)
 * has the size of a square of 256 / sqrt(MinMaxNeighborhoodSize) pixels
 * can be 4, 8, 16, 36, 64, 128, 256 ...
 */
ol.Elevation.MinMaxNeighborhoodSize = 36;
