goog.provide('ol.interaction.DragShearIntegrated');

goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('ol.Pixel');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');
goog.require('ol.ViewHint');

/** @typedef {{map:ol.Map,
               threshold:number,
               springCoefficient:number,
               frictionForce:number,
               minZoom:number,
               maxInnerShearingPx: number,
               maxOuterShearingPx: number,               
               keypress: ol.events.ConditionType}} */  

ol.interaction.DragShearIntegratedOptions;

/**
 * @classdesc
 * Terrain Interaction DragShearIntegrated
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {ol.interaction.DragShearIntegratedOptions} options 
 * @api stable
 */
ol.interaction.DragShearIntegrated = function(options) {
  goog.base(this, {
    handleDownEvent: ol.interaction.DragShearIntegrated.handleDownEvent_,
    handleDragEvent: ol.interaction.DragShearIntegrated.handleDragEvent_,
    handleUpEvent: ol.interaction.DragShearIntegrated.handleUpEvent_
  });


  /** @type {ol.interaction.DragShearIntegratedOptions} */  
  this.options;
  this.setOptions(options);

  /** @type {ol.Map} */
  this.map = this.options.map;

  /** @type {ol.View} */
  this.view = this.map.getView();

  /** @type {ol.layer.TileDem} */
  this.demLayer =  /** @type {ol.layer.TileDem} */(this.map.getLayers().getArray()[this.map.getLayers().getArray().length-1]);

  /** @type {ol.renderer.webgl.TileDemLayer} */ 
  this.demRenderer = /** @type {ol.renderer.webgl.TileDemLayer} */(this.map.getRenderer().getLayerRenderer(this.demLayer));

  /** @type {ol.events.ConditionType} */
  this.condition = goog.isDef(this.options['keypress']) ? this.options['keypress'] : ol.events.condition.noModifierKeys;

  /** @type {number} */
  this.minZoom = this.options.minZoom;

  /** @type {number} */
  this.currentSpringLength = 0;

  /** @type {ol.Pixel} */
  this.startDragPositionPx = [0,0];

  /** @type {number|null} */
  this.startDragElevation = 0;

  /** @type {number} */
  this.minElevation = 0;

  /** @type {number} */
  this.maxElevation = 0;

  /** @type {number} */
  this.criticalElevation = 0;

   /** @type {ol.Pixel} */
  this.startCenter = [0,0];

   /** @type {ol.Pixel} */
  this.currentCenter = [0,0];  

  /** @type {ol.Pixel} */
  this.currentChange = [0,0];

  /** @type {ol.Pixel} */
  this.currentDragPositionPx = [0,0];

  /** @type {number} */
  this.maxOuterShearingPx = 100;
  
  /** @type {Date} 
   * Time when last rendering occured. Used to measure FPS and adjust shearing speed accordingly. */
  this.lastRenderTime = null;

  /**
   * Animates shearing & panning according to current currentDragPosition
   */
  ol.interaction.DragShearIntegrated.prototype.animation = function(){
    var currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx);
    var startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx);
    var startCenter = this.startCenter;

    var
    shear = function(self,shearX,shearY){

        if(self.maxOuterShearingPx > 0.0){
          var shearLength=getDistance(shearX,shearY);
          var meterPerPixel = self.view.getResolution();
          if((meterPerPixel*shearLength)>(meterPerPixel*self.options['maxInnerShearingPx'])){
            shearX = (shearX/shearLength)*self.options['maxInnerShearingPx'];
            shearY = (shearY/shearLength)*self.options['maxInnerShearingPx'];
          }
        }

        self.demLayer.setTerrainShearing({x:shearX,y:shearY});
        self.demLayer.redraw();
    },

    getDistance = function(x,y){
      return Math.sqrt(x*x+y*y);
    };

   
    var animatingPosition = [startDragPosition[0] - (this.currentCenter[0] - startCenter[0]),
                             startDragPosition[1] - (this.currentCenter[1] - startCenter[1])];

    var distanceXY = [currentDragPosition[0] - animatingPosition[0],
                      currentDragPosition[1] - animatingPosition[1]];
   
    var distance = Math.sqrt(distanceXY[0] * distanceXY[0] + distanceXY[1] * distanceXY[1]);

    var springLengthXY = [distanceXY[0] * this.currentSpringLength/distance,
                          distanceXY[1] * this.currentSpringLength/distance];

    if(isNaN(springLengthXY[0])) springLengthXY[0] = 0;
    if(isNaN(springLengthXY[1])) springLengthXY[1] = 0;
    var currentTime = new Date();
    var dTsec = this.lastRenderTime !== null ? (currentTime.getTime() - this.lastRenderTime.getTime()) / 1000 : 1/50;
    this.lastRenderTime = currentTime;
    // FIXME: passed springCoefficient paramter should be 50 times larger 
    var k = this.options['springCoefficient'] * 50;
    var accelerationXY = [(distanceXY[0] - springLengthXY[0]) * k * dTsec,
                          (distanceXY[1] - springLengthXY[1]) * k * dTsec];
    var friction = (1-this.options['frictionForce']);
    this.currentChange = [this.currentChange[0]*friction+accelerationXY[0],
                          this.currentChange[1]*friction+accelerationXY[1]];

    // set change value to zero when not changing anymore significantly
    if(Math.abs(this.currentChange[0]) < this.options['threshold']) this.currentChange[0] = 0;
    if(Math.abs(this.currentChange[1]) < this.options['threshold']) this.currentChange[1] = 0;


    this.currentCenter[0] -= this.currentChange[0];
    this.currentCenter[1] -= this.currentChange[1];

    animatingPosition = [startDragPosition[0] - (this.currentCenter[0] - startCenter[0]),
                         startDragPosition[1] - (this.currentCenter[1] - startCenter[1])];

    distanceXY = [currentDragPosition[0] - animatingPosition[0],
                  currentDragPosition[1] - animatingPosition[1]];
   

    var animationActive = (Math.abs(this.currentChange[0]) > this.options['threshold'] && Math.abs(this.currentChange[1]) > this.options['threshold']);
    var hybridShearingActive = (Math.abs(springLengthXY[0]) > 0 && Math.abs(springLengthXY[1]) > 0); 
    var otherInteractionActive = (this.view.getHints()[ol.ViewHint.INTERACTING]); // other active interaction like zooming or rotation

    if((animationActive || (hybridShearingActive)) && !otherInteractionActive) {                
        if(this.startDragElevation > this.criticalElevation){   
         // HIGH ELEVATIONS                       
            shear(this,
                distanceXY[0]/this.startDragElevation,
                distanceXY[1]/this.startDragElevation);  

            this.view.setCenter([this.currentCenter[0],
                                this.currentCenter[1]]);

          
          // limit base wiggling for lower zoom levels                 
            // if(this.view.getZoom() >= this.minZoom){
            //   this.view.setCenter([this.currentCenter[0],
            //                        this.currentCenter[1]]);
            // } else {
            //   var zoomFactor = (this.minZoom/this.view.getZoom());
            //    this.view.setCenter([this.currentCenter[0] - distanceXY[0]*zoomFactor,
            //                        this.currentCenter[1] - distanceXY[1]*zoomFactor]);
            // }         

        } else {
          // LOW  ELEVATIONS  
            shear(this,
                -distanceXY[0]/(this.maxElevation-this.startDragElevation),
                -distanceXY[1]/(this.maxElevation-this.startDragElevation));   
      
            // make low elevation point stay under cursor
            this.view.setCenter([this.currentCenter[0] - distanceXY[0],
                                 this.currentCenter[1] - distanceXY[1]]);
        }

        this.animationDelay.start();

    } else {

      // restore shearing to 0 if other interaction like zooming or rotation is active
      if(this.view.getHints()[ol.ViewHint.INTERACTING]){
        this.demLayer.setTerrainShearing({x:0,y:0});
        this.demLayer.redraw();
      }

      this.animationDelay.stop();
      this.lastRenderTime = null;
    }
  };

  /**
   * @private
   * @type {goog.async.AnimationDelay}
   */
  this.animationDelay = new goog.async.AnimationDelay(this.animation,undefined,this);
  this.registerDisposable(this.animationDelay);
};

