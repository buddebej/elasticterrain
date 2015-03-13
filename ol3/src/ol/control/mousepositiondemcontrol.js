// FIXME should listen on appropriate pane, once it is defined

goog.provide('ol.control.MousePositionDem');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.CoordinateFormatType');
goog.require('ol.coordinate');
goog.require('ol.Object');
goog.require('ol.Pixel');
goog.require('ol.TransformFunction');
goog.require('ol.control.Control');
goog.require('ol.proj');
goog.require('ol.proj.Projection');


/**
 * @enum {string}
 */
ol.control.MousePositionDemProperty = {
  PROJECTION: 'projection',
  COORDINATE_FORMAT: 'coordinateFormat'
};



/**
 * @classdesc
 * A control to show the 2D coordinates of the mouse cursor. By default, these
 * are in the view projection, but can be in any supported projection.
 * By default the control is shown in the top right corner of the map, but this
 * can be changed by using the css selector `.ol-mouse-position`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.layer.TileDem} demLayer  
 * @param {olx.control.MousePositionOptions=} opt_options Mouse position
 * @api stable
 */
ol.control.MousePositionDem = function(demLayer, opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};
  
  var className = goog.isDef(options.className) ?
      options.className : 'indicator ol-unselectable';

  var element = goog.dom.createDom(goog.dom.TagName.DIV, className);

  var render = goog.isDef(options.render) ?
      options.render : ol.control.MousePositionDem.render;

  goog.base(this, {
    element: element,
    render: render,
    target: options.target
  });

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.control.MousePositionDemProperty.PROJECTION),
      this.handleProjectionChanged_, false, this);

  if (goog.isDef(options.coordinateFormat)) {
    this.setCoordinateFormat(options.coordinateFormat);
  }
  if (goog.isDef(options.projection)) {
    this.setProjection(ol.proj.get(options.projection));
  }

  /**
   * @private
   * @type {ol.layer.TileDem}
   */
  this.demLayer_ = demLayer;

  /**
   * @private
   * @type {string}
   */
  this.undefinedHTML_ = goog.isDef(options.undefinedHTML) ?
      options.undefinedHTML : '';

  /**
   * @private
   * @type {string}
   */
  this.renderedHTML_ = element.innerHTML;

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.mapProjection_ = null;

  /**
   * @private
   * @type {?ol.TransformFunction}
   */
  this.transform_ = null;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.lastMouseMovePixel_ = null;



};
goog.inherits(ol.control.MousePositionDem, ol.control.Control);


/**
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.MousePositionDem}
 * @api
 */
ol.control.MousePositionDem.render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    this.mapProjection_ = null;
  } else {
    if (this.mapProjection_ != frameState.viewState.projection) {
      this.mapProjection_ = frameState.viewState.projection;
      this.transform_ = null;
    }
  }
  this.updateHTML_(this.lastMouseMovePixel_);
};


/**
 * @private
 */
ol.control.MousePositionDem.prototype.handleProjectionChanged_ = function() {
  this.transform_ = null;
};


/**
 * @return {ol.CoordinateFormatType|undefined} The format to render the current
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePositionDem.prototype.getCoordinateFormat = function() {
  return /** @type {ol.CoordinateFormatType|undefined} */ (
      this.get(ol.control.MousePositionDemProperty.COORDINATE_FORMAT));
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'getCoordinateFormat',
    ol.control.MousePositionDem.prototype.getCoordinateFormat);


/**
 * @return {ol.proj.Projection|undefined} The projection to report mouse
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePositionDem.prototype.getProjection = function() {
  return /** @type {ol.proj.Projection|undefined} */ (
      this.get(ol.control.MousePositionDemProperty.PROJECTION));
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'getProjection',
    ol.control.MousePositionDem.prototype.getProjection);


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePositionDem.prototype.handleMouseMove = function(browserEvent) {
  var map = this.getMap();
  this.lastMouseMovePixel_ = map.getEventPixel(browserEvent.getBrowserEvent());
  this.updateHTML_(this.lastMouseMovePixel_);
  this.show();
};


/**
 * hides indicator div
 */
ol.control.MousePositionDem.prototype.hide = function() {
    if(this.element.className !== 'indicator ol-unselectable hidden')
    this.element.className = 'indicator ol-unselectable hidden';
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'hide',
    ol.control.MousePositionDem.prototype.hide);

/**
 * shows indicator div
 */
ol.control.MousePositionDem.prototype.show = function() {
    if(this.element.className !== 'indicator ol-unselectable')  
    this.element.className = 'indicator ol-unselectable';
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'show',
    ol.control.MousePositionDem.prototype.show);



/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @protected
 */
ol.control.MousePositionDem.prototype.handleMouseOut = function(browserEvent) {
  this.updateHTML_(null);
  this.lastMouseMovePixel_ = null;
  this.hide();
};


/**
 * @inheritDoc
 * @api stable
 */
ol.control.MousePositionDem.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    var viewport = map.getViewport();
    this.listenerKeys.push(
        goog.events.listen(viewport, goog.events.EventType.MOUSEMOVE,
            this.handleMouseMove, false, this),
        goog.events.listen(viewport, goog.events.EventType.MOUSEOUT,
            this.handleMouseOut, false, this)
    );
  }
};


/**
 * @param {ol.CoordinateFormatType} format The format to render the current
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePositionDem.prototype.setCoordinateFormat = function(format) {
  this.set(ol.control.MousePositionDemProperty.COORDINATE_FORMAT, format);
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'setCoordinateFormat',
    ol.control.MousePositionDem.prototype.setCoordinateFormat);


/**
 * @param {ol.proj.Projection} projection The projection to report mouse
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePositionDem.prototype.setProjection = function(projection) {
  this.set(ol.control.MousePositionDemProperty.PROJECTION, projection);
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'setProjection',
    ol.control.MousePositionDem.prototype.setProjection);


/**
 * @param {?ol.Pixel} pixel Pixel.
 * @private
 */
ol.control.MousePositionDem.prototype.updateHTML_ = function(pixel) {
  var html = this.undefinedHTML_;
  var elevation = '';


  if (!goog.isNull(pixel) && !goog.isNull(this.mapProjection_)) {
    if (goog.isNull(this.transform_)) {
      var projection = this.getProjection();
      if (goog.isDef(projection)) {
        this.transform_ = ol.proj.getTransformFromProjections(
            this.mapProjection_, projection);
      } else {
        this.transform_ = ol.proj.identityTransform;
      }
    }
    var map = this.getMap();
    var coordinate = map.getCoordinateFromPixel(pixel);

    if (!goog.isNull(coordinate)) {
      elevation = Math.round(/** @type {ol.renderer.webgl.TileDemLayer} */(map.getRenderer().getLayerRenderer(this.demLayer_)).getElevation(coordinate,map.getView().getZoom()));
      elevation = ' : <b>'+ elevation + '</b> meters';
      this.transform_(coordinate, coordinate);  
      // flip lon lat to lat lon
      var tmp = coordinate[0];
      coordinate[0]=coordinate[1];
      coordinate[1]=tmp;
      var stringifyFunc = ol.coordinate.createStringXY(2);
      html = stringifyFunc(coordinate);
    } 
  }
  if (!goog.isDef(this.renderedHTML_) || html != this.renderedHTML_) {
    this.element.innerHTML = html+elevation;
    this.renderedHTML_ = html;
  }
};
