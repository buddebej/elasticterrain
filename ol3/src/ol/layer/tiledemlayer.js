goog.provide('ol.layer.TileDem');

goog.require('goog.object');
goog.require('ol.layer.Layer');


/**
 * @enum {string}
 */
ol.layer.TileDemProperty = {
  AMBIENT_LIGHT: 'ambientLight',
  COLOR_RAMP: 'colorRamp',
  COLOR_SCALE: 'colorScale',  
  CRITICAL_ELEVATION: 'criticalElevation',    
  HILL_SHADING : 'hillShading',
  HILL_SHADING_OPACITY : 'hillShadingOpacity',
  HILL_SHADING_EXAGGERATION : 'hillShadingExaggeration',  
  LIGHT_AZIMUTH: 'lightAzimuth',
  LIGHT_ZENITH: 'lightZenith',  
  OBLIQUE_INCLINATION: 'obliqueInclination',
  OVERLAY_TILES: 'overlayTiles',
  RESOLUTION : 'resolution',
  TESTING: 'testing',
  TERRAIN_INTERACTION: 'terrainInteraction',
  TERRAIN_SHEARING: 'terrainShearing',    
  WATER_BODIES: 'waterBodies',

  PRELOAD: 'preload',
  USE_INTERIM_TILES_ON_ERROR: 'useInterimTilesOnError'
};



/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.TileOptions=} opt_options Tile layer options.
 * @api stable
 */
ol.layer.TileDem = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  var baseOptions = goog.object.clone(options);

  delete baseOptions.preload;
  delete baseOptions.useInterimTilesOnError;

  goog.base(this,  /** @type {olx.layer.LayerOptions} */ (baseOptions));

  this.setAmbientLight(goog.isDef(options.ambientLight) ? options.ambientLight : 0.0);
  this.setColorRamp(goog.isDef(options.colorRamp) ? options.colorRamp : {});  
  this.setColorScale(goog.isDef(options.colorScale) ? options.colorScale : [0.0,1.0]);  
  this.setCriticalElevationThreshold(goog.isDef(options.criticalElevation) ? options.criticalElevation : 0.5);  
  this.setHillShading(goog.isDef(options.hillShading) ? options.hillShading : true);
  this.setHillShadingOpacity(goog.isDef(options.hillShadingOpacity) ? options.hillShadingOpacity : 1.0);
  this.setHillShadingExaggeration(goog.isDef(options.hillShadingExaggeration) ? options.hillShadingExaggeration : 0.0);  
  this.setTerrainInteraction(goog.isDef(options.terrainInteraction) ? options.terrainInteraction : false);
  this.setTerrainShearing(goog.isDef(options.terrainShearing) ? options.terrainShearing : {x : 0.0, y : 0.0});   
  this.setObliqueInclination(goog.isDef(options.obliqueInclination) ? options.obliqueInclination : 90.0);
  this.setLightAzimuth(goog.isDef(options.lightAzimuth) ? options.lightAzimuth : 225.0);
  this.setLightZenith(goog.isDef(options.lightZenith) ? options.lightZenith : 45.0);
  this.setObliqueInclination(goog.isDef(options.obliqueInclination) ? options.obliqueInclination : 90.0);
  this.setOverlayTiles(goog.isDef(options.overlayTiles) ? options.overlayTiles : null);
  this.setResolution(goog.isDef(options.resolution) ? options.resolution : 0.25);
  this.setTesting(goog.isDef(options.testing) ? options.testing : false);
  this.setWaterBodies(goog.isDef(options.waterBodies) ? options.waterBodies : true);

  this.setPreload(goog.isDef(options.preload) ? options.preload : 0);
  this.setUseInterimTilesOnError(goog.isDef(options.useInterimTilesOnError) ? options.useInterimTilesOnError : true);

};
goog.inherits(ol.layer.TileDem, ol.layer.Layer);


/**
 * @function
 * @return {ol.source.Tile} Source.
 * @api stable
 */
