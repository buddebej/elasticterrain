goog.provide('ol.animation.dem');

goog.require('ol.PreRenderFunction');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.easing');

/**
 * @private
 * @type {number}
 */
this.springCoefficient_ = 0.15;

/**
 * @private
 * @type {number}
 */
this.frictionForce_ = 0.10;

/**
 * @private
 * @type {number}
 */
this.duration_ = 1500;


var shearPanSpring = function(demLayer){
      var friction = 1.0 - this.frictionForce_;
      var springLength = {x:0.0,y:0.0};
      var acceleration = {x:0.0,y:0.0};

      var shearingX = demLayer.getTerrainShearing().x;
      var shearingY = demLayer.getTerrainShearing().y;      
      var distance = Math.sqrt(shearingX * shearingX + shearingY * shearingY);

      if ( typeof shearPanSpring.currentVelocity == 'undefined' ) {
          shearPanSpring.currentVelocity = {x:0,y:0};
      }

      acceleration.x = (shearingX - springLength.x) * this.springCoefficient_;
      acceleration.y = (shearingY - springLength.y) * this.springCoefficient_;

      // apply frictionForce and add acceleration
      shearPanSpring.currentVelocity.x = (shearPanSpring.currentVelocity.x * friction)+acceleration.x;
      shearPanSpring.currentVelocity.y = (shearPanSpring.currentVelocity.y * friction)+acceleration.y;

      if(Math.abs(shearPanSpring.currentVelocity.x) < 0.0001) shearPanSpring.currentVelocity.x = 0;
      if(Math.abs(shearPanSpring.currentVelocity.y) < 0.0001) shearPanSpring.currentVelocity.y = 0;

      // apply deltaShearing to current spring position
      shearingX=shearingX-shearPanSpring.currentVelocity.x;
      shearingY=shearingY-shearPanSpring.currentVelocity.y;

      return {x:shearingX, y:shearingY, z:demLayer.getTerrainShearing().z};
};


/**
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.dem.hybridShearing = function(demLayer, destinationCenter, currentCenter) {
  var start =  goog.now();
  var panEasing = ol.easing.easeOut;
  return (
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       */
      function(map, frameState) {
        var view = map.getView();
      
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + this.duration_ ) { 
          if(frameState.index%1 === 0){

            // panning
            var deltaPan = goog.math.clamp(panEasing((frameState.time - start) / 200),0,1.0);  

            var center = [currentCenter[0]-(currentCenter[0]-destinationCenter[0])*deltaPan,
                          currentCenter[1]-(currentCenter[1]-destinationCenter[1])*deltaPan];

            view.setCenter(center);

             // terrain shearing
            demLayer.setTerrainShearing(shearPanSpring(demLayer));
            demLayer.redraw();
          }
          frameState.animate = true;    
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;       
          return true;
        } else {
          return false;
        }
      });
};

/**
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.dem.staticShearing = function(demLayer) {
  var start =  goog.now();
  return (
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       */
      function(map, frameState) {
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + this.duration_ ) { 
          
          // terrain shearing
          demLayer.setTerrainShearing(shearPanSpring(demLayer));
          demLayer.redraw();

          frameState.animate = true;    
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;       
          return true;
        } else {
          return false;
        }
      });
};
