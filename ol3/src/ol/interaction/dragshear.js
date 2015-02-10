goog.provide('ol.interaction.DragShear');

goog.require('goog.asserts');
goog.require('ol.animation.dem');
goog.require('ol.Pixel');
goog.require('ol.PreRenderFunction');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');

/**
 * @classdesc
 * Terrain Interaction.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @api stable
 */
ol.interaction.DragShear = function() {
  goog.base(this, {
    handleDownEvent: ol.interaction.DragShear.handleDownEvent_,
    handleDragEvent: ol.interaction.DragShear.handleDragEvent_,
    handleUpEvent: ol.interaction.DragShear.handleUpEvent_
  });

  /**
   * @private
   * @type {?ol.PreRenderFunction}
   */
  this.shearingAnimation_ = null;

  /**
   * @type {ol.Pixel}
   */
  this.dragStartPosition_ = null;

  /**
   * @type {null|number}
   */
  this.dragStartElevation_ = null;

  /**
   * @private
   * @type {ol.layer.TileDem}
   */
  this.demLayer_ =  null;

  /**
   * @private
   * @type {number}
   */
  this.shearingThreshold_ = 70;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ =  ol.events.condition.shiftKeyOnly;

};
goog.inherits(ol.interaction.DragShear, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragShear}
 * @private
 */
ol.interaction.DragShear.handleDragEvent_ = function(mapBrowserEvent) {
  if (!goog.isNull(this.dragStartPosition_)) {
      var map = mapBrowserEvent.map;
      var view = map.getView();

      goog.asserts.assert(this.targetPointers.length >= 1);
      var currentPointerPosition = ol.interaction.Pointer.centroid(this.targetPointers);
    
      var deltaX = this.dragStartPosition_[0] - currentPointerPosition[0];
      var deltaY = currentPointerPosition[1] - this.dragStartPosition_[1];
      this.demLayer_.setTerrainShearing({x:deltaX,y:deltaY, z:this.dragStartElevation_});
      this.demLayer_.redraw();

      if(Math.abs(deltaX)>this.shearingThreshold_ || Math.abs(deltaY)>this.shearingThreshold_){
        var currentCenter = view.getCenter();
        var currentCenterPx = map.getPixelFromCoordinate(currentCenter);
        var panDestination = map.getCoordinateFromPixel([currentCenterPx[0]+deltaX,
                                                         currentCenterPx[1]-deltaY]);

        this.shearingAnimation_ = ol.animation.dem.hybridShearing(this.demLayer_,panDestination,currentCenter);

        map.beforeRender(this.shearingAnimation_);  
        map.render(); 

        this.dragStartPosition_ = null;
      }
  }
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragShear}
 * @private
 */
ol.interaction.DragShear.handleUpEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length === 0) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    if(!goog.isNull(this.dragStartPosition_)){
        this.shearingAnimation_ = ol.animation.dem.staticShearing(this.demLayer_);
        map.beforeRender(this.shearingAnimation_);  
        this.dragStartPosition_ = null;
    }
    map.render(); 
    view.setHint(ol.ViewHint.INTERACTING, -1);

    return false;
  } else {
    return true;
  }
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragShear}
 * @private
 */
ol.interaction.DragShear.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.demLayer_=/** @type {ol.layer.TileDem} */(map.getLayers().getArray()[map.getLayers().getArray().length-1]);
    if (!this.handlingDownUpSequence) {
      view.setHint(ol.ViewHint.INTERACTING, 1);
    }
    map.render();

    // new drag event while another one is not finished
    if (!goog.isNull(this.shearingAnimation_) && map.removePreRenderFunction(this.shearingAnimation_)) {
      this.shearingAnimation_ = null;
    }

    this.dragStartPosition_ = ol.interaction.Pointer.centroid(this.targetPointers);
    this.dragStartElevation_ = /** @type {ol.renderer.webgl.TileDemLayer} */(map.getRenderer().getLayerRenderer(this.demLayer_)).getElevation(mapBrowserEvent.coordinate,view.getZoom());

 
    return true;
  } else {
    return false;
  }
};

/**
 * @inheritDoc
 */
ol.interaction.DragShear.prototype.shouldStopEvent = goog.functions.FALSE;
