goog.provide('ol.interaction.DragShearStatic');

goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('ol.Pixel');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');

/**
 * @classdesc
 * Terrain Interaction DragShearStatic
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {Object=} opt_options Options.
 * @api stable
 */
ol.interaction.DragShearStatic = function(opt_options) {
  goog.base(this, {
    handleDownEvent: ol.interaction.DragShearStatic.handleDownEvent_,
    handleDragEvent: ol.interaction.DragShearStatic.handleDragEvent_,
    handleUpEvent: ol.interaction.DragShearStatic.handleUpEvent_
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
  this.currentDragPositionPx = [0,0];

  /** @type {ol.Map} */
  this.map = null;

  /** @type {ol.View} */
  this.view = null;

  /** @type {?ol.PreRenderFunction} */
  this.animationFn = null;

  /**
   * Animates shearing & panning according to current currentDragPosition
   * @private
   */
  ol.interaction.DragShearStatic.prototype.animation = function(){
    var o = this.options;
    var start =  goog.now();
    var demLayer = this.demLayer;
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       */
    var staticSpring = function(map, frameState) {
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + o.duration) {      

          var self = staticSpring;
          var friction = 1.0 - o.frictionForce;
          var springCoefficient = o.springCoefficient;
          var shearingXY = [demLayer.getTerrainShearing().x,demLayer.getTerrainShearing().y];
          var distance = Math.sqrt(shearingXY[0] * shearingXY[0] + shearingXY[1] * shearingXY[1]);

          if ( typeof self.currentChangeXY == 'undefined' ) {
              self.currentChangeXY = [0,0];
          }

          var accelerationXY = [shearingXY[0] * springCoefficient,
                                shearingXY[1] * springCoefficient];

          self.currentChangeXY = [(self.currentChangeXY[0] * friction)+accelerationXY[0],
                                  (self.currentChangeXY[1] * friction)+accelerationXY[1]];
          if(Math.abs(self.currentChangeXY[0]) < o.threshold) self.currentChangeXY[0] = 0;
          if(Math.abs(self.currentChangeXY[1]) < o.threshold) self.currentChangeXY[1] = 0;

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
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent)) {
    goog.asserts.assert(this.targetPointers.length >= 1); 
    this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);  
      
    var deltaX = (this.currentDragPositionPx[0] - this.startDragPositionPx[0])/(this.startDragElevation/this.view.getResolution());
    var deltaY = (this.startDragPositionPx[1] - this.currentDragPositionPx[1])/(this.startDragElevation/this.view.getResolution());
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
      this.animationFn = this.animation();
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
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent)) {

      if(goog.isNull(this.map)){
        this.map = mapBrowserEvent.map;
        this.view = this.map.getView();
        this.demLayer=/** @type {ol.layer.TileDem} */(this.map.getLayers().getArray()[this.map.getLayers().getArray().length-1]);
      }

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

