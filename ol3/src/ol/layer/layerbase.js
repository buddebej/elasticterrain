goog.provide('ol.layer.Base');
goog.provide('ol.layer.LayerProperty');
goog.provide('ol.layer.LayerState');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('goog.object');
goog.require('ol.Object');
goog.require('ol.source.State');


/**
 * @enum {string}
 */
ol.layer.LayerProperty = {
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  HUE: 'hue',
  OPACITY: 'opacity',
  SATURATION: 'saturation',
  VISIBLE: 'visible',
  MAX_RESOLUTION: 'maxResolution',
  MIN_RESOLUTION: 'minResolution',
  OBLIQUE_INCLINATION: 'obliqueInclination',
  COLOR_SCALE: 'colorScale',
  COLOR_RAMP: 'colorRamp',
  WATER_BODIES: 'waterBodies',
  HILL_SHADING : 'hillShading',
  LIGHT_ZENITH: 'lightZenith',
  LIGHT_AZIMUTH: 'lightAzimuth',
  AMBIENT_LIGHT: 'ambientLight',
  TESTING: 'testing',
  RESOLUTION : 'resolution'
};


/**
 * @typedef {{brightness: number,
 *            contrast: number,
 *            hue: number,
 *            opacity: number,
 *            saturation: number,
 *            sourceState: ol.source.State,
 *            visible: boolean,
 *            maxResolution: number,
 *            minResolution: number,
 *            obliqueInclination: number,
 *            colorScale: Array,
 *            colorRamp: Object,
 *            waterBodies: boolean,
 *            lightZenith: number,
 *            lightAzimuth: number,
 *            ambientLight: number,
 *            testing: boolean,
 *            resolution: number,
 *            hillShading: boolean}}
 */
ol.layer.LayerState;



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.layer.BaseOptions} options Layer options.
 */
ol.layer.Base = function(options) {

  goog.base(this);

  var values = goog.object.clone(options);

  /** @type {number} */
  values.brightness = goog.isDef(values.brightness) ? values.brightness : 0;
  /** @type {number} */
  values.contrast = goog.isDef(values.contrast) ? values.contrast : 1;
  /** @type {number} */
  values.hue = goog.isDef(values.hue) ? values.hue : 0;
  /** @type {number} */
  values.opacity = goog.isDef(values.opacity) ? values.opacity : 1;
  /** @type {number} */
  values.saturation = goog.isDef(values.saturation) ? values.saturation : 1;
  /** @type {boolean} */
  values.visible = goog.isDef(values.visible) ? values.visible : true;
  /** @type {number} */
  values.maxResolution = goog.isDef(values.maxResolution) ?
    values.maxResolution : Infinity;
  /** @type {number} */
  values.minResolution = goog.isDef(values.minResolution) ?
    values.minResolution : 0;
  /** @type {number} */
  values.obliqueInclination = goog.isDef(values.obliqueInclination) ?
    values.obliqueInclination : 90.0;
  /** @type {Array} */
  values.colorScale = goog.isDef(values.colorScale) ?
    values.colorScale : [0.0,1.0];
  /** @type {Object} */
  values.colorRamp = goog.isDef(values.colorRamp) ?
    values.colorRamp : {};
  /** @type {boolean} */
  values.waterBodies = goog.isDef(values.waterBodies) ?
    values.waterBodies : true; 
  /** @type {number} */
  values.lightZenith = goog.isDef(values.lightZenith) ?
    values.lightZenith : 45;           
  this.setValues(values);
  /** @type {number} */
  values.lightAzimuth = goog.isDef(values.lightAzimuth) ?
    values.lightAzimuth : 225;
  /** @type {number} */
  values.ambientLight = goog.isDef(values.ambientLight) ?
    values.ambientLight : 0.0;    
 /** @type {boolean} */
  values.testing = goog.isDef(values.testing) ?
    values.testing : false;   
 /** @type {boolean} */
  values.hillShading = goog.isDef(values.hillShading) ?
    values.hillShading : true;    
  /** @type {number} */
  values.resolution = goog.isDef(values.resolution) ?
    values.resolution : 1;       

  goog.events.listen(this, [
      ol.Object.getChangeEventType(ol.layer.LayerProperty.BRIGHTNESS),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.CONTRAST),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.HUE),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.OPACITY),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.SATURATION),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.MAX_RESOLUTION),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.MIN_RESOLUTION),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.OBLIQUE_INCLINATION),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.COLOR_SCALE),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.COLOR_RAMP),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.WATER_BODIES),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.LIGHT_ZENITH),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.LIGHT_AZIMUTH),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.AMBIENT_LIGHT),      
      ol.Object.getChangeEventType(ol.layer.LayerProperty.TESTING),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.RESOLUTION),
      ol.Object.getChangeEventType(ol.layer.LayerProperty.HILL_SHADING)                             
    ],
    this.handleLayerChange, false, this);

  goog.events.listen(this,
    ol.Object.getChangeEventType(ol.layer.LayerProperty.VISIBLE),
    this.handleLayerVisibleChange, false, this);

};
goog.inherits(ol.layer.Base, ol.Object);


