goog.provide('ol.ImageTile');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.dom');
goog.require('ol.Elevation');
goog.require('goog.async.Deferred');

/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @param {boolean=} opt_isDemTileImage
 */
ol.ImageTile = function(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_isDemTileImage) {

    goog.base(this, tileCoord, state);

    /**
     * Image URI
     *
     * @private
     * @type {string}
     */
    this.src_ = src;

    /**
     * @private
     * @type {Image}
     */
    this.image_ = new Image();
    if (!goog.isNull(crossOrigin)) {
        this.image_.crossOrigin = crossOrigin;
    }

    /**
     * @private
     * @type {Object.<number, Image>}
     */
    this.imageByContext_ = {};

    /**
     * @private
     * @type {Array.<number>}
     */
    this.imageListenerKeys_ = null;

    /**
     * @private
     * @type {ol.TileLoadFunctionType}
     */
    this.tileLoadFunction_ = tileLoadFunction;

    /**
     * @private
     * @type {boolean}
     */
    this.isDemTileImage = (opt_isDemTileImage) ? opt_isDemTileImage : false;

    if (this.isDemTileImage) {
        /**
         * @private
         * @type {number}
         */
        this.maxElevation = 0;

        /**
         * @private
         * @type {number}
         */
        this.minElevation = 0;

        /** 
         * @private
         * @type {CanvasRenderingContext2D}
         */
        this.canvasContext_ = null;
    }

};
goog.inherits(ol.ImageTile, ol.Tile);


/**
 * @inheritDoc
 * @api
 */
ol.ImageTile.prototype.getImage = function(opt_context) {
    if (goog.isDef(opt_context)) {
        var image;
        var key = goog.getUid(opt_context);
        if (key in this.imageByContext_) {
            return this.imageByContext_[key];
        } else if (goog.object.isEmpty(this.imageByContext_)) {
            image = this.image_;
        } else {
            image = /** @type {Image} */ (this.image_.cloneNode(false));
        }
        this.imageByContext_[key] = image;
        return image;
    } else {
        return this.image_;
    }
};


/**
 * Get pixel RGBA values of xy in image coordinates
 * @param {Array} pixelXY
 * @return {Uint8ClampedArray|Array} Pixel Values per Band
 * @public
 */
ol.ImageTile.prototype.getPixelValue = function(pixelXY) {
    if (!goog.isNull(this.canvasContext_)) {

        var colorValues = this.canvasContext_.getImageData(pixelXY[0], pixelXY[1], 1, 1).data;
        // var decoded = ol.Elevation.decode(colorValues);
        // console.log(colorValues, decoded);

        return colorValues;
    } else {
        return [0, 0];
    }
};

/**
 * Creates a Canvas Object of Tile Image and get pixel RGBA values of xy in image coordinates
 * @private
 */
ol.ImageTile.prototype.createCanvas = function() {
    if (goog.isNull(this.canvasContext_)) {
        this.canvasContext_ = ol.dom.createCanvasContext2D(this.image_.width, this.image_.height);
        this.canvasContext_.drawImage(this.getImage(), 0, 0, this.image_.width, this.image_.height);
    }
};

/**
 * Compute min and max elevations in a dem tile and store the values
 * @private
 */
ol.ImageTile.prototype.readMinMaxElevations = function() {
    if (!goog.isNull(this.canvasContext_)) {
        var imageDataArray = this.canvasContext_.getImageData(0, 0, this.image_.width, this.image_.height).data;
        var currentElevation;
        var max = 0,
            min = ol.Elevation.MAX;

        for (var i = 0; i <= Math.pow(this.image_.width, 2); i = i + 4) {

            currentElevation = ol.Elevation.decode([imageDataArray[i], imageDataArray[i + 1]]); // use red and green channel of every pixel

            if (currentElevation > max) {
                max = currentElevation;
            }
            if (currentElevation < min) {
                min = currentElevation;
            }
        }
        this.minElevation = min;
        this.maxElevation = max;
    }
};

/**
 * Compute min and max elevations in a dem tile and store the values
 * @return {Array}
 * @public
 */
ol.ImageTile.prototype.getMinMaxElevations = function() {
    return [this.minElevation, this.maxElevation];
};


/**
 * @inheritDoc
 */
ol.ImageTile.prototype.getKey = function() {
    return this.src_;
};


/**
 * Tracks loading or read errors.
 *
 * @private
 */
ol.ImageTile.prototype.handleImageError_ = function() {
    if (this.isDemTileImage) {
        // load blank no data tiles if tile belongs to elevation model
        this.src_ = 'data/blank.png';
        this.imageListenerKeys_ = null;
        this.state = ol.TileState.IDLE;
        this.load();
    } else {
        this.state = ol.TileState.ERROR;
        this.unlistenImage_();
        this.changed();
    }

};


/**
 * Tracks successful image load.
 *
 * @private
 */
ol.ImageTile.prototype.handleImageLoad_ = function() {
    if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
        if (!goog.isDef(this.image_.naturalWidth)) {
            this.image_.naturalWidth = this.image_.width;
            this.image_.naturalHeight = this.image_.height;
        }
    }

    if (this.image_.naturalWidth && this.image_.naturalHeight) {
        this.state = ol.TileState.LOADED;

        // test if loaded tile belongs to a elevation model
        if (this.isDemTileImage) {
            // decode elevations and compute statistics asynchronously
            var d = new goog.async.Deferred(undefined, this);
            d.addCallback(function() {
                this.createCanvas();
                this.readMinMaxElevations();
            });
            d.callback();
        }

    } else {
        this.state = ol.TileState.EMPTY;
    }
    this.unlistenImage_();
    this.changed();
};


/**
 * Load not yet loaded URI.
 */
ol.ImageTile.prototype.load = function() {
    if (this.state == ol.TileState.IDLE) {
        this.state = ol.TileState.LOADING;
        goog.asserts.assert(goog.isNull(this.imageListenerKeys_));
        this.imageListenerKeys_ = [
            goog.events.listenOnce(this.image_, goog.events.EventType.ERROR,
                this.handleImageError_, false, this),
            goog.events.listenOnce(this.image_, goog.events.EventType.LOAD,
                this.handleImageLoad_, false, this)
        ];
        this.tileLoadFunction_(this, this.src_);
    }
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ol.ImageTile.prototype.unlistenImage_ = function() {
    goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
    goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
    this.imageListenerKeys_ = null;
};
