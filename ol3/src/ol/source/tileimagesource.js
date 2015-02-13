goog.provide('ol.source.TileImage');

goog.require('goog.asserts');
goog.require('ol.ImageTile');
goog.require('ol.TileCache');
goog.require('ol.TileCoord');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.source.Tile');
goog.require('ol.TileRange');


/**
 * @classdesc
 * Base class for sources providing images divided into a tile grid.
 *
 * @constructor
 * @extends {ol.source.Tile}
 * @param {olx.source.TileImageOptions} options Image tile options.
 * @api
 */
ol.source.TileImage = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    opaque: options.opaque,
    projection: options.projection,
    state: goog.isDef(options.state) ?
        /** @type {ol.source.State} */ (options.state) : undefined,
    tileGrid: options.tileGrid,
    tilePixelRatio: options.tilePixelRatio
  });

  /**
   * @protected
   * @type {ol.TileUrlFunctionType}
   */
  this.tileUrlFunction = goog.isDef(options.tileUrlFunction) ?
      options.tileUrlFunction :
      ol.TileUrlFunction.nullTileUrlFunction;

  /**
   * @protected
   * @type {?string}
   */
  this.crossOrigin =
      goog.isDef(options.crossOrigin) ? options.crossOrigin : null;

  /**
   * @public
   * @type {ol.TileCache}
   */
  this.tileCache = new ol.TileCache();

  /**
   * @protected
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction = goog.isDef(options.tileLoadFunction) ?
      options.tileLoadFunction : ol.source.TileImage.defaultTileLoadFunction;

  /**
   * @protected
   * @type {function(new: ol.ImageTile, ol.TileCoord, ol.TileState, string,
   *        ?string, ol.TileLoadFunctionType)}
   */
  this.tileClass = goog.isDef(options.tileClass) ?
      options.tileClass : ol.ImageTile;

};
goog.inherits(ol.source.TileImage, ol.source.Tile);


/**
 * @param {ol.ImageTile} imageTile Image tile.
 * @param {string} src Source.
 */
ol.source.TileImage.defaultTileLoadFunction = function(imageTile, src) {

  var tileCoord = imageTile.tileCoord;
  var z = tileCoord[0];

  if(z>11 && goog.string.contains(src,'eudem')){
    
    var isEven = function (n) {
          n = Number(n);
          return n === 0 || !!(n && !(n%2));
         },
        x = tileCoord[1], 
        y = Math.abs(tileCoord[2]+1), 
        q=0;

    var zz = z, tileRange = ol.TileRange.createOrUpdate(0, x, 0, y, tileRange);
    for (zz = z; zz >= 12; --zz) {
      tileRange.minX = tileRange.maxX >>= 1;
      tileRange.minY = tileRange.maxY >>= 1;
    }

    var oldcord = z+'/'+x+'/'+y;
    var newcord = zz+'/'+tileRange.minX+'/'+Math.abs(tileRange.maxY);      
    src = src.replace(oldcord,newcord);

    if(isEven(x) && isEven(y)){q=1;}
    if(!isEven(x) && isEven(y)){q=2;}
    if(isEven(x) && !isEven(y)){q=3;}
    if(!isEven(x) && !isEven(y)){q=4;}
    imageTile['q'] = q;

  }
  imageTile.getImage().src = src;
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.canExpireCache = function() {
  return this.tileCache.canExpireCache();
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.expireCache = function(usedTiles) {
  this.tileCache.expireCache(usedTiles);
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.getTile =
    function(z, x, y, pixelRatio, projection) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    goog.asserts.assert(projection);
    var tileCoord = [z, x, y];
    var tileUrl = this.tileUrlFunction(tileCoord, pixelRatio, projection);
    var tile = new this.tileClass(
        tileCoord,
        goog.isDef(tileUrl) ? ol.TileState.IDLE : ol.TileState.EMPTY,
        goog.isDef(tileUrl) ? tileUrl : '',
        this.crossOrigin,
        this.tileLoadFunction);
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * @return {ol.TileLoadFunctionType} TileLoadFunction
 * @api
 */
ol.source.TileImage.prototype.getTileLoadFunction = function() {
  return this.tileLoadFunction;
};


/**
 * @return {ol.TileUrlFunctionType} TileUrlFunction
 * @api
 */
ol.source.TileImage.prototype.getTileUrlFunction = function() {
  return this.tileUrlFunction;
};


/**
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @api
 */
ol.source.TileImage.prototype.setTileLoadFunction = function(tileLoadFunction) {
  //this.tileCache.clear();
  //this.tileLoadFunction = tileLoadFunction;
  this.changed();
};


/**
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @api
 */
ol.source.TileImage.prototype.setTileUrlFunction = function(tileUrlFunction) {
  // FIXME It should be possible to be more intelligent and avoid clearing the
  // FIXME cache.  The tile URL function would need to be incorporated into the
  // FIXME cache key somehow.
  this.tileCache.clear();
  this.tileUrlFunction = tileUrlFunction;
  this.changed();
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.useTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};