/**
 * @protected
 */
ol.layer.Base.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {number} Brightness.
 */
ol.layer.Base.prototype.getBrightness = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.BRIGHTNESS));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getBrightness',
  ol.layer.Base.prototype.getBrightness);


/**
 * @return {number} Contrast.
 */
ol.layer.Base.prototype.getContrast = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.CONTRAST));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getContrast',
  ol.layer.Base.prototype.getContrast);


/**
 * @return {number} Hue.
 */
ol.layer.Base.prototype.getHue = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.HUE));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getHue',
  ol.layer.Base.prototype.getHue);


/**
 * @return {ol.layer.LayerState} Layer state.
 */
ol.layer.Base.prototype.getLayerState = function() {
  var brightness = this.getBrightness();
  var contrast = this.getContrast();
  var hue = this.getHue();
  var opacity = this.getOpacity();
  var saturation = this.getSaturation();
  var sourceState = this.getSourceState();
  var visible = this.getVisible();
  var maxResolution = this.getMaxResolution();
  var minResolution = this.getMinResolution();
  var obliqueInclination = this.getObliqueInclination();
  var colorScale = this.getColorScale();
  var colorRamp = this.getColorRamp();
  var waterBodies = this.getWaterBodies();
  var lightZenith = this.getLightZenith();
  var lightAzimuth = this.getLightAzimuth();
  var ambientLight = this.getAmbientLight();  
  var testing = this.getTesting();  
  var resolution = this.getResolution();  
  var hillShading = this.getHillShading();  
  return {
    brightness: goog.isDef(brightness) ? goog.math.clamp(brightness, -1, 1) : 0,
    contrast: goog.isDef(contrast) ? Math.max(contrast, 0) : 1,
    hue: goog.isDef(hue) ? hue : 0,
    opacity: goog.isDef(opacity) ? goog.math.clamp(opacity, 0, 1) : 1,
    saturation: goog.isDef(saturation) ? Math.max(saturation, 0) : 1,
    sourceState: sourceState,
    visible: goog.isDef(visible) ? !! visible : true,
    maxResolution: goog.isDef(maxResolution) ? maxResolution : Infinity,
    minResolution: goog.isDef(minResolution) ? Math.max(minResolution, 0) : 0,
    obliqueInclination: goog.isDef(obliqueInclination) ? obliqueInclination : 0,
    colorScale: goog.isDef(colorScale) ? colorScale : [0.0,1.0],
    colorRamp: goog.isDef(colorRamp) ? colorRamp : {},
    waterBodies: goog.isDef(waterBodies) ? waterBodies : true,
    lightZenith: goog.isDef(lightZenith) ? lightZenith : 45,
    lightAzimuth: goog.isDef(lightAzimuth) ? lightAzimuth : 225,
    ambientLight: goog.isDef(ambientLight) ? ambientLight : 0.0,    
    resolution: goog.isDef(resolution) ? resolution : 1,    
    testing: goog.isDef(testing) ? testing : false,
    hillShading: goog.isDef(hillShading) ? hillShading : true}    
};


