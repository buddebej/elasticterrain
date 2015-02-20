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
               hybridShearingRadiusPx: number,
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

  goog.asserts.assertInstanceof(options.map, ol.Map, 'dragShearIntegrated expects map object');
  goog.asserts.assert(goog.isDef(options.threshold));
  goog.asserts.assert(goog.isDef(options.springCoefficient));
  goog.asserts.assert(goog.isDef(options.frictionForce));
  goog.asserts.assert(goog.isDef(options.minZoom));
  goog.asserts.assert(goog.isDef(options.hybridShearingRadiusPx)); 

  /** @type {ol.interaction.DragShearIntegratedOptions} */  
  this.options = options;

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



  /**
   * Animates shearing & panning according to current currentDragPosition
   */
  ol.interaction.DragShearIntegrated.prototype.animation = function(){
    var currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx);
    var startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx);
    var startCenter = this.startCenter;
     
    var shift = function(self,shiftX,shiftY){
      self.view.setCenter([self.startCenter[0]-shiftX,self.startCenter[1]-shiftY]);
    };

    var shear = function(self,shearX,shearY){
        self.demLayer.setTerrainShearing({x:shearX,y:shearY});
        self.demLayer.redraw();
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
    var accelerationXY = [(distanceXY[0] - springLengthXY[0]) * this.options['springCoefficient'],
                          (distanceXY[1] - springLengthXY[1]) * this.options['springCoefficient']];

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

          // // limit base wiggling for lower zoom levels                 
          //   if(this.view.getZoom() >= this.minZoom){
          //     newCenter = [this.currentCenter[0],
          //                  this.currentCenter[1]];
          //   } else {
          //     var zoomFactor = 1-(this.view.getZoom()/this.minZoom);
          //     newCenter = [this.currentCenter[0] - distanceXY[0]*3*zoomFactor,
          //                  this.currentCenter[1] - distanceXY[1]*3*zoomFactor];
          //   }         

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

    if(this.options['hybridShearingRadiusPx'] > 0.0){
      var currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx);

      var startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx);
      var animatingPosition = [startDragPosition[0] - (this.currentCenter[0] - this.startCenter[0]),
                               startDragPosition[1] - (this.currentCenter[1] - this.startCenter[1])];
      var distanceX = currentDragPosition[0] - animatingPosition[0];
      var distanceY = currentDragPosition[1] - animatingPosition[1];
      var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      this.currentSpringLength = Math.min(this.options['hybridShearingRadiusPx']*this.view.getResolution(), distance);

      if(distance >= this.options['hybridShearingRadiusPx']*this.view.getResolution()){
            this.currentSpringLength = 0; 
            this.options['hybridShearingRadiusPx'] = 0;
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
    this.currentSpringLength = 0; 
    this.options['hybridShearingRadiusPx'] = 70;
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

      console.log('this elevation: ',this.startDragElevation,'\n local min: ',this.minElevation,'\n local ma:x ',this.maxElevation);
      return true;
  } else {     
      return false;
  }
};


/**
 * Is this interaction active?
 * @return {boolean}
 */
ol.interaction.DragShearIntegrated.prototype.activeInteraction = function() {
  if (!this.view.getHints()[ol.ViewHint.INTERACTING]) {
    return true;
  } else {
    return false;
  }
};
goog.exportProperty(
    ol.interaction.DragShearIntegrated.prototype,
    'activeInteraction',
    ol.interaction.DragShearIntegrated.prototype.activeInteraction);

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
  this.view.setHint(ol.ViewHint.INTERACTING, 1);
};
goog.exportProperty(
    ol.interaction.DragShearIntegrated.prototype,
    'disable',
    ol.interaction.DragShearIntegrated.prototype.disable);
