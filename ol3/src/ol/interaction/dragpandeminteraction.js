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
  this.originCentroid_ = null;

  /**
   * @private
   * @type {ol.layer.TileDem}
   */
  this.ol3dem_ =  null;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.noModifierKeys;

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
  var centroid = ol.interaction.Pointer.centroid(this.targetPointers);
  if (this.kinetic_) {
    this.kinetic_.update(centroid[0], centroid[1]);
  }
  if (!goog.isNull(this.originCentroid_)) {
    var deltaX = this.originCentroid_[0] - centroid[0];
    var deltaY = centroid[1] - this.originCentroid_[1];
    this.ol3dem_.setTerrainShearing({x:deltaX,y:deltaY});
    this.ol3dem_.redraw();
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
    if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {

      this.kineticPreRenderFn_ = this.kinetic_.explicitShearing();
      map.beforeRender(this.kineticPreRenderFn_);  
    } 
    view.setHint(ol.ViewHint.INTERACTING, -1);
    map.render(); 

    return false;
  } else {
    this.originCentroid_ = null;
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
    this.ol3dem_=/** @type {ol.layer.TileDem} */(map.getLayers().getArray()[map.getLayers().getArray().length-1]);

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

    this.originCentroid_ = ol.interaction.Pointer.centroid(this.targetPointers);
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