/**
 * @param {Array.<ol.layer.Layer>=} opt_array Array of layers (to be
 *     modified in place).
 * @return {Array.<ol.layer.Layer>} Array of layers.
 */
ol.layer.Base.prototype.getLayersArray = goog.abstractMethod;


/**
 * @param {{
 *     layers: Array.<ol.layer.Layer>,
 *     layerStates: Array.<ol.layer.LayerState>}=} opt_obj Object that store
 *     both the layers and the layerStates (to be modified in place).
 * @return {{
 *     layers: Array.<ol.layer.Layer>,
 *     layerStates: Array.<ol.layer.LayerState>}} Object that store both the
 *     layers and the layerStates.
 */
ol.layer.Base.prototype.getLayerStatesArray = goog.abstractMethod;


/**
 * @return {number} MaxResolution.
 */
ol.layer.Base.prototype.getMaxResolution = function() {
  return /** @type {number} */ (
    this.get(ol.layer.LayerProperty.MAX_RESOLUTION));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getMaxResolution',
  ol.layer.Base.prototype.getMaxResolution);


/**
 * @return {number} MinResolution.
 */
ol.layer.Base.prototype.getMinResolution = function() {
  return /** @type {number} */ (
    this.get(ol.layer.LayerProperty.MIN_RESOLUTION));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getMinResolution',
  ol.layer.Base.prototype.getMinResolution);


/**
 * @return {number} Opacity.
 */
ol.layer.Base.prototype.getOpacity = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.OPACITY));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getOpacity',
  ol.layer.Base.prototype.getOpacity);


/**
 * @return {number} Saturation.
 */
ol.layer.Base.prototype.getSaturation = function() {
  return /** @type {number} */ (this.get(ol.layer.LayerProperty.SATURATION));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getSaturation',
  ol.layer.Base.prototype.getSaturation);


/**
 * @return {ol.source.State} Source state.
 */
ol.layer.Base.prototype.getSourceState = goog.abstractMethod;


/**
 * @return {boolean} Visible.
 */
ol.layer.Base.prototype.getVisible = function() {
  return /** @type {boolean} */ (this.get(ol.layer.LayerProperty.VISIBLE));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getVisible',
  ol.layer.Base.prototype.getVisible);


/**
 * @protected
 */
ol.layer.Base.prototype.handleLayerChange = function() {
  if (this.getVisible() && this.getSourceState() == ol.source.State.READY) {
    this.dispatchChangeEvent();
  }
};


/**
 * @protected
 */
ol.layer.Base.prototype.handleLayerVisibleChange = function() {
  if (this.getSourceState() == ol.source.State.READY) {
    this.dispatchChangeEvent();
  }
};


/**
 * Adjust the layer brightness.  A value of -1 will render the layer completely
 * black.  A value of 0 will leave the brightness unchanged.  A value of 1 will
 * render the layer completely white.  Other values are linear multipliers on
 * the effect (values are clamped between -1 and 1).
 *
 * The filter effects draft [1] says the brightness function is supposed to
 * render 0 black, 1 unchanged, and all other values as a linear multiplier.
 *
 * The current WebKit implementation clamps values between -1 (black) and 1
 * (white) [2].  There is a bug open to change the filter effect spec [3].
 *
 * TODO: revisit this if the spec is still unmodified before we release
 *
 * [1] https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
 * [2] https://github.com/WebKit/webkit/commit/8f4765e569
 * [3] https://www.w3.org/Bugs/Public/show_bug.cgi?id=15647
 *
 * @param {number} brightness Brightness.
 */
ol.layer.Base.prototype.setBrightness = function(brightness) {
  this.set(ol.layer.LayerProperty.BRIGHTNESS, brightness);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setBrightness',
  ol.layer.Base.prototype.setBrightness);


/**
 * Adjust the layer contrast.  A value of 0 will render the layer completely
 * grey.  A value of 1 will leave the contrast unchanged.  Other values are
 * linear multipliers on the effect (and values over 1 are permitted).
 *
 * @param {number} contrast Contrast.
 */
