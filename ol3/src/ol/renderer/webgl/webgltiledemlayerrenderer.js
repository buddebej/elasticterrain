goog.provide('ol.renderer.webgl.TileDemLayer');
// REQUIRES
    goog.require('goog.array');
    goog.require('goog.asserts');
    goog.require('goog.object');
    goog.require('goog.vec.Mat4');
    goog.require('goog.vec.Vec4');
    goog.require('goog.webgl');
    goog.require('ol.TileRange');
    goog.require('ol.TileCache');
    goog.require('ol.TileState');
    goog.require('ol.extent');
    goog.require('ol.Kinetic');    
    goog.require('ol.layer.TileDem');
    goog.require('ol.layer.Tile');
    goog.require('ol.math');
    goog.require('ol.renderer.webgl.Layer');
    goog.require('ol.renderer.webgl.tiledemlayer.shader');
    goog.require('ol.tilecoord');
    goog.require('ol.tilegrid.TileGrid');
    goog.require('ol.webgl.Buffer');

/**
 * @classdesc
 * Core class of ol3dem based on webgltilelayerrenderer, openlayers 3.1.1
 * @author Jonas Buddeberg
 *
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.TileDem} tileDemLayer Tile layer.
 */
ol.renderer.webgl.TileDemLayer = function(mapRenderer, tileDemLayer) {
  goog.base(this, mapRenderer, tileDemLayer);

  /**
   * VertexBuffer contains vertices: meshResolution * meshResolution
   * IndexBuffer contains elements for vertexBuffer
   * @private
   * @return {Object.<string, ol.webgl.Buffer>} vertexBuffer, indexBuffer
   */
  ol.renderer.webgl.TileDemLayer.prototype.getTileMesh = function(meshResolution) {
    var vb = [],
      tb = [],
      ib = [],
      v = 0,
      vertices = meshResolution, // number of vertices per edge
      cellSize = 1 / (vertices - 1);
    // rows
    for (var x = 0; x < vertices; x += 1) {
      // columns
      for (var y = 0; y < vertices; y += 1) {
        // vertex coordinates
        vb.push(x * cellSize, y * cellSize);
        // dont draw triangles beyond tile extend!      
        if (x < vertices - 1 && y < vertices - 1) {
          // two triangles
          // v+vertices *\ * v+vertices+1
          //          v * \* v+1
          ib.push(v, v + vertices, v + 1, v + vertices, v + vertices + 1, v + 1);
        }
        v += 1;
      }
    }
    return {
      vertexBuffer: new ol.webgl.Buffer(vb),
      indexBuffer: new ol.webgl.Buffer(ib)
    };
  };

  /**
   * Returns lookup texture with colorramp for hypsometric coloring
   * @private
   * @return {Uint8Array} .
   */
  ol.renderer.webgl.TileDemLayer.prototype.getColorRampTexture = function() {
    var colors = new Array(
      66, 120, 40, 255,
      78, 129, 49, 255,
      90, 138, 58, 255,
      103, 147, 67, 255,
      115, 156, 76, 255,
      127, 165, 85, 255,
      140, 174, 94, 255,
      146, 175, 95, 255,
      152, 176, 96, 255,
      159, 178, 98, 255,
      165, 179, 99, 255,
      171, 181, 101, 255,
      178, 182, 102, 255,
      184, 184, 104, 255,
      190, 185, 105, 255,
      197, 187, 107, 255,
      203, 188, 108, 255,
      210, 190, 110, 255,
      213, 195, 122, 255,
      217, 200, 134, 255,
      221, 205, 146, 255,
      225, 211, 158, 255,
      228, 216, 170, 255,
      232, 222, 182, 255,
      236, 227, 194, 255,
      240, 233, 206, 255,
      243, 238, 218, 255,
      247, 244, 230, 255,
      251, 249, 242, 255,
      255, 255, 255, 255);
    return new Uint8Array(colors);
  };

  /**
   * Decode Elevation from Color Values 
   * @private
   * @return {number} elevationM Elevation in meters
   */
  ol.renderer.webgl.TileDemLayer.prototype.decodeElevation = function(rgba) {
      var elevationM = ((rgba[0] + rgba[1]*256.0)-11000.0)/10.0;
      return elevationM;
  };

  /**
   * @private
   * @type {ol.webgl.shader.Fragment}
   */
  this.fragmentShader_ =
      ol.renderer.webgl.tiledemlayer.shader.Fragment.getInstance();

  /**
   * @private
   * @type {ol.webgl.shader.Vertex}
   */
  this.vertexShader_ = ol.renderer.webgl.tiledemlayer.shader.Vertex.getInstance();

  /**
   * @private
   * @type {ol.renderer.webgl.tiledemlayer.shader.Locations}
   */
  this.locations_ = null;

  /**
   * OverlayTiles
   * @private
   * @type {Object.<string, boolean|number|ol.layer.Tile|ol.source.TileImage|function(boolean):boolean>} 
   */  
  this.overlay = {'Active': false,
                  'ID': 0,
                  'Tiles':null,
                  'Source':null                
                 };

  /**
   * @private
   * @type {Uint8Array}
   */
  this.arrayColorRamp_ = this.getColorRampTexture();
 
  /**
   * @private
   * @type {ol.TileRange}
   */
  this.renderedTileRange_ = null;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedFramebufferExtent_ = null;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = -1;

  /**
   * @private
   * @type {WebGLTexture}
   */
  this.textureColorRamp_ = null;

  /**
   * @private
   * @type {number}
   */
  this.timeoutCounter_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.timeoutCounterMax_ = 200;

   /**
   * @public
   * @type {ol.TileCache}
   */
  this.tileCache_ = null;

   /**
   * @public
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid_ = null;

   /**
   * @public
   * @type {number}
   */
  this.maxShearing_ = 4.0;

  /**
   * @public
   * @param {Array} xy in Mercator 
   * @param {number} z Zoomlevel
   * @return {ol.TileCoord}
   */
  ol.renderer.webgl.TileDemLayer.prototype.getTileCoord = function(xy,z) { 
    return this.tileGrid_.getTileCoordForCoordAndZ(xy,z);
  };

  /**
   * @public
   * @param {Array} xy in Mercator 
   * @param {number|undefined} z Zoomlevel
   * @return {number|null}
   */
  ol.renderer.webgl.TileDemLayer.prototype.getElevation = function(xy,z) { 
      var tc = this.getTileCoord(xy,((!goog.isDef(z))? 1 : z));
      var xyzKey = ol.tilecoord.getKeyZXY(tc[0],tc[1],tc[2]);
      var tileExtent = this.tileGrid_.getTileCoordExtent(tc); // minX, minY, maxX, maxY
      var tileXY = [0,0];
      var elevation = 0;
      tileXY[0] = Math.floor(((xy[0]-tileExtent[0]) / (tileExtent[2] - tileExtent[0]))*256); 
      tileXY[1] = 256-Math.floor(((xy[1]-tileExtent[1]) / (tileExtent[3] - tileExtent[1]))*256); 
      elevation = this.decodeElevation(this.tileCache_.get(xyzKey).getPixelValue(tileXY));
      return elevation;
  };
  goog.exportProperty(
      ol.renderer.webgl.TileDemLayer.prototype,
      'getElevation',
      ol.renderer.webgl.TileDemLayer.prototype.getElevation);
};