ol.layer.TileDem.prototype.getSource;



/**
 * @param {number} ambientLight Ambientlight.
 */
ol.layer.TileDem.prototype.setAmbientLight = function(ambientLight) {
  this.set(ol.layer.TileDemProperty.AMBIENT_LIGHT, ambientLight);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setAmbientLight',
  ol.layer.TileDem.prototype.setAmbientLight);
/**
 * @return {number} Ambientlight.
 */
ol.layer.TileDem.prototype.getAmbientLight = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.AMBIENT_LIGHT));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getAmbientLight',
  ol.layer.TileDem.prototype.getAmbientLight);



/**
 * @param {Array} colorScale ColorScale.
 */
ol.layer.TileDem.prototype.setColorScale = function(colorScale) {
  this.set(ol.layer.TileDemProperty.COLOR_SCALE, colorScale);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setColorScale',
  ol.layer.TileDem.prototype.setColorScale);
/**
 * @return {Array} ColorScale.
 */
ol.layer.TileDem.prototype.getColorScale = function() {
  return /** @type {Array} */ (
    this.get(ol.layer.TileDemProperty.COLOR_SCALE));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getColorScale',
  ol.layer.TileDem.prototype.getColorScale);



/**
 * @param {Object} colorRamp ColorRamp.
 */
ol.layer.TileDem.prototype.setColorRamp = function(colorRamp) {
  this.set(ol.layer.TileDemProperty.COLOR_RAMP, colorRamp);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setColorRamp',
  ol.layer.TileDem.prototype.setColorRamp);
/**
 * @return {Object} ColorRamp.
 */
ol.layer.TileDem.prototype.getColorRamp = function() {
  return /** @type {Object} */ (
    this.get(ol.layer.TileDemProperty.COLOR_RAMP));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getColorRamp',
  ol.layer.TileDem.prototype.getColorRamp);



/**
 * @param {number} criticalElevationThreshold.
 */
ol.layer.TileDem.prototype.setCriticalElevationThreshold = function(criticalElevationThreshold) {
  this.set(ol.layer.TileDemProperty.CRITICAL_ELEVATION, criticalElevationThreshold);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setCriticalElevationThreshold',
  ol.layer.TileDem.prototype.setCriticalElevationThreshold);
/**
 * @return {number} criticalElevationThreshold.
 */
ol.layer.TileDem.prototype.getCriticalElevationThreshold = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.CRITICAL_ELEVATION));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getCriticalElevationThreshold',
  ol.layer.TileDem.prototype.getCriticalElevationThreshold);




/**
 * @param {boolean} hillShading HillShading Flag.
 */
ol.layer.TileDem.prototype.setHillShading = function(hillShading) {
  this.set(ol.layer.TileDemProperty.HILL_SHADING, hillShading);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setHillShading',
  ol.layer.TileDem.prototype.setHillShading);
/**
 * @return {boolean} HillShading Flag.
 */
ol.layer.TileDem.prototype.getHillShading = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.HILL_SHADING));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getHillShading',
  ol.layer.TileDem.prototype.getHillShading);



/**
 * @param {number} hillShadingOpacity HillShading Opacity.
 */
ol.layer.TileDem.prototype.setHillShadingOpacity = function(hillShadingOpacity) {
  this.set(ol.layer.TileDemProperty.HILL_SHADING_OPACITY, hillShadingOpacity);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setHillShadingOpacity',
  ol.layer.TileDem.prototype.setHillShadingOpacity);
/**
 * @return {number} HillShading Opacity.
 */
ol.layer.TileDem.prototype.getHillShadingOpacity = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.HILL_SHADING_OPACITY));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getHillShadingOpacity',
  ol.layer.TileDem.prototype.getHillShadingOpacity);



/**
 * @param {number} hillShadingExaggeration HillShading Exaggeration.
 */
