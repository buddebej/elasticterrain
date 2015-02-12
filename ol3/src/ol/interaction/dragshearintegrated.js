goog.provide('ol.interaction.DragShearIntegrated');

goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('ol.Pixel');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');

/**
 * @classdesc
 * Terrain Interaction DragShearIntegrated
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
* @param {olx.interaction.DragShearIntegrated=} opt_options Options.
 * @api stable
 */
ol.interaction.DragShearIntegrated = function(opt_options) {
  goog.base(this, {
    handleDownEvent: ol.interaction.DragShearIntegrated.handleDownEvent_,
    handleDragEvent: ol.interaction.DragShearIntegrated.handleDragEvent_,
    handleUpEvent: ol.interaction.DragShearIntegrated.handleUpEvent_
  });

  /**
   * Terrain Interactions Options
   * @private
   * @type {Object.<string, number|boolean>} 
   */  
  this.options = goog.isDef(opt_options) ? opt_options : {}; // todo add default options!

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition = goog.isDef(this.options.condition) ? this.options.condition : ol.events.condition.noModifierKeys;

  /** @type {ol.layer.TileDem} */
  this.demLayer =  null;

  /** @type {ol.Pixel} */
  this.startDragPositionPx = [0,0];

  /** @type {null|number} */
  this.startDragElevation = 0;

   /** @type {ol.Pixel} */
  this.startCenter = [0,0];

  /** @type {ol.Pixel} */
  this.currentChange = [1,1];

  /** @type {ol.Pixel} */
  this.currentDragPositionPx = [0,0];

  /** @type {ol.Map} */
  this.map = null;

  /** @type {ol.View} */
  this.view = null;

  /**
   * Animates shearing & panning according to current currentDragPosition
   * @param {number} time
   * @private
   */
  ol.interaction.DragShearIntegrated.prototype.animation = function(time){
    var o = this.options;

    var currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx);
    var startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx);
    var currentCenter = [this.view.getCenter()[0],this.view.getCenter()[1]];
    var startCenter = this.startCenter;

    var getAnimatingPosition = function() {
         return [startDragPosition[0] - (currentCenter[0] - startCenter[0]),
                 startDragPosition[1] - (currentCenter[1] - startCenter[1])];
    };

    var getDistance = function(){
        return [currentDragPosition[0] - getAnimatingPosition()[0],
                currentDragPosition[1] - getAnimatingPosition()[1]];
    };

    var distanceXY = getDistance();
    var distance = Math.sqrt(distanceXY[0] * distanceXY[0] + distanceXY[1] * distanceXY[1]);

    var springLengthXY = [distanceXY[0] * o.springLength/distance,
                          distanceXY[1] * o.springLength/distance];

    if(isNaN(springLengthXY[0])) springLengthXY[0] = 0;
    if(isNaN(springLengthXY[1])) springLengthXY[1] = 0;
    
    var accelerationXY = [(distanceXY[0] - springLengthXY[0]) * o.springCoefficient,
                          (distanceXY[1] - springLengthXY[1]) * o.springCoefficient];

    var friction = (1-o.frictionForce);
    this.currentChange = [this.currentChange[0]*friction+accelerationXY[0],
                          this.currentChange[1]*friction+accelerationXY[1]];

    // set change value to zero when not changing anymore significantly
    if(Math.abs(this.currentChange[0]) < o.threshold) this.currentChange[0] = 0;
    if(Math.abs(this.currentChange[1]) < o.threshold) this.currentChange[1] = 0;
    
    // animate only for significant changes
    if(Math.abs(this.currentChange[0]) > o.threshold && Math.abs(this.currentChange[1]) > o.threshold){           
      // pan map
      currentCenter[0] -= this.currentChange[0];
      currentCenter[1] -= this.currentChange[1];
      this.view.setCenter(currentCenter);   

      // recompute distanceXY for new center and shear accordingly
      distanceXY = getDistance();      
      this.demLayer.setTerrainShearing({x:(distanceXY[0]/this.startDragElevation), y:(distanceXY[1]/this.startDragElevation)});
      this.demLayer.redraw();
      this.animationDelay.start();  
    }  else {
      this.animationDelay.stop(); 
    }
  };


  /**
   * @private
   * @type {goog.async.AnimationDelay}
   */
  this.animationDelay = new goog.async.AnimationDelay(this.animation,undefined,this);
  this.registerDisposable(this.animationDelay);
};

goog.inherits(ol.interaction.DragShearIntegrated, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragShearIntegrated}
 * @private
 */
ol.interaction.DragShearIntegrated.handleDragEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent)) {
    goog.asserts.assert(this.targetPointers.length >= 1);
  this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);   
  this.lastDragTime = goog.now();
  this.animationDelay.start(); 

  if(this.options.useNonZeroSpring){
    var currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx);
    var startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx);
    var currentCenter = [this.view.getCenter()[0],this.view.getCenter()[1]];
    var animatingPosition = [startDragPosition[0] - (currentCenter[0] - this.startCenter[0]),
                             startDragPosition[1] - (currentCenter[1] - this.startCenter[1])];
    var distanceX = currentDragPosition[0] - animatingPosition[0];
    var distanceY = currentDragPosition[1] - animatingPosition[1];
    var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY); 
    this.options.springLength = Math.min(this.options.maxSpringLength, distance);
  }
}
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragShearIntegrated}
 * @private
 */
ol.interaction.DragShearIntegrated.handleUpEvent_ = function(mapBrowserEvent) { 
  if (this.targetPointers.length === 0) {  
    this.options.springLength = 0;
    return true;
  } else{
    return false;
  }
  console.log(this.targetPointers.length);
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragShearIntegrated}
 * @private
 */
ol.interaction.DragShearIntegrated.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent)) {
      
      if(goog.isNull(this.map)){
        this.map = mapBrowserEvent.map;
        this.view = this.map.getView();
        this.demLayer=/** @type {ol.layer.TileDem} */(this.map.getLayers().getArray()[this.map.getLayers().getArray().length-1]);
      }

      this.startDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
      this.startDragElevation = /** @type {ol.renderer.webgl.TileDemLayer} */(this.map.getRenderer().getLayerRenderer(this.demLayer)).getElevation(mapBrowserEvent.coordinate,this.view.getZoom());
      this.startCenter = [this.view.getCenter()[0],this.view.getCenter()[1]];
      this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
      return true;
  } else {     
      return false;
  }
};