goog.inherits(ol.interaction.DragShearIntegrated, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragShearIntegrated}
 */

ol.interaction.DragShearIntegrated.handleDragEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent)) {
    goog.asserts.assert(this.targetPointers.length >= 1);
    
    this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers); 
    this.minElevation = this.demRenderer.getCurrentMinMax()[0];
    this.maxElevation = this.demRenderer.getCurrentMinMax()[1];
    this.criticalElevation = (this.maxElevation-this.minElevation)/2;

    this.animationDelay.start(); 

    if(this.maxOuterShearingPx > 0.0){
      var currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx);

      var startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx);
      var animatingPosition = [startDragPosition[0] - (this.currentCenter[0] - this.startCenter[0]),
                               startDragPosition[1] - (this.currentCenter[1] - this.startCenter[1])];
      var distanceX = currentDragPosition[0] - animatingPosition[0];
      var distanceY = currentDragPosition[1] - animatingPosition[1];
      var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      this.currentSpringLength = Math.min(this.options['maxOuterShearingPx']*this.view.getResolution(), distance);

      if(distance >= this.options['maxOuterShearingPx']*this.view.getResolution()){
            this.currentSpringLength = 0; 
            this.options['maxOuterShearingPx'] = 0;
      } 
    }

}
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragShearIntegrated}
 * @private
 */