ol.layer.TileDem.prototype.setHillShadingExaggeration = function(hillShadingExaggeration) {
  this.set(ol.layer.TileDemProperty.HILL_SHADING_EXAGGERATION, hillShadingExaggeration);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setHillShadingExaggeration',
  ol.layer.TileDem.prototype.setHillShadingExaggeration);
/**
 * @return {number} HillShading Exaggeration.
 */
ol.layer.TileDem.prototype.getHillShadingExaggeration = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.HILL_SHADING_EXAGGERATION));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getHillShadingExaggeration',
  ol.layer.TileDem.prototype.getHillShadingExaggeration);



/**
 * @param {boolean} terrainInteraction Terrain Interaction Flag.
 */
ol.layer.TileDem.prototype.setTerrainInteraction = function(terrainInteraction) {
  this.set(ol.layer.TileDemProperty.TERRAIN_INTERACTION, terrainInteraction);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setTerrainInteraction',
  ol.layer.TileDem.prototype.setTerrainInteraction);
/**
 * @return {boolean} Terrain Interaction Flag.
 */
ol.layer.TileDem.prototype.getTerrainInteraction = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.TERRAIN_INTERACTION));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getTerrainInteraction',
  ol.layer.TileDem.prototype.getTerrainInteraction);



/**
 * @param  {Object.<string, number>} terrainShearing Terrain Shearing Coordinates.
 */
ol.layer.TileDem.prototype.setTerrainShearing = function(terrainShearing) {
  this.set(ol.layer.TileDemProperty.TERRAIN_SHEARING, terrainShearing);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setTerrainShearing',
  ol.layer.TileDem.prototype.setTerrainShearing);
/**
 * @return {Object.<string, number>} Terrain Shearing Coordinates.
 */
ol.layer.TileDem.prototype.getTerrainShearing = function() {
  return /** @type {Object.<string, number>} */ (
    this.get(ol.layer.TileDemProperty.TERRAIN_SHEARING));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getTerrainShearing',
  ol.layer.TileDem.prototype.getTerrainShearing);



/**
 * @param {number} lightAzimuth LightAzimuth.
 */
ol.layer.TileDem.prototype.setLightAzimuth = function(lightAzimuth) {
  this.set(ol.layer.TileDemProperty.LIGHT_AZIMUTH, lightAzimuth);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setLightAzimuth',
  ol.layer.TileDem.prototype.setLightAzimuth);
/**
 * @return {number} LightAzimuth.
 */
ol.layer.TileDem.prototype.getLightAzimuth = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.LIGHT_AZIMUTH));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getLightAzimuth',
  ol.layer.TileDem.prototype.getLightAzimuth);



/**
 * @param {number} lightZenith LightZenith.
 */
ol.layer.TileDem.prototype.setLightZenith = function(lightZenith) {
  this.set(ol.layer.TileDemProperty.LIGHT_ZENITH, lightZenith);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setLightZenith',
  ol.layer.TileDem.prototype.setLightZenith);
/**
 * @return {number} LightZenith.
 */
ol.layer.TileDem.prototype.getLightZenith = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.LIGHT_ZENITH));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getLightZenith',
  ol.layer.TileDem.prototype.getLightZenith);



/**
 * @param {number} obliqueInclination ObliqueInclination.
 */
ol.layer.TileDem.prototype.setObliqueInclination = function(obliqueInclination) {
  this.set(ol.layer.TileDemProperty.OBLIQUE_INCLINATION, obliqueInclination);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setObliqueInclination',
  ol.layer.TileDem.prototype.setObliqueInclination);
/**
 * @return {number} ObliqueInclination.
 */
ol.layer.TileDem.prototype.getObliqueInclination = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.OBLIQUE_INCLINATION));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getObliqueInclination',
  ol.layer.TileDem.prototype.getObliqueInclination);



/**
 * @param {number} overlayTiles OverlayTiles.
 */