ol.layer.Base.prototype.setContrast = function(contrast) {
  this.set(ol.layer.LayerProperty.CONTRAST, contrast);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setContrast',
  ol.layer.Base.prototype.setContrast);


/**
 * Apply a hue-rotation to the layer.  A value of 0 will leave the hue
 * unchanged.  Other values are radians around the color circle.
 * @param {number} hue Hue.
 */
ol.layer.Base.prototype.setHue = function(hue) {
  this.set(ol.layer.LayerProperty.HUE, hue);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setHue',
  ol.layer.Base.prototype.setHue);


/**
 * @param {number} maxResolution MaxResolution.
 */
ol.layer.Base.prototype.setMaxResolution = function(maxResolution) {
  this.set(ol.layer.LayerProperty.MAX_RESOLUTION, maxResolution);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setMaxResolution',
  ol.layer.Base.prototype.setMaxResolution);


/**
 * @param {number} minResolution MinResolution.
 */
ol.layer.Base.prototype.setMinResolution = function(minResolution) {
  this.set(ol.layer.LayerProperty.MIN_RESOLUTION, minResolution);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setMinResolution',
  ol.layer.Base.prototype.setMinResolution);



/**
 * @param {number} obliqueInclination ObliqueInclination.
 */
ol.layer.Base.prototype.setObliqueInclination = function(obliqueInclination) {
  this.set(ol.layer.LayerProperty.OBLIQUE_INCLINATION, obliqueInclination);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setObliqueInclination',
  ol.layer.Base.prototype.setObliqueInclination);

/**
 * @return {number} ObliqueInclination.
 */
ol.layer.Base.prototype.getObliqueInclination = function() {
  return /** @type {number} */ (
    this.get(ol.layer.LayerProperty.OBLIQUE_INCLINATION));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getObliqueInclination',
  ol.layer.Base.prototype.getObliqueInclination);

/**
 * @param {Array} colorScale ColorScale.
 */
ol.layer.Base.prototype.setColorScale = function(colorScale) {
  this.set(ol.layer.LayerProperty.COLOR_SCALE, colorScale);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setColorScale',
  ol.layer.Base.prototype.setColorScale);

/**
 * @return {Array} ColorScale.
 */
ol.layer.Base.prototype.getColorScale = function() {
  return /** @type {Array} */ (
    this.get(ol.layer.LayerProperty.COLOR_SCALE));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getColorScale',
  ol.layer.Base.prototype.getColorScale);

/**
 * @param {Object} colorRamp ColorRamp.
 */
ol.layer.Base.prototype.setColorRamp = function(colorRamp) {
  this.set(ol.layer.LayerProperty.COLOR_RAMP, colorRamp);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setColorRamp',
  ol.layer.Base.prototype.setColorRamp);

/**
 * @return {Object} ColorRamp.
 */
ol.layer.Base.prototype.getColorRamp = function() {
  return /** @type {Object} */ (
    this.get(ol.layer.LayerProperty.COLOR_RAMP));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getColorRamp',
  ol.layer.Base.prototype.getColorRamp);


/**
 * @param {boolean} waterBodies WaterBodies.
 */
ol.layer.Base.prototype.setWaterBodies = function(waterBodies) {
  this.set(ol.layer.LayerProperty.WATER_BODIES, waterBodies);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setWaterBodies',
  ol.layer.Base.prototype.setWaterBodies);

/**
 * @return {boolean} WaterBodies.
 */
ol.layer.Base.prototype.getWaterBodies = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.LayerProperty.WATER_BODIES));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getWaterBodies',
  ol.layer.Base.prototype.getWaterBodies);


/**
 * @param {boolean} testing Testing Flag.
 */
ol.layer.Base.prototype.setTesting = function(testing) {
  this.set(ol.layer.LayerProperty.TESTING, testing);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setTesting',
  ol.layer.Base.prototype.setTesting);

/**
 * @return {boolean} Testing Flag.
 */
ol.layer.Base.prototype.getTesting = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.LayerProperty.TESTING));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getTesting',
  ol.layer.Base.prototype.getTesting);

