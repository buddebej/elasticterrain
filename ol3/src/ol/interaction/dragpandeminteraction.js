goog.provide('ol.interaction.DragPanDem');

goog.require('goog.asserts');
goog.require('ol.Kinetic');
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
 * @param {olx.interaction.DragPanOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DragPanDem = function(opt_options) {
  goog.base(this, {
    handleDownEvent: ol.interaction.DragPanDem.handleDownEvent_,
    handleDragEvent: ol.interaction.DragPanDem.handleDragEvent_,
    handleUpEvent: ol.interaction.DragPanDem.handleUpEvent_
  });

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Kinetic|undefined}
   */
  this.kinetic_ = options.kinetic;

  /**
   * @private
   * @type {?ol.PreRenderFunction}
   */
  this.kineticPreRenderFn_ = null;

  /**
   * @type {ol.Pixel}
   */
  this.dragStartPosition_ = null;

  /**
   * @type {number}
   */
  this.dragStartElevation_ = null;

  /**
   * @private
   * @type {ol.layer.TileDem}
   */
  this.demLayer_ =  null;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ =  ol.events.condition.shiftKeyOnly;

  /**
   * @private
   * @type {boolean}
   */
  this.noKinetic_ = false;
};
goog.inherits(ol.interaction.DragPanDem, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragPanDem}
 * @private
 */
ol.interaction.DragPanDem.handleDragEvent_ = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetPointers.length >= 1);
  var currentPointerPosition = ol.interaction.Pointer.centroid(this.targetPointers);
  if (this.kinetic_) {
    this.kinetic_.update(currentPointerPosition[0], currentPointerPosition[1]);
  }
  if (!goog.isNull(this.dragStartPosition_)) {
    var deltaX = this.dragStartPosition_[0] - currentPointerPosition[0];
    var deltaY = currentPointerPosition[1] - this.dragStartPosition_[1];
    this.demLayer_.setTerrainShearing({x:deltaX,y:deltaY, z:this.dragStartElevation_});
    this.demLayer_.redraw();
  }
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragPanDem}
 * @private
 */
ol.interaction.DragPanDem.handleUpEvent_ = function(mapBrowserEvent) {

  var map = mapBrowserEvent.map;
  var view = map.getView();
  if (this.targetPointers.length === 0) {
    if (!this.noKinetic_ && this.kinetic_) {
      this.kineticPreRenderFn_ = this.kinetic_.explicitShearing();
      map.beforeRender(this.kineticPreRenderFn_);  

      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      var center = view.getCenter();
      goog.asserts.assert(goog.isDef(center));
      var centerpx = map.getPixelFromCoordinate(center);
      var dest = map.getCoordinateFromPixel([
        centerpx[0] - distance * Math.cos(angle),
        centerpx[1] - distance * Math.sin(angle)
      ]);

      console.log(distance,angle,center,dest);

      dest = view.constrainCenter(dest);
      view.setCenter(dest);

    } 
    view.setHint(ol.ViewHint.INTERACTING, -1);
    map.render(); 
    return false;
  } else {
    console.table('this.targetPointers.length more than 0');
    this.dragStartPosition_ = null;
    return true;
  }
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragPanDem}
 * @private
 */
ol.interaction.DragPanDem.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.demLayer_=/** @type {ol.layer.TileDem} */(map.getLayers().getArray()[map.getLayers().getArray().length-1]);
    if (!this.handlingDownUpSequence) {
      view.setHint(ol.ViewHint.INTERACTING, 1);
    }
    map.render();
    // new drag event while another one is not finished
    if (!goog.isNull(this.kineticPreRenderFn_) && map.removePreRenderFunction(this.kineticPreRenderFn_)) {
      this.kineticPreRenderFn_ = null;
    }
    if (this.kinetic_) {
      this.kinetic_.begin();
    }
    this.dragStartPosition_ = ol.interaction.Pointer.centroid(this.targetPointers);
    this.dragStartElevation_ = map.getRenderer().getLayerRenderer(this.demLayer_).getElevation(mapBrowserEvent.coordinate,view.getZoom());

    // No kinetic as soon as more than one pointer on the screen is
    // detected. This is to prevent nasty pans after pinch.
    this.noKinetic_ = this.targetPointers.length > 1;
    return true;
  } else {
    return false;
  }
};

/**
 * @inheritDoc
 */
ol.interaction.DragPanDem.prototype.shouldStopEvent = goog.functions.FALSE;
