goog.provide('ol.interaction.DragShearStatic');

goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('ol.Pixel');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');

/** @typedef {{map:ol.Map,
               threshold:number,
               springCoefficient:number,
               frictionForce:number,
               minZoom:number,
               duration:number, 
               keypress: ol.events.ConditionType}} */  

ol.interaction.DragShearStaticOptions;

/**
 * @classdesc
 * Terrain Interaction DragShearStatic
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {ol.interaction.DragShearStaticOptions} options 
 * @api stable
 */
ol.interaction.DragShearStatic = function(options) {
  goog.base(this, {
    handleDownEvent: ol.interaction.DragShearStatic.handleDownEvent_,
    handleDragEvent: ol.interaction.DragShearStatic.handleDragEvent_,
    handleUpEvent: ol.interaction.DragShearStatic.handleUpEvent_
  });

  goog.asserts.assertInstanceof(options.map, ol.Map, 'dragShearStatic expects map object');
  goog.asserts.assert(goog.isDef(options.threshold));
  goog.asserts.assert(goog.isDef(options.springCoefficient));
  goog.asserts.assert(goog.isDef(options.frictionForce));
  goog.asserts.assert(goog.isDef(options.minZoom));
  goog.asserts.assert(goog.isDef(options.duration) && options.duration>0, 'dragShearStatic duration must be > 0');
   

  /** @type {ol.interaction.DragShearStaticOptions} */
  this.options = options;

  /** @type {ol.Map} */
  this.map = this.options.map;

  /** @type {ol.View} */
  this.view = this.map.getView();

  /** @type {ol.layer.TileDem} */
  this.demLayer =  /** @type {ol.layer.TileDem} */(this.map.getLayers().getArray()[this.map.getLayers().getArray().length-1]);

  /** @type {ol.events.ConditionType} */
  this.condition = goog.isDef(this.options['keypress']) ? this.options['keypress'] : ol.events.condition.noModifierKeys;

  /** @type {number} */
  this.minZoom = this.options.minZoom;

  /** @type {ol.Pixel} */
  this.startDragPositionPx = [0,0];

  /** @type {null|number} */
  this.startDragElevation = 0;

  /** @type {number} */
  this.maxElevation = 3000;

  /** @type {number} */
  this.minElevation = 0;

  /** @type {number} */
  this.criticalElevation = (this.maxElevation-this.minElevation)/2;

  /** @type {ol.Pixel} */
  this.currentDragPositionPx = [0,0];

  /** @type {?ol.PreRenderFunction} */
  this.animationFn = null;

  /**
   * Animates shearing & panning according to current currentDragPosition
   * @param {ol.interaction.DragShearStaticOptions} options
   */
  ol.interaction.DragShearStatic.prototype.animation = function(options){
    var start =  goog.now();
    var demLayer = this.demLayer;
    var o = options;
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       */
    var staticSpring = function(map, frameState) {
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + o['duration']) {      

          var self = staticSpring;
          var friction = 1.0 - o['frictionForce'];
          var springCoefficient = o['springCoefficient'];
          var shearingXY = [demLayer.getTerrainShearing().x,demLayer.getTerrainShearing().y];
          var distance = Math.sqrt(shearingXY[0] * shearingXY[0] + shearingXY[1] * shearingXY[1]);

          if ( typeof self.currentChangeXY == 'undefined' ) {
              self.currentChangeXY = [0,0];
          }

          var accelerationXY = [shearingXY[0] * springCoefficient,
                                shearingXY[1] * springCoefficient];

          self.currentChangeXY = [(self.currentChangeXY[0] * friction)+accelerationXY[0],
                                  (self.currentChangeXY[1] * friction)+accelerationXY[1]];
          if(Math.abs(self.currentChangeXY[0]) < o['threshold']) self.currentChangeXY[0] = 0;
          if(Math.abs(self.currentChangeXY[1]) < o['threshold']) self.currentChangeXY[1] = 0;

          shearingXY=[shearingXY[0]-self.currentChangeXY[0],
                      shearingXY[1]-self.currentChangeXY[1]];

          demLayer.setTerrainShearing({x:shearingXY[0], y:shearingXY[1]});
          demLayer.redraw();

          frameState.animate = true;    
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;         

          return true;
        } else {
          return false;
        }
    };
    return staticSpring;
  };
};

goog.inherits(ol.interaction.DragShearStatic, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragShearStatic}
 * @private
 */
ol.interaction.DragShearStatic.handleDragEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent) && this.minZoom <= this.view.getZoom()) {
    goog.asserts.assert(this.targetPointers.length >= 1); 
    this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers); 

    var deltaX,deltaY;

    if(this.startDragElevation > this.criticalElevation){
      var relElevation = this.startDragElevation/this.view.getResolution();
      deltaX = (this.currentDragPositionPx[0] - this.startDragPositionPx[0])/relElevation;
      deltaY = (this.startDragPositionPx[1] - this.currentDragPositionPx[1])/relElevation;
    } else {
      var invertedElevation = (this.maxElevation-this.startDragElevation)/this.view.getResolution();
      deltaX = -(this.currentDragPositionPx[0] - this.startDragPositionPx[0])/invertedElevation;
      deltaY = -(this.startDragPositionPx[1] - this.currentDragPositionPx[1])/invertedElevation;
    }
    
    var rotation = this.view.getState().rotation;
    var shearingFactor = [deltaX*Math.cos(rotation)-deltaY*Math.sin(rotation),
                          deltaX*Math.sin(rotation)+deltaY*Math.cos(rotation)]; 

    this.demLayer.setTerrainShearing({x:shearingFactor[0],y:shearingFactor[1]});
    this.demLayer.redraw();
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragShearStatic}
 * @private
 */
ol.interaction.DragShearStatic.handleUpEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length === 0) {  
      this.animationFn = this.animation(this.options);
      this.map.beforeRender(this.animationFn); 
      this.map.render();
    return true;
  } else{
    return false;
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragShearStatic}
 * @private
 */
ol.interaction.DragShearStatic.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent) && this.minZoom <= this.view.getZoom()) {

      // stop old animation if present
      if (!goog.isNull(this.animationFn) && this.map.removePreRenderFunction(this.animationFn)) {
        this.animationFn = null;
      }

      this.startDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
      this.startDragElevation = /** @type {ol.renderer.webgl.TileDemLayer} */(this.map.getRenderer().getLayerRenderer(this.demLayer)).getElevation(mapBrowserEvent.coordinate,this.view.getZoom());
      this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
      return true;
  } else {     
      return false;
  }
};


