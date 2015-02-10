goog.provide('ol.animation');

goog.require('ol.PreRenderFunction');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.easing');



var shearPanSpring = function(demLayer){
      var shearingX = demLayer.getTerrainShearing().x;
      var shearingY = demLayer.getTerrainShearing().y;

      var frictionForce = 0.10;
      var springCoefficient = 0.15;
      var springLength = {x:0.0,y:0.0};
      var friction = 1.0 - frictionForce;
      var distance = Math.sqrt(shearingX * shearingX + shearingY * shearingY);
      var acceleration = {x:0.0,y:0.0};

      if ( typeof shearPanSpring.currentVelocity == 'undefined' ) {
          shearPanSpring.currentVelocity = {x:0,y:0};
      }

      acceleration.x = (shearingX - springLength.x) * springCoefficient;
      acceleration.y = (shearingY - springLength.y) * springCoefficient;

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
ol.animation.hybridShearing = function(demLayer, destinationCenter, currentCenter) {
  var start =  goog.now();
  var duration = 1500;
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
        } else if (frameState.time < start + duration) { 
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
ol.animation.staticShearing = function(demLayer) {
  var start =  goog.now();
  var duration = 2000;
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
        } else if (frameState.time < start + duration) { 
          if(frameState.index%2 === 0){
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
 * @param {olx.animation.BounceOptions} options Bounce options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.bounce = function(options) {
  var resolution = options.resolution;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.upAndDown;
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
        } else if (frameState.time < start + duration) {
          var delta = easing((frameState.time - start) / duration);
          var deltaResolution = resolution - frameState.viewState.resolution;
          frameState.animate = true;
          frameState.viewState.resolution += delta * deltaResolution;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};


/**
 * @param {olx.animation.PanOptions} options Pan options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.pan = function(options) {
  var source = options.source;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var sourceX = source[0];
  var sourceY = source[1];
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.inAndOut;
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
        } else if (frameState.time < start + duration) {
          var delta = 1 - easing((frameState.time - start) / duration);
          var deltaX = sourceX - frameState.viewState.center[0];
          var deltaY = sourceY - frameState.viewState.center[1];
          frameState.animate = true;
          frameState.viewState.center[0] += delta * deltaX;
          frameState.viewState.center[1] += delta * deltaY;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};


/**
 * @param {olx.animation.RotateOptions} options Rotate options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.rotate = function(options) {
  var sourceRotation = goog.isDef(options.rotation) ? options.rotation : 0;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.inAndOut;
  var anchor = goog.isDef(options.anchor) ?
      options.anchor : null;

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
        } else if (frameState.time < start + duration) {
          var delta = 1 - easing((frameState.time - start) / duration);
          var deltaRotation =
              (sourceRotation - frameState.viewState.rotation) * delta;
          frameState.animate = true;
          frameState.viewState.rotation += deltaRotation;
          if (!goog.isNull(anchor)) {
            var center = frameState.viewState.center;
            ol.coordinate.sub(center, anchor);
            ol.coordinate.rotate(center, deltaRotation);
            ol.coordinate.add(center, anchor);
          }
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};


/**
 * @param {olx.animation.ZoomOptions} options Zoom options.
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.zoom = function(options) {
  var sourceResolution = options.resolution;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1000;
  var easing = goog.isDef(options.easing) ?
      options.easing : ol.easing.inAndOut;
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
        } else if (frameState.time < start + duration) {
          var delta = 1 - easing((frameState.time - start) / duration);
          var deltaResolution =
              sourceResolution - frameState.viewState.resolution;
          frameState.animate = true;
          frameState.viewState.resolution += delta * deltaResolution;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else {
          return false;
        }
      });
};
