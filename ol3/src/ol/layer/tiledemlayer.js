goog.provide('ol.layer.TileDem');

goog.require('goog.object');
goog.require('ol.layer.Layer');
goog.require('ol.Elevation');


/**
 * @enum {string}
 */
ol.layer.TileDemProperty = {
  AMBIENT_LIGHT: 'ambientLight',
  COLOR_RAMP: 'colorRamp',
  DYNAMIC_COLORS: 'dynamicColors',
  ON_MINMAX_CHANGE: 'onMinMaxChange',  
  COLOR_SCALE: 'colorScale',  
  STACKED_CARDBOARD: 'stackedCardboard',
  SHADING : 'shading',
  SHADING_OPACITY : 'shadingOpacity',
  SHADING_EXAGGERATION : 'shadingExaggeration',  
  LIGHT_AZIMUTH: 'lightAzimuth',
  LIGHT_ZENITH: 'lightZenith',  
  OBLIQUE_INCLINATION: 'obliqueInclination',
  OVERLAY_TILES: 'overlayTiles',
  RESOLUTION : 'resolution',
  AUTO_RESOLUTION : 'autoResolution',  
  TESTING: 'testing',
  WIREFRAME: 'wireframe',  
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
  ol.Elevation.MIN = this.getSource().demMinMax[0];  
  ol.Elevation.MAX = this.getSource().demMinMax[1];
  this.setAmbientLight(goog.isDef(options.ambientLight) ? options.ambientLight : 0.0);
  this.setColorRamp(goog.isDef(options.colorRamp) ? options.colorRamp : 0);  
  this.setDynamicColors(goog.isDef(options.dynamicColors) ? options.dynamicColors : true);    
  this.setOnMinMaxChange(goog.isDef(options.onMinMaxChange) ? options.onMinMaxChange : function(){});    
  this.setColorScale(goog.isDef(options.colorScale) ? options.colorScale : [0.0,1.0]);  
  this.setStackedCardboard(goog.isDef(options.stackedCardboard) ? options.stackedCardboard : true);  
  this.setShading(goog.isDef(options.shading) ? options.shading : true);
  this.setShadingOpacity(goog.isDef(options.shadingOpacity) ? options.shadingOpacity : 1.0);
  this.setShadingExaggeration(goog.isDef(options.shadingExaggeration) ? options.shadingExaggeration : 0.0);  
  this.setTerrainInteraction(goog.isDef(options.terrainInteraction) ? options.terrainInteraction : false);
  this.setTerrainShearing(goog.isDef(options.terrainShearing) ? options.terrainShearing : {x : 0.0, y : 0.0});   
  this.setObliqueInclination(goog.isDef(options.obliqueInclination) ? options.obliqueInclination : 90.0);
  this.setLightAzimuth(goog.isDef(options.lightAzimuth) ? options.lightAzimuth : 225.0);
  this.setLightZenith(goog.isDef(options.lightZenith) ? options.lightZenith : 45.0);
  this.setOverlayTiles(goog.isDef(options.overlayTiles) ? options.overlayTiles : null);
  this.setResolution(goog.isDef(options.resolution) ? options.resolution : 0.25);
  this.setAutoResolution(goog.isDef(options.autoResolution) ? options.autoResolution : {high: false, low: false});
  this.setTesting(goog.isDef(options.testing) ? options.testing : false);
  this.setWireframe(goog.isDef(options.wireframe) ? options.wireframe : false);  
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


ol.layer.TileDem.prototype.updateMinMax = function() {
  ol.Elevation.MIN = this.getSource().demMinMax[0];  
  ol.Elevation.MAX = this.getSource().demMinMax[1];
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'updateMinMax',
  ol.layer.TileDem.prototype.updateMinMax);

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
 * @param {boolean} stackedCardboard StackedCardboard.
 */
ol.layer.TileDem.prototype.setStackedCardboard = function(stackedCardboard) {
  this.set(ol.layer.TileDemProperty.STACKED_CARDBOARD, stackedCardboard);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setStackedCardboard',
  ol.layer.TileDem.prototype.setStackedCardboard);
/**
 * @return {boolean} StackedCardboard.
 */
ol.layer.TileDem.prototype.getStackedCardboard = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.STACKED_CARDBOARD));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getStackedCardboard',
  ol.layer.TileDem.prototype.getStackedCardboard);



/**
 * @param {boolean} dynamicColors DynamicColors.
 */
ol.layer.TileDem.prototype.setDynamicColors = function(dynamicColors) {
  this.set(ol.layer.TileDemProperty.DYNAMIC_COLORS, dynamicColors);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setDynamicColors',
  ol.layer.TileDem.prototype.setDynamicColors);
/**
 * @return {boolean} DynamicColors.
 */
ol.layer.TileDem.prototype.getDynamicColors = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.DYNAMIC_COLORS));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getDynamicColors',
  ol.layer.TileDem.prototype.getDynamicColors);




