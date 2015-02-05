goog.provide('ol.animation');

goog.require('ol.PreRenderFunction');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.easing');


/**
 * @return {ol.PreRenderFunction} Pre-render function.
 * @api
 */
ol.animation.spring = function() {
  var start =  goog.now();
  var duration = 4000;

  var spring = function(shearing){

    if ( typeof spring.currentVelocity == 'undefined' ) {
        spring.currentVelocity = {x:0,y:0};
    }
    
    var frictionForce = 0.20;
    var springCoefficient = 0.10;

    var springLength = {x:0.0,y:0.0};
    var friction = 1.0 - frictionForce;
    var distance = Math.sqrt(shearing.x * shearing.x + shearing.y * shearing.y);
    var acceleration = {x:0.0,y:0.0};

    acceleration.x = (shearing.x - springLength.x) * springCoefficient;
    acceleration.y = (shearing.y - springLength.y) * springCoefficient;

    // apply frictionForce and add acceleration
    spring.currentVelocity.x = (spring.currentVelocity.x * friction)+acceleration.x;
    spring.currentVelocity.y = (spring.currentVelocity.y * friction)+acceleration.y;

    if(Math.abs(spring.currentVelocity.x) < 0.0001) spring.currentVelocity.x = 0;
    if(Math.abs(spring.currentVelocity.y) < 0.0001) spring.currentVelocity.y = 0;

    // apply deltaShearing to current spring position
    shearing.x=shearing.x-spring.currentVelocity.x;
    shearing.y=shearing.y-spring.currentVelocity.y;

    return shearing;
  };
  return (
      /**
       * @param {ol.Map} map Map.
       * @param {?olx.FrameState} frameState Frame state.
       */
      function(map, frameState) {
        var ol3dem=/** @type {ol.layer.TileDem} */(map.getLayers().getArray()[map.getLayers().getArray().length-1]);
        if (frameState.time < start) {
          frameState.animate = true;
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
          return true;
        } else if (frameState.time < start + duration) { // change condition to shearing=0 .. then exit
  
          if(frameState.index%2 === 0){
            spring(ol3dem.getTerrainShearing());
            ol3dem.redraw();
          }

          frameState.animate = true;    
          frameState.viewHints[ol.ViewHint.ANIMATING] += 1;       

          return true;
        } else {
          // TODO: Remove
          ol3dem.setTerrainShearing({x:0,y:0});
          ol3dem.redraw();
          console.log('animation end');
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
