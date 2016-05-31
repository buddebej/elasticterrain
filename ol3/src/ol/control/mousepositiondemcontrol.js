// FIXME should listen on appropriate pane, once it is defined

goog.provide('ol.control.MousePositionDem');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
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
    PROJECTION: 'projection'
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
 * @api stable
 */
ol.control.MousePositionDem = function(demLayer) {

    var className = 'indicator ol-unselectable';

    var element = goog.dom.createDom(goog.dom.TagName.DIV, className);

    var render = ol.control.MousePositionDem.render;

    goog.base(this, {
        element: element,
        render: render
    });


    this.setProjection(ol.proj.get('EPSG:4326'));

    /**
     * @private
     * @type {ol.layer.TileDem}
     */
    this.demLayer_ = demLayer;

    /**
     * @private
     * @type {string}
     */
    this.undefinedHTML_ = '';

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
     * @type {boolean}
     */
    this.enabled_ = true;

    /**
     * @private
     * @type {boolean}
     */
    this.freeze_ = false;

    /**
     * @private
     * @type {ol.Pixel}
     */
    this.lastMouseMovePixel_ = null;

    // hide on init before first mouse move on map
    this.hide();
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
    if (!this.freeze_ && !frameState.viewHints[ol.ViewHint.INTERACTING] && !frameState.viewHints[ol.ViewHint.ANIMATING]) {
        this.updateHTML_(this.lastMouseMovePixel_);
    }
};

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
    if (this.enabled_) {
        this.lastMouseMovePixel_ = map.getEventPixel(browserEvent.getBrowserEvent());
        if (!this.freeze_) {
            this.updateHTML_(this.lastMouseMovePixel_);
        }
        this.show();
    }
};

/**
 * enables or disables indicator div
 */
ol.control.MousePositionDem.prototype.enable = function() {
    this.enabled_ = true;
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'enable',
    ol.control.MousePositionDem.prototype.enable);

/**
 * disables or disables indicator div
 */
ol.control.MousePositionDem.prototype.disable = function() {
    this.enabled_ = false;
    this.hide();
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'disable',
    ol.control.MousePositionDem.prototype.disable);

/**
 * enables or disables indicator div
 * @param {boolean} state 
 * @public
 */
ol.control.MousePositionDem.prototype.setFreeze = function(state) {
    this.freeze_ = state;
    // if(!state){
    this.updateHTML_(this.lastMouseMovePixel_);
    // }
};


/**
 * hides indicator div
 */
ol.control.MousePositionDem.prototype.hide = function() {
    if (this.element.className !== 'indicator ol-unselectable hidden') {
        this.element.className = 'indicator ol-unselectable hidden';
    }
};
goog.exportProperty(
    ol.control.MousePositionDem.prototype,
    'hide',
    ol.control.MousePositionDem.prototype.hide);

/**
 * shows indicator div
 */
ol.control.MousePositionDem.prototype.show = function() {
    if (this.element.className !== 'indicator ol-unselectable') {
        this.element.className = 'indicator ol-unselectable';
    }
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
 * @param {ol.proj.Projection} projection The projection to report mouse
 *     position in.
 * @observable
 * @api stable
 */
ol.control.MousePositionDem.prototype.setProjection = function(projection) {
    this.set(ol.control.MousePositionDemProperty.PROJECTION, projection);
};


/**
 * @param {?ol.Pixel} pixel Pixel.
 * @private
 */
ol.control.MousePositionDem.prototype.updateHTML_ = function(pixel) {
    var html = this.undefinedHTML_;
    var elevation = '';
    var latlon = '';

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
            elevation = /** @type {ol.renderer.webgl.TileDemLayer} */ (map.getRenderer().getLayerRenderer(this.demLayer_)).getElevation(coordinate, map.getView().getZoom());
            elevation = (elevation === ol.Elevation.MIN) ? '' : elevation.toFixed(1) + ' m, ';

            this.transform_(coordinate, coordinate);

            // transform decimal coordinates to lat lon expressed by degrees and minutes : 47°22′N 8°33′E
            var decimalDegToDegMin = function(d, lng) {
                // If user pans further then 180E or 180W adapt d
                var coord = {};
                if (lng) {
                    while (Math.abs(d) > 180) {
                        d = (d < -180) ? d + 360 : d - 360;
                    }
                    coord = {
                        dir: d < 0 ? 'W' : 'E',
                        deg: 0 | (d < 0 ? d = -d : d),
                        min: 0 | d % 1 * 60
                    };
                } else {
                    coord = {
                        dir: d < 0 ? 'S' : 'N',
                        deg: 0 | (d < 0 ? d = -d : d),
                        min: 0 | d % 1 * 60
                    };
                }

                return coord.deg + '°' + coord.min + '′' + coord.dir;
            };

            latlon = decimalDegToDegMin(coordinate[1], false) + '  ' + decimalDegToDegMin(coordinate[0], true);
            html = elevation + latlon + ', z: ' + map.getView().getZoom();
        }
    }
    if (!goog.isDef(this.renderedHTML_) || html != this.renderedHTML_) {
        this.element.innerHTML = html;
        this.renderedHTML_ = html;
    }
};