ol.interaction.DragShearIntegrated.handleUpEvent_ = function(mapBrowserEvent) { 
  if (this.targetPointers.length === 0) {  

    if(this.maxOuterShearingPx > 0.0){
      this.currentSpringLength = 0; 
      this.options['maxOuterShearingPx'] = this.maxOuterShearingPx;
    }

    return true;
  } else{
    return false;
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragShearIntegrated}
 * @private
 */
ol.interaction.DragShearIntegrated.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent)) {
      this.startDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
      this.startDragElevation = this.demRenderer.getElevation(mapBrowserEvent.coordinate,this.view.getZoom());
      this.startCenter = [this.view.getCenter()[0],this.view.getCenter()[1]];
      this.currentCenter =[this.view.getCenter()[0],this.view.getCenter()[1]];
      this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
      this.maxOuterShearingPx = this.options.maxOuterShearingPx;
	  // console.log('this elevation: ',this.startDragElevation,'\n local min: ',this.minElevation,'\n local ma:x ',this.maxElevation);
      return true;
  } else {     
      return false;
  }
};


/**
 * Enable animations related this interaction
 */
ol.interaction.DragShearIntegrated.prototype.enable = function() {
  this.view.setHint(ol.ViewHint.INTERACTING, -1);
};
goog.exportProperty(
    ol.interaction.DragShearIntegrated.prototype,
    'enable',
    ol.interaction.DragShearIntegrated.prototype.enable);

/**
 * Disable animations related this interaction
 */
ol.interaction.DragShearIntegrated.prototype.disable = function() {
  if (!this.view.getHints()[ol.ViewHint.INTERACTING])  
  this.view.setHint(ol.ViewHint.INTERACTING, 1);
};
goog.exportProperty(
    ol.interaction.DragShearIntegrated.prototype,
    'disable',
    ol.interaction.DragShearIntegrated.prototype.disable);

/**
 * Set options
 * @param {ol.interaction.DragShearIntegratedOptions} options 
 */
ol.interaction.DragShearIntegrated.prototype.setOptions = function(options) {
  goog.asserts.assertInstanceof(options.map, ol.Map, 'dragShearIntegrated expects map object');
  goog.asserts.assert(goog.isDef(options.threshold));
  goog.asserts.assert(goog.isDef(options.springCoefficient));
  goog.asserts.assert(goog.isDef(options.frictionForce));
  goog.asserts.assert(goog.isDef(options.minZoom));
  goog.asserts.assert(goog.isDef(options.maxInnerShearingPx));   
  goog.asserts.assert(goog.isDef(options.maxOuterShearingPx)); 
  this.options = options;
};
goog.exportProperty(
    ol.interaction.DragShearIntegrated.prototype,
    'setOptions',
    ol.interaction.DragShearIntegrated.prototype.setOptions);