/**
 * @param {function(min, max)} onMinMaxChange OnMinMaxChange.
 */
ol.layer.TileDem.prototype.setOnMinMaxChange = function(onMinMaxChange) {
  this.set(ol.layer.TileDemProperty.ON_MINMAX_CHANGE, onMinMaxChange);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setOnMinMaxChange',
  ol.layer.TileDem.prototype.setOnMinMaxChange);
/**
 * @return {function(min, max)} OnMinMaxChange.
 */
ol.layer.TileDem.prototype.getOnMinMaxChange = function() {
  return /** @type {function(min, max)} */ (
    this.get(ol.layer.TileDemProperty.ON_MINMAX_CHANGE));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getOnMinMaxChange',
  ol.layer.TileDem.prototype.getOnMinMaxChange);




  /**
 * @param {number} colorRamp ColorRamp.
 */
ol.layer.TileDem.prototype.setColorRamp = function(colorRamp) {
  this.set(ol.layer.TileDemProperty.COLOR_RAMP, colorRamp);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setColorRamp',
  ol.layer.TileDem.prototype.setColorRamp);
/**
 * @return {number} ColorRamp.
 */
ol.layer.TileDem.prototype.getColorRamp = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.COLOR_RAMP));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getColorRamp',
  ol.layer.TileDem.prototype.getColorRamp);



/**
 * @param {boolean} shading Shading Flag.
 */
ol.layer.TileDem.prototype.setShading = function(shading) {
  this.set(ol.layer.TileDemProperty.SHADING, shading);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setShading',
  ol.layer.TileDem.prototype.setShading);
/**
 * @return {boolean} Shading Flag.
 */
ol.layer.TileDem.prototype.getShading = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.SHADING));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getShading',
  ol.layer.TileDem.prototype.getShading);



/**
 * @param {number} shadingOpacity Shading Opacity.
 */
ol.layer.TileDem.prototype.setShadingOpacity = function(shadingOpacity) {
  this.set(ol.layer.TileDemProperty.SHADING_OPACITY, shadingOpacity);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setShadingOpacity',
  ol.layer.TileDem.prototype.setShadingOpacity);
/**
 * @return {number} Shading Opacity.
 */
ol.layer.TileDem.prototype.getShadingOpacity = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.SHADING_OPACITY));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getShadingOpacity',
  ol.layer.TileDem.prototype.getShadingOpacity);



/**
 * @param {number} shadingExaggeration Shading Exaggeration.
 */
ol.layer.TileDem.prototype.setShadingExaggeration = function(shadingExaggeration) {
  this.set(ol.layer.TileDemProperty.SHADING_EXAGGERATION, shadingExaggeration);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setShadingExaggeration',
  ol.layer.TileDem.prototype.setShadingExaggeration);
/**
 * @return {number} Shading Exaggeration.
 */
ol.layer.TileDem.prototype.getShadingExaggeration = function() {
  return /** @type {number} */ (
    this.get(ol.layer.TileDemProperty.SHADING_EXAGGERATION));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getShadingExaggeration',
  ol.layer.TileDem.prototype.getShadingExaggeration);



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
 * @param  {Object.<string, string>} autoResolution AutoResolution State
 */
ol.layer.TileDem.prototype.setAutoResolution = function(autoResolution) {
  var tempAutoResolution = this.get(ol.layer.TileDemProperty.AUTO_RESOLUTION);
  // initial set of autoResolution
  if(!goog.isDef(tempAutoResolution)){
      this.set(ol.layer.TileDemProperty.AUTO_RESOLUTION, autoResolution);  
  } else {
      // update autoResolution partially 
      goog.array.forEach(goog.object.getKeys(autoResolution), function(v, i, array) {
        tempAutoResolution[v] = autoResolution[v];
      });
      this.set(ol.layer.TileDemProperty.AUTO_RESOLUTION, tempAutoResolution); 
  } 
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setAutoResolution',
  ol.layer.TileDem.prototype.setAutoResolution);
/**
 * @return {Object.<string, string>} AutoResolution State
 */
ol.layer.TileDem.prototype.getAutoResolution = function() {
  return /** @type {Object.<string, string>} */ (
    this.get(ol.layer.TileDemProperty.AUTO_RESOLUTION));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getAutoResolution',
  ol.layer.TileDem.prototype.getAutoResolution);




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
 * @param {boolean} wireframe Wireframe Flag.
 */
ol.layer.TileDem.prototype.setWireframe = function(wireframe) {
  this.set(ol.layer.TileDemProperty.WIREFRAME, wireframe);
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'setWireframe',
  ol.layer.TileDem.prototype.setWireframe);
/**
 * @return {boolean} Wireframe Flag.
 */
ol.layer.TileDem.prototype.getWireframe = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.TileDemProperty.WIREFRAME));
};
goog.exportProperty(
  ol.layer.TileDem.prototype,
  'getWireframe',
  ol.layer.TileDem.prototype.getWireframe);



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