ol.layer.TileDem.prototype.setOverlayTiles = function(overlayTiles) {
  this.set(ol.layer.TileDemProperty.OVERLAY_TILES, overlayTiles);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setOverlayTiles',
  ol.layer.TileDem.prototype.setOverlayTiles);
/**
 * @return {number} OverlayTiles.
 */
ol.layer.TileDem.prototype.getOverlayTiles = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.OVERLAY_TILES));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getOverlayTiles',
  ol.layer.TileDem.prototype.getOverlayTiles);



/**
 * @param {number} resolution Resolution of Mesh.
 */
ol.layer.TileDem.prototype.setResolution = function(resolution) {
  this.set(ol.layer.TileDemProperty.RESOLUTION, resolution);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setResolution',
  ol.layer.TileDem.prototype.setResolution);
/**
 * @return {number} Resolution of Mesh.
 */
ol.layer.TileDem.prototype.getResolution = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.RESOLUTION));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getResolution',
  ol.layer.TileDem.prototype.getResolution);



/**
 * @param {boolean} testing Testing Flag.
 */
ol.layer.TileDem.prototype.setTesting = function(testing) {
  this.set(ol.layer.TileDemProperty.TESTING, testing);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setTesting',
  ol.layer.TileDem.prototype.setTesting);
/**
 * @return {boolean} Testing Flag.
 */
ol.layer.TileDem.prototype.getTesting = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.TESTING));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getTesting',
  ol.layer.TileDem.prototype.getTesting);



/**
 * @param {boolean} waterBodies WaterBodies.
 */
ol.layer.TileDem.prototype.setWaterBodies = function(waterBodies) {
  this.set(ol.layer.TileDemProperty.WATER_BODIES, waterBodies);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setWaterBodies',
  ol.layer.TileDem.prototype.setWaterBodies);
/**
 * @return {boolean} WaterBodies.
 */
ol.layer.TileDem.prototype.getWaterBodies = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.WATER_BODIES));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getWaterBodies',
  ol.layer.TileDem.prototype.getWaterBodies);


// ******************************************************************************************************

/**
 * Triggers Rerendering of all tiles.
 *
 * @function
 * @return {boolean} Redraw
 */
ol.layer.TileDem.prototype.redraw = function(){
  this.getSource().changed();
  return true;
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'redraw',
  ol.layer.TileDem.prototype.redraw);



/**
 * @return {number} The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.TileDem.prototype.getPreload = function() {
  return /** @type {number} */ (this.get(ol.layer.TileDemProperty.PRELOAD));
};
goog.exportProperty(
    ol.layer.TileDem.prototype,
    'getPreload',
    ol.layer.TileDem.prototype.getPreload);
/**
 * @param {number} preload The level to preload tiles up to.
 * @observable
 * @api
 */
ol.layer.TileDem.prototype.setPreload = function(preload) {
  this.set(ol.layer.TileDemProperty.PRELOAD, preload);
};
goog.exportProperty(
    ol.layer.TileDem.prototype,
    'setPreload',
    ol.layer.TileDem.prototype.setPreload);



/**
 * @return {boolean} Use interim tiles on error.
 * @observable
 * @api
 */
ol.layer.TileDem.prototype.getUseInterimTilesOnError = function() {
  return /** @type {boolean} */ (
      this.get(ol.layer.TileDemProperty.USE_INTERIM_TILES_ON_ERROR));
};
goog.exportProperty(
    ol.layer.TileDem.prototype,
    'getUseInterimTilesOnError',
    ol.layer.TileDem.prototype.getUseInterimTilesOnError);
/**
 * @param {boolean} useInterimTilesOnError Use interim tiles on error.
 * @observable
 * @api
 */
ol.layer.TileDem.prototype.setUseInterimTilesOnError =
    function(useInterimTilesOnError) {
  this.set(
      ol.layer.TileDemProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
};
goog.exportProperty(
    ol.layer.TileDem.prototype,
    'setUseInterimTilesOnError',
    ol.layer.TileDem.prototype.setUseInterimTilesOnError);