goog.inherits(ol.renderer.webgl.TileDemLayer, ol.renderer.webgl.Layer);

/**
 * @inheritDoc
 */
ol.renderer.webgl.TileDemLayer.prototype.disposeInternal = function() {
  var mapRenderer = this.getWebGLMapRenderer();
  var context = mapRenderer.getContext();
  context.deleteBuffer(this.tileMesh_.vertexBuffer);
  context.deleteBuffer(this.tileMesh_.indexBuffer);  
  goog.base(this, 'disposeInternal');
};

/**
 * @inheritDoc
 */
ol.renderer.webgl.TileDemLayer.prototype.handleWebGLContextLost = function() {
  goog.base(this, 'handleWebGLContextLost');
  this.locations_ = null;
};

/**
 * @inheritDoc
 */
ol.renderer.webgl.TileDemLayer.prototype.prepareFrame = function(frameState, layerState, context) {
  // INIT
      var mapRenderer = this.getWebGLMapRenderer();
      var map = mapRenderer.map_;
      var gl = context.getGL();
      var viewState = frameState.viewState;
      var projection = viewState.projection;
      var tileDemLayer = this.getLayer();
      goog.asserts.assertInstanceof(tileDemLayer, ol.layer.TileDem);
      var tileSource = tileDemLayer.getSource();
      if(goog.isNull(this.tileCache_)){
        this.tileCache_ = /** @type {ol.source.TileImage} */(tileSource).tileCache;
      }
      var tileGrid = tileSource.getTileGridForProjection(projection);
      if(goog.isNull(this.tileGrid_)){
        this.tileGrid_ = tileGrid;
      }
      var z = tileGrid.getZForResolution(viewState.resolution);
      var tileResolution = tileGrid.getResolution(z);
      var tilePixelSize = tileSource.getTilePixelSize(z, frameState.pixelRatio, projection);
      var pixelRatio = tilePixelSize / tileGrid.getTileSize(z);
      var tilePixelResolution = tileResolution / pixelRatio;
      var tileGutter = tileSource.getGutter();
      var center = viewState.center;
      var extent;
      this.timeoutCounter_++;

      // increase tile extent 
      var padding = {x: 256, y: 256}; 
      if (tileResolution == viewState.resolution) {
          center = this.snapCenterToPixel(center, tileResolution, [frameState.size[0]-padding.x,frameState.size[1]-padding.y]);    
          extent = ol.extent.getForViewAndSize(center, tileResolution, viewState.rotation, [frameState.size[0]+padding.x,frameState.size[1]+padding.y]);    
      } else {
          extent = frameState.extent;
      }

      var tileRange = tileGrid.getTileRangeForExtentAndResolution(extent, tileResolution);
      var framebufferExtent;
      
  if (!goog.isNull(this.renderedTileRange_) && this.renderedTileRange_.equals(tileRange) && this.renderedRevision_ == tileSource.getRevision()) {
  // DO NOTHING, RE-RENDERING NOT NEEDED
      framebufferExtent = this.renderedFramebufferExtent_;
  } else {
  // (RE-)RENDER COMPLETE VIEWPORT 
      // COMPUTE EXTENT OF FRAMEBUFFER
          var tileRangeSize = tileRange.getSize();
          var maxDimension = Math.max(tileRangeSize[0] * tilePixelSize, tileRangeSize[1] * tilePixelSize);
          var framebufferDimension = ol.math.roundUpToPowerOfTwo(maxDimension);
          var framebufferExtentDimension = tilePixelResolution * framebufferDimension;
          var origin = tileGrid.getOrigin(z);
          var minX = origin[0] + tileRange.minX * tilePixelSize * tilePixelResolution;
          var minY = origin[1] + tileRange.minY * tilePixelSize * tilePixelResolution;
          framebufferExtent = [
            minX, minY,
            minX + framebufferExtentDimension, minY + framebufferExtentDimension
          ];
          this.bindFramebuffer(frameState, framebufferDimension);
          gl.viewport(0, 0, framebufferDimension, framebufferDimension);

      // LOAD SHADERS
          var program = context.getProgram(this.fragmentShader_, this.vertexShader_);
          context.useProgram(program);
          if (goog.isNull(this.locations_)) {
            this.locations_ = new ol.renderer.webgl.tiledemlayer.shader.Locations(gl, program);
          }

      // CLEAR BUFFERS
          gl.clearColor(0, 0, 0, 0);
          gl.clear(goog.webgl.COLOR_BUFFER_BIT);
          gl.clearDepth(1.0);
          gl.clear(goog.webgl.DEPTH_BUFFER_BIT);

      // INTIAL CHECK FOR OVERLAY
          if(!goog.isNull(tileDemLayer.getOverlayTiles())) {  // check if a Layer was defined for overlay
              this.overlay.Id = map.getLayers().getArray().indexOf(tileDemLayer.getOverlayTiles());  
              if(this.overlay.Id >= 0){ 
                this.overlay.Active = true;
              }
            } else {
                this.overlay.Active =false;
            }

      // TERRAIN SHEARING
          var shearX, shearY, shearingFactor;
          if(tileDemLayer.getTerrainInteraction()){
            // from current terrain interaction
            shearingFactor = tileDemLayer.getTerrainShearing();     
            shearX = goog.math.clamp(shearingFactor.x,-this.maxShearing_,this.maxShearing_);
            shearY = goog.math.clamp(shearingFactor.y,-this.maxShearing_,this.maxShearing_);             
          } else {
            // from obliqueInclination angle and current rotation
            shearingFactor = 1.0 / Math.tan(goog.math.toRadians(tileDemLayer.getObliqueInclination()));
            shearX = shearingFactor*Math.sin(-viewState.rotation);
            shearY = shearingFactor*Math.cos(-viewState.rotation);      
          }
          
          // u_scaleFactor: factors for plan oblique shearing
          gl.uniform2f(this.locations_.u_scaleFactor, shearX, shearY); 
          // u_tileSizeM: estimated size of one tile in meter at the equator (dependend of current zoomlevel z)
          gl.uniform1f(this.locations_.u_tileSizeM, 40000000.0 / Math.pow(2.0, z));  

      // FRAGMENT SHADER PARAMETER
          // u_overlayActive: Is overlay active?
          gl.uniform1f(this.locations_.u_overlayActive, this.overlay.Active === true ? 1.0 : 0.0);    
          // u_colorScale: pass colorScale factor to adapt color ramp dynamically
          gl.uniform2f(this.locations_.u_colorScale, tileDemLayer.getColorScale()[0],tileDemLayer.getColorScale()[1]); 
          // u_waterBodies: pass waterBodies to toggle rendering of inland waterBodies
          gl.uniform1f(this.locations_.u_waterBodies, tileDemLayer.getWaterBodies() === true ? 1.0 : 0.0);
          // u_testing: pass flag to activate testing mode
          gl.uniform1f(this.locations_.u_testing, tileDemLayer.getTesting() === true ? 1.0 : 0.0);
          // u_hillShading: pass flag to activate hillShading
          gl.uniform1f(this.locations_.u_hillShading, tileDemLayer.getHillShading() === true ? 1.0 : 0.0);
          // u_light: compute light direction from Zenith and Azimuth and dependend of current map rotation
          var zenithRad = goog.math.toRadians(90.0-tileDemLayer.getLightZenith()),
              azimuthRad = goog.math.toRadians(tileDemLayer.getLightAzimuth())+viewState.rotation,
              lightZ = Math.cos(zenithRad),
              lightY = Math.sin(zenithRad) * Math.cos(azimuthRad),
              lightX = Math.sin(zenithRad) * Math.sin(azimuthRad);
          gl.uniform3f(this.locations_.u_light, lightX, lightY, lightZ);
          // u_ambient_light: pass intensity for an ambient light source
          gl.uniform1f(this.locations_.u_ambient_light, tileDemLayer.getAmbientLight());        

      // COLORING
          // dont create color lookup when in overlay mode
          if(!this.overlay.Active){
            // create lookup texture only once
            if(goog.isNull(this.textureColorRamp_)){
              this.textureColorRamp_ = gl.createTexture();
            }
            gl.activeTexture(goog.webgl.TEXTURE1);
            gl.bindTexture(goog.webgl.TEXTURE_2D, this.textureColorRamp_);

            // read color ramp array and store it in textureColorRamp
            gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, 1, this.arrayColorRamp_.length / 4, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, this.arrayColorRamp_);
            gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.LINEAR);
            gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.LINEAR);
            gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S, goog.webgl.CLAMP_TO_EDGE);
            gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T, goog.webgl.CLAMP_TO_EDGE);
            gl.uniform1i(this.locations_.u_colorRamp, 1);
          }

      // MESH 
          // check if mesh resolution has changed
          if(!goog.isObject(this.tileMesh_) ||  this.tileMesh_.resolution!=tileDemLayer.getResolution()){
            // drop old buffers
            if(goog.isObject(this.tileMesh_)){
              context.deleteBuffer(this.tileMesh_.vertexBuffer);
              context.deleteBuffer(this.tileMesh_.indexBuffer);
            }  
            // compute mesh for current resolution
            /**
             * @private
             * @type {Object.<string, ol.webgl.Buffer>}
             */
            this.tileMesh_ = this.getTileMesh(goog.math.safeCeil(tileDemLayer.getResolution()*128));
            this.tileMesh_.resolution=tileDemLayer.getResolution();
          }

          // Write the vertex coordinates to the buffer object
          context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.tileMesh_.vertexBuffer);  
          gl.enableVertexAttribArray(this.locations_.a_position);
          gl.vertexAttribPointer(this.locations_.a_position, 2, goog.webgl.FLOAT, false, 0, 0);
          // Write the indices to the buffer object
          context.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.tileMesh_.indexBuffer);  

      // SELECT TILE IMAGES AND BIND AS TEXTURES

          /** @type {Object.<number, Object.<string, ol.Tile>>} */
          var tilesToDrawByZ = {};
          tilesToDrawByZ[z] = {}; 
          var cIfLoaded = function(usource,self){
                return self.createGetTileIfLoadedFunction(
                            function(tile) {
                              return !goog.isNull(tile) && 
                              tile.getState() == ol.TileState.LOADED && 
                              mapRenderer.isTileTextureLoaded(tile);
                        }, usource, pixelRatio, projection);
              };
          var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource, tilesToDrawByZ, cIfLoaded(tileSource,this));    
          var useInterimTilesOnError = tileDemLayer.getUseInterimTilesOnError();
          var allTilesLoaded = true;
          var tmpExtent = ol.extent.createEmpty();
          var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
          var childTileRange, tile, tileState, x, y, tileExtent;
          
          /** @type {Array.<number>} */
          var zs;
          var u_tileOffset = goog.vec.Vec4.createFloat32();
          var i, ii, sx, sy, tileKey, tilesToDraw, tx, ty;

          /** @type {Object.<string, *>} */
          var fullyLoaded = {};

          /** @type {Object.<number, Object.<string, ol.Tile>>} */
          var overlayTilesToDrawByZ = {};
          var overlayTile, overlayTileState, overlayTilesToDraw;

          // determines offset for each tile in target framebuffer and passes uniform to shader
          var defUniformOffset = function(tile, renderer) {
              tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord, tmpExtent);
              //minX, maxX, minY, maxY
              sx = 2 * (tileExtent[2] - tileExtent[0]) /
                  framebufferExtentDimension;
              sy = 2 * (tileExtent[3] - tileExtent[1]) /
                  framebufferExtentDimension;
              tx = 2 * (tileExtent[0] - framebufferExtent[0]) /
                  framebufferExtentDimension - 1;
              ty = 2 * (tileExtent[1] - framebufferExtent[1]) /
                  framebufferExtentDimension - 1;            
              goog.vec.Vec4.setFromValues(u_tileOffset, sx, sy, tx, ty);
              gl.uniform4fv(renderer.locations_.u_tileOffset, u_tileOffset);
            };

          // CREATE TEXTURE QUEUE AND DRAW TILES
            if(this.overlay.Active) {  
            // RENDER TILES WITH OVERLAY

                  // type cast because ol.Map stores layers only as layer.Base, which does not offer getSources()
                  this.overlay.Tiles = /** @type {ol.layer.Tile} */ (map.getLayers().getArray()[this.overlay.Id]);
                  goog.asserts.assertInstanceof(this.overlay.Tiles, ol.layer.Tile);
                  this.overlay.Source = this.overlay.Tiles.getSource();
                  overlayTilesToDrawByZ[z] = {};

                  var findLoadedOverlayTiles = goog.bind(this.overlay.Source.findLoadedTiles, this.overlay.Source, overlayTilesToDrawByZ, cIfLoaded(this.overlay.Source,this));  
                  
                  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
                    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

                      tile = tileSource.getTile(z, x, y, pixelRatio, projection);          
                      overlayTile = this.overlay.Source.getTile(z, x, y, pixelRatio, projection);

                      tileState = tile.getState();
                      overlayTileState = overlayTile.getState(); 
                      if (tileState == ol.TileState.LOADED && overlayTileState == ol.TileState.LOADED) {
                        if (mapRenderer.isTileTextureLoaded(tile) && mapRenderer.isTileTextureLoaded(overlayTile)) {
                            tilesToDrawByZ[z][ol.tilecoord.toString(tile.tileCoord)] = tile;
                            overlayTilesToDrawByZ[z][ol.tilecoord.toString(overlayTile.tileCoord)] = overlayTile;   
                            continue;
                        }
                      } else if (tileState == ol.TileState.EMPTY ||
                                 (tileState == ol.TileState.ERROR &&
                                  !useInterimTilesOnError)) {
                        continue;
                      }
                      
                      allTilesLoaded = false;
                      // put preload tiles from higher zoomlevels into queue
                      fullyLoaded.overlay = tileGrid.forEachTileCoordParentTileRange(overlayTile.tileCoord, findLoadedOverlayTiles, null, tmpTileRange, tmpExtent);
                      fullyLoaded.dem = tileGrid.forEachTileCoordParentTileRange(tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent); 
                      if (!fullyLoaded.overlay || !fullyLoaded.dem) {
                        childTileRange = tileGrid.getTileCoordChildTileRange(tile.tileCoord, tmpTileRange, tmpExtent);
                        if (!goog.isNull(childTileRange)) {
                          findLoadedOverlayTiles(z + 1, childTileRange);
                          findLoadedTiles(z + 1, childTileRange);
                        }
                      }
                    }
                  }
                  
                  zs = goog.array.map(goog.object.getKeys(overlayTilesToDrawByZ), Number);
                  goog.array.sort(zs);
                  for (i = 0, ii = zs.length; i < ii; ++i) {
                    overlayTilesToDraw = overlayTilesToDrawByZ[zs[i]];
                    if(tilesToDrawByZ.hasOwnProperty(zs[i])){
                      tilesToDraw = tilesToDrawByZ[zs[i]];
                    } else {
                      tilesToDraw = overlayTilesToDraw;
                    }                    
                    // iterate through tile queue: bind texture (+overlay), draw triangles
                    for (tileKey in overlayTilesToDraw) {               
                        overlayTile = overlayTilesToDraw[tileKey];  
                        // determine offset for each tile in target framebuffer
                        defUniformOffset(overlayTile, this);                
                        gl.activeTexture(goog.webgl.TEXTURE2);
                        mapRenderer.bindTileTexture(overlayTile, tilePixelSize, tileGutter * pixelRatio, goog.webgl.NEAREST, goog.webgl.NEAREST);
                        gl.uniform1i(this.locations_.u_overlayTexture, 2);  

                        if(tilesToDraw.hasOwnProperty(tileKey)){
                            tile = tilesToDraw[tileKey];
                            gl.activeTexture(goog.webgl.TEXTURE0);
                            mapRenderer.bindTileTexture(tile, tilePixelSize, tileGutter * pixelRatio, goog.webgl.NEAREST, goog.webgl.NEAREST);
                            gl.uniform1i(this.locations_.u_texture, 0);        
                        }
                        // draw triangle mesh. getCount is number of triangles * 2, method added in webgl.buffer
                        gl.drawElements(goog.webgl.TRIANGLES, this.tileMesh_.indexBuffer.getCount(), goog.webgl.UNSIGNED_INT, 0);
                    }
                }
            } else {
            // RENDER TILES WITHOUT OVERLAY

                for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
                  for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
                    tile = tileSource.getTile(z, x, y, pixelRatio, projection);
                    tileState = tile.getState();                    
                    if (tileState == ol.TileState.LOADED) {
                      if (mapRenderer.isTileTextureLoaded(tile)) {
                          tilesToDrawByZ[z][ol.tilecoord.toString(tile.tileCoord)] = tile;
                          continue;
                      }
                    } else if (tileState == ol.TileState.EMPTY || (tileState == ol.TileState.ERROR && !useInterimTilesOnError)) {
                      continue;
                    }
                    allTilesLoaded = false;
                    // preload tiles from lower zoomlevels
                    fullyLoaded.dem = tileGrid.forEachTileCoordParentTileRange(tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
                    // do some preloading of higher zoomlevels??
                    if (!fullyLoaded.dem) {
                      childTileRange = tileGrid.getTileCoordChildTileRange(tile.tileCoord, tmpTileRange, tmpExtent);
                      if (!goog.isNull(childTileRange)) {
                        findLoadedTiles(z + 1, childTileRange);
                      }
                    }
                  }
                }

                zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
                goog.array.sort(zs);
                for (i = 0, ii = zs.length; i < ii; ++i) {
                  tilesToDraw = tilesToDrawByZ[zs[i]];
                   // iterate through tile queue
                  for (tileKey in tilesToDraw) {     
                      tile = tilesToDraw[tileKey];   
                      // determine offset for each tile in target framebuffer
                      defUniformOffset(tile, this);
                      goog.vec.Vec4.setFromValues(u_tileOffset, sx, sy, tx, ty);
                      gl.uniform4fv(this.locations_.u_tileOffset, u_tileOffset);       
                      // TILE TEXTURE
                      gl.activeTexture(goog.webgl.TEXTURE0);
                      mapRenderer.bindTileTexture(tile, tilePixelSize,tileGutter * pixelRatio, goog.webgl.NEAREST, goog.webgl.NEAREST);
                      gl.uniform1i(this.locations_.u_texture, 0);        
                      // draw triangle mesh. getCount is number of triangles * 2, method added in webgl.buffer
                      gl.drawElements(goog.webgl.TRIANGLES, this.tileMesh_.indexBuffer.getCount(), goog.webgl.UNSIGNED_INT, 0);
                  }
              }               
            }
  // CHECK IF EVERYTHING IS LOADED
      if (allTilesLoaded || this.timeoutCounter_ > this.timeoutCounterMax_) {
          this.renderedTileRange_ = tileRange;
          this.renderedFramebufferExtent_ = framebufferExtent;
          this.renderedRevision_ = tileSource.getRevision();
          goog.asserts.assert(this.timeoutCounter_ < this.timeoutCounterMax_, 'Loading of tiles timed out.');
          this.timeoutCounter_ = 0;
        } else {   
          this.renderedTileRange_ = null;
          this.renderedFramebufferExtent_ = null;
          this.renderedRevision_ = -1;
          frameState.animate = true;  
        }
      }

  // LOAD TILES AND MAINTAIN QUEUE
      var tileTextureQueue = mapRenderer.getTileTextureQueue();
      var loadTiles = function(usource, layer, self){
        self.updateUsedTiles(frameState.usedTiles, usource, z, tileRange);  
        self.manageTilePyramid(frameState, usource, tileGrid, pixelRatio, projection, extent, z, layer.getPreload(), 
            /**
             * @param {ol.Tile} tile Tile.
             */
            function(tile) {
                  if (tile.getState() == ol.TileState.LOADED &&
                      !mapRenderer.isTileTextureLoaded(tile) &&
                      !tileTextureQueue.isKeyQueued(tile.getKey())) {
                    tileTextureQueue.enqueue([
                      tile,
                      tileGrid.getTileCoordCenter(tile.tileCoord),
                      tileGrid.getResolution(tile.tileCoord[0]),
                      tilePixelSize, tileGutter * pixelRatio
                    ]);
                  }
            } , self);
        self.scheduleExpireCache(frameState, usource);
        self.updateLogos(frameState, usource);
      };
      
      loadTiles(tileSource,tileDemLayer,this);
      if(this.overlay.Active){
        loadTiles(this.overlay.Source,this.overlay.Tiles,this);
      }

  // ZOOM AND ROTATION
      var texCoordMatrix = this.texCoordMatrix;
      goog.vec.Mat4.makeIdentity(texCoordMatrix);
      goog.vec.Mat4.translate(texCoordMatrix,
          (center[0] - framebufferExtent[0]) /
              (framebufferExtent[2] - framebufferExtent[0]),
          (center[1] - framebufferExtent[1]) /
              (framebufferExtent[3] - framebufferExtent[1]),
          0);
      if (viewState.rotation !== 0) {
        goog.vec.Mat4.rotateZ(texCoordMatrix, viewState.rotation);
      }
      goog.vec.Mat4.scale(texCoordMatrix,
          frameState.size[0] * viewState.resolution /
              (framebufferExtent[2] - framebufferExtent[0]),
          frameState.size[1] * viewState.resolution /
              (framebufferExtent[3] - framebufferExtent[1]),
          1);
      goog.vec.Mat4.translate(texCoordMatrix,
          -0.5,
          -0.5,
          0);

  return true;
};