/**
 * @param {boolean} hillShading HillShading Flag.
 */
ol.layer.Base.prototype.setHillShading = function(hillShading) {
  this.set(ol.layer.LayerProperty.HILL_SHADING, hillShading);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setHillShading',
  ol.layer.Base.prototype.setHillShading);

/**
 * @return {boolean} HillShading Flag.
 */
ol.layer.Base.prototype.getHillShading = function() {
  return /** @type {boolean} */ (
    this.get(ol.layer.LayerProperty.HILL_SHADING));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getHillShading',
  ol.layer.Base.prototype.getHillShading);

/**
 * @param {number} lightAzimuth LightAzimuth.
 */
ol.layer.Base.prototype.setLightAzimuth = function(lightAzimuth) {
  this.set(ol.layer.LayerProperty.LIGHT_AZIMUTH, lightAzimuth);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setLightAzimuth',
  ol.layer.Base.prototype.setLightAzimuth);

/**
 * @return {number} LightAzimuth.
 */
ol.layer.Base.prototype.getLightAzimuth = function() {
  return /** @type {number} */ (
    this.get(ol.layer.LayerProperty.LIGHT_AZIMUTH));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getLightAzimuth',
  ol.layer.Base.prototype.getLightAzimuth);

/**
 * @param {number} ambientLight Ambientlight.
 */
ol.layer.Base.prototype.setAmbientLight = function(ambientLight) {
  this.set(ol.layer.LayerProperty.AMBIENT_LIGHT, ambientLight);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setAmbientLight',
  ol.layer.Base.prototype.setAmbientLight);

/**
 * @return {number} Ambientlight.
 */
ol.layer.Base.prototype.getAmbientLight = function() {
  return /** @type {number} */ (
    this.get(ol.layer.LayerProperty.AMBIENT_LIGHT));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getAmbientLight',
  ol.layer.Base.prototype.getAmbientLight);

/**
 * @param {number} resolution Resolution of Mesh.
 */
ol.layer.Base.prototype.setResolution = function(resolution) {
  this.set(ol.layer.LayerProperty.RESOLUTION, resolution);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setResolution',
  ol.layer.Base.prototype.setResolution);

/**
 * @return {number} Resolution of Mesh.
 */
ol.layer.Base.prototype.getResolution = function() {
  return /** @type {number} */ (
    this.get(ol.layer.LayerProperty.RESOLUTION));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getResolution',
  ol.layer.Base.prototype.getResolution);

/**
 * @param {number} lightZenith LightZenith.
 */
ol.layer.Base.prototype.setLightZenith = function(lightZenith) {
  this.set(ol.layer.LayerProperty.LIGHT_ZENITH, lightZenith);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setLightZenith',
  ol.layer.Base.prototype.setLightZenith);

/**
 * @return {number} LightZenith.
 */
ol.layer.Base.prototype.getLightZenith = function() {
  return /** @type {number} */ (
    this.get(ol.layer.LayerProperty.LIGHT_ZENITH));
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'getLightZenith',
  ol.layer.Base.prototype.getLightZenith);

/**
 * @param {number} opacity Opacity.
 */
ol.layer.Base.prototype.setOpacity = function(opacity) {
  this.set(ol.layer.LayerProperty.OPACITY, opacity);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setOpacity',
  ol.layer.Base.prototype.setOpacity);


/**
 * Adjust layer saturation.  A value of 0 will render the layer completely
 * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
 * values are linear multipliers of the effect (and values over 1 are
 * permitted).
 *
 * @param {number} saturation Saturation.
 */
ol.layer.Base.prototype.setSaturation = function(saturation) {
  this.set(ol.layer.LayerProperty.SATURATION, saturation);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setSaturation',
  ol.layer.Base.prototype.setSaturation);


/**
 * @param {boolean} visible Visible.
 */
ol.layer.Base.prototype.setVisible = function(visible) {
  this.set(ol.layer.LayerProperty.VISIBLE, visible);
};
goog.exportProperty(
  ol.layer.Base.prototype,
  'setVisible',
  ol.layer.Base.prototype.setVisible);