// ELASTIC TERRAIN MAP

// Copyright (C) 2015 Jonas Buddeberg <buddebej * mailbox.org>, 
//                    Bernhard Jenny <jennyb * geo.oregonstate.edu>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

goog.provide('ol.interaction.DragShearIntegrated');

goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('ol.Pixel');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.Pointer');
goog.require('ol.ViewHint');
goog.require('ol.Elevation');

/** @typedef {{map:ol.Map,
 threshold:number,
 springCoefficient:number,
 frictionForce:number,
 maxTerrainDistortion: number,
 dragDistanceBeforePan: number,
 explicitFadeOutAnimationSpeed: number,
 hybridTransitionDampingDuration: number }} */
ol.interaction.DragShearIntegratedOptions;


/**
 * @classdesc
 * Terrain Interaction DragShearIntegrated
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {ol.interaction.DragShearIntegratedOptions} options
 * @param {ol.Map} map
 * @param {ol.events.ConditionType} condition
 * @api stable
 */
ol.interaction.DragShearIntegrated = function(options, map, condition) {
    goog.base(this, {
        handleDownEvent: ol.interaction.DragShearIntegrated.handleDownEvent_,
        handleDragEvent: ol.interaction.DragShearIntegrated.handleDragEvent_,
        handleUpEvent: ol.interaction.DragShearIntegrated.handleUpEvent_
    });

    /**
     * Shearing Interaction State
     * @enum {number}
     */
    ol.interaction.State = {
        NO_SHEARING: 0,
        EXPLICIT_SHEARING: 1,
        INTEGRATED_SHEARING: 2,
        ANIMATION_AFTER_EXPLICIT_SHEARING: 3
    };

    /** @type {ol.interaction.DragShearIntegratedOptions} */
    this.options;
    this.setOptions(options);

    goog.asserts.assertInstanceof(map, ol.Map, 'dragShearIntegrated expects map object');

    /** @type {ol.Map} */
    this.map = map;

    /** @type {ol.View} */
    this.view = this.map.getView();

    // find elevation model layer
    var demIndex = null;
    goog.array.forEach(this.map.getLayers().getArray(), function(v, i, array) {
        if ( /** @type {ol.source.TileImage} */ ( /** @type {ol.layer.TileDem|ol.layer.Tile} */ (v).getSource()).isDemTileImage) {
            demIndex = i;
        }
    });
    /** @type {ol.layer.TileDem} */
    this.demLayer = /** @type {ol.layer.TileDem} */ (this.map.getLayers().getArray()[demIndex]);

    /** @type {ol.renderer.webgl.TileDemLayer} */
    this.demRenderer = /** @type {ol.renderer.webgl.TileDemLayer} */ (this.map.getRenderer().getLayerRenderer(this.demLayer));

    /** @type {ol.events.ConditionType} */
    this.condition = goog.isDef(condition['keypress']) ? condition['keypress'] : ol.events.condition.noModifierKeys;

    /** @type {null|ol.control.MousePositionDem} */
    this.elevationIndicator = /** @type {ol.control.MousePositionDem} */ (this.map.getControls().getArray()[3]);

    // FIXME: The above expression should be better solved like this: (However, InstanceOf does not work correct)
    // this.elevationIndicator = /** @type {ol.control.MousePositionDem} */ (goog.array.find(this.map.getControls().getArray(),
    //     function(element, index, array) {
    //         console.log(element);
    //         return (goog.asserts.assertInstanceof(element, ol.control.MousePositionDem));
    //     }, this));

    /** @type {number} */
    this.springLength = 0;

    /** @type {ol.Pixel} */
    this.startDragPositionPx = [0, 0];

    /** @type {number|null} */
    this.startDragElevation = 0;

    /** @type {number} */
    this.minElevation = ol.Elevation.MIN;

    /** @type {number} */
    this.maxElevation = ol.Elevation.MAX;

    /** @type {number} */
    this.minElevationLocal = ol.Elevation.MIN;

    /** @type {number} */
    this.maxElevationLocal = ol.Elevation.MAX;

    /** @type {ol.Pixel} */
    this.startCenter = [0, 0];

    /** @type {ol.Pixel} */
    this.currentCenter = [0, 0];

    /** @type {number}
     * Horizontal speed of the terrain animation [meters per second]
     */
    this.vx_t_1 = 0;

    /** @type {number}
     * Vertical speed of the terrain animation [meters per second]
     */
    this.vy_t_1 = 0;

    /** @type {ol.Pixel} */
    this.currentDragPositionPx = [0, 0];

    /** @type {Date}
     * Time when last rendering occured. Used to measure FPS and adjust shearing speed accordingly. */
    this.lastRenderTime = null;

    /** @type {Date}
     * Time when animation started. Used for debugging and logging. */
    this.timeSinceAnimationBegin = null;

    /** @type {number}
     * Average FPS value */
    this.fpsMean = 0;

    /** @type {number}
     * Counter for active animation */
    this.animationFrameCounter = 0;

    /** @type {number}
     * Time when static shearing changed to hybrid shearing in milliseconds. */
    this.integratedShearingStartTimeMS = -1;

    /** @type {number}
     * Distance between current mouse position and point being animated [meters].*/
    this.distanceX = 0;

    /** @type {number}
     * Distance between current mouse position and point being animated [meters] */
    this.distanceY = 0;

    /** @type {number} */
    this.shearingStatus = ol.interaction.State.NO_SHEARING;

    /** @type {?olx.FrameState} */
    this.frameState;

    /**
     * @type {function(boolean)}
     * @private
     */
    this.lowFpsAlert = function(state) {};

    /**
     * @type {function(number=, number=)}
     * @private
     */
    this.onMouseUpCallback = function(z, distDragged) {};

    /**
     * @private
     * @type {goog.async.AnimationDelay}
     */
    this.animationDelay = new goog.async.AnimationDelay(this.animation, undefined, this);
    this.registerDisposable(this.animationDelay);
};

goog.inherits(ol.interaction.DragShearIntegrated, ol.interaction.Pointer);

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragShearIntegrated}
 */

ol.interaction.DragShearIntegrated.handleDragEvent_ = function(mapBrowserEvent) {

    if (this.targetPointers.length === 1 && this.condition(mapBrowserEvent)) {
        goog.asserts.assert(this.targetPointers.length >= 1);

        this.frameState = mapBrowserEvent.frameState;

        // store current drag position
        this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);

        if (this.shearingStatus === ol.interaction.State.EXPLICIT_SHEARING) {

            // position of drag start and current drag in meters
            var currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx),
                startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx),

                // position of point that is animated [meters]. Compensate for shifted map center.
                animatingPositionX = startDragPosition[0] - (this.currentCenter[0] - this.startCenter[0]),
                animatingPositionY = startDragPosition[1] - (this.currentCenter[1] - this.startCenter[1]),

                // distance between current mouse position and point being animated
                distanceX = currentDragPosition[0] - animatingPositionX,
                distanceY = currentDragPosition[1] - animatingPositionY,
                distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY),

                // convert dragDistanceBeforePanning radius to meters
                dragDistanceBeforePanning = this.options['dragDistanceBeforePan'] * this.view.getResolution();

            // set spring length equal to drag distance, limited to dragDistanceBeforePanning
            this.springLength = Math.min(dragDistanceBeforePanning, distance);

            // switch from explicit shearing to integrated shearing if the pointer is leaving the outer circle.
            if (distance >= dragDistanceBeforePanning) {
                this.integratedShearingStartTimeMS = new Date().getTime();
                this.shearingStatus = ol.interaction.State.INTEGRATED_SHEARING;
            }
        }

        // trigger animation (if not running yet)
        this.animationDelay.start();
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
        if (this.shearingStatus === ol.interaction.State.EXPLICIT_SHEARING) {
            this.shearingStatus = ol.interaction.State.ANIMATION_AFTER_EXPLICIT_SHEARING;
            this.springLength = 0;
        }
        // unfreeze values for elevation and coordinate indicator after dragging
        if (!goog.isNull(this.elevationIndicator)) {
            this.elevationIndicator.setFreeze(false);
        }


        // to track interaction in userstudy, not needed for production
        var xDistanceDragPx = (this.currentCenter[0] - this.startCenter[0]) / this.view.getResolution(),
            yDistanceDragPx = (this.currentCenter[1] - this.startCenter[1]) / this.view.getResolution(),
            xyDistanceDragPx = Math.round(Math.sqrt(xDistanceDragPx * xDistanceDragPx + yDistanceDragPx * yDistanceDragPx));
        this.onMouseUpCallback(this.view.getZoom(), xyDistanceDragPx);

        return true;

    }
    return false;
};

/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragShearIntegrated}
 * @private
 */
ol.interaction.DragShearIntegrated.handleDownEvent_ = function(mapBrowserEvent) {
    var minMax, minMaxLocal,
        mapCenter;

    if (this.targetPointers.length > 0 && this.condition(mapBrowserEvent)) {

        // get global max and min for visible extent
        minMax = this.demRenderer.getStaticMinMax();
        this.minElevation = minMax[0];
        this.maxElevation = minMax[1];

        // lock minMax to make sure the shader uses the same minMax values as this interaction
        this.demRenderer.setFreezeMinMax(true);

        // compute local minMax only when needed
        if (ol.Elevation.MinMaxNeighborhoodSize >= 0) {
            // get local max and min of the tile segments close to the dragged point
            minMaxLocal = this.demRenderer.getLocalMinMax(mapBrowserEvent.coordinate, this.view.getZoom());
            if (goog.isDef(minMaxLocal)) {
                this.minElevationLocal = minMaxLocal[0];
                this.maxElevationLocal = minMaxLocal[1];
            }
        } else {
            this.minElevationLocal = this.minElevation;
            this.maxElevationLocal = this.maxElevation;
        }

        mapCenter = this.view.getCenter();
        this.startDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
        this.startDragElevation = this.demRenderer.getElevation(mapBrowserEvent.coordinate, this.view.getZoom());
        this.startCenter = [mapCenter[0], mapCenter[1]];
        this.currentCenter = [mapCenter[0], mapCenter[1]];
        this.currentDragPositionPx = ol.interaction.Pointer.centroid(this.targetPointers);
        this.shearingStatus = ol.interaction.State.EXPLICIT_SHEARING;
        this.animationDelay.stop();
        this.lastRenderTime = null;
        this.distanceX = this.distanceY = 0;
        this.vx_t_1 = this.vy_t_1 = 0;
        this.animationFrameCounter = 0;
        this.fpsMean = 0;

        // freeze values for elevation and coordinate indicator when dragging
        if (!goog.isNull(this.elevationIndicator)) {
            this.elevationIndicator.setFreeze(true);
        }
        return true;
    }
    return false;
};

/**
 * Stop all animations related this interaction
 */
ol.interaction.DragShearIntegrated.prototype.stopAnimation = function() {
    this.animationDelay.stop();
    this.lastRenderTime = null;
    this.distanceX = this.distanceY = 0;
    this.vx_t_1 = this.vy_t_1 = 0;
    this.shear(0, 0);
    this.shearingStatus = ol.interaction.State.NO_SHEARING;
    // unlock minMax
    this.demRenderer.setFreezeMinMax(false);
    // after every animation, analyse fps and adapt mesh resolution if automatic resolution is enabled
    // fire lowFpsAlert callback if defined
    if (this.getFps() < 50) {
        // if automatic resolution
        if (this.demLayer.getResolution() === 0) {
            this.demLayer.setAutoResolution({
                low: true
            });
        }
        this.lowFpsAlert(true);
    } else {
        if (this.demLayer.getResolution() === 0) {
            this.lowFpsAlert(false);
        }
    }
};
goog.exportProperty(ol.interaction.DragShearIntegrated.prototype, 'stopAnimation', ol.interaction.DragShearIntegrated.prototype.stopAnimation);


/**
 * Enable animations related this interaction
 */
ol.interaction.DragShearIntegrated.prototype.enable = function() {
    this.view.setHint(ol.ViewHint.INTERACTING, -1);
};
goog.exportProperty(ol.interaction.DragShearIntegrated.prototype, 'enable', ol.interaction.DragShearIntegrated.prototype.enable);

/**
 * Disable animations related this interaction
 */
ol.interaction.DragShearIntegrated.prototype.disable = function() {
    if (!this.view.getHints()[ol.ViewHint.INTERACTING]) {
        this.view.setHint(ol.ViewHint.INTERACTING, 1);
    }
};
goog.exportProperty(ol.interaction.DragShearIntegrated.prototype, 'disable', ol.interaction.DragShearIntegrated.prototype.disable);

/**
 * Set options
 * @param {ol.interaction.DragShearIntegratedOptions} options
 */
ol.interaction.DragShearIntegrated.prototype.setOptions = function(options) {
    goog.asserts.assert(goog.isDef(options.threshold));
    goog.asserts.assert(goog.isDef(options.springCoefficient));
    goog.asserts.assert(goog.isDef(options.frictionForce));
    goog.asserts.assert(goog.isDef(options.maxTerrainDistortion));
    goog.asserts.assert(goog.isDef(options.dragDistanceBeforePan));
    goog.asserts.assert(goog.isDef(options.explicitFadeOutAnimationSpeed));
    goog.asserts.assert(goog.isDef(options.hybridTransitionDampingDuration) && options.hybridTransitionDampingDuration > 0.0);
    this.options = options;
};
goog.exportProperty(ol.interaction.DragShearIntegrated.prototype, 'setOptions', ol.interaction.DragShearIntegrated.prototype.setOptions);

/**
 * Set callback function for low fps alert
 * @param {function(boolean)} lowFpsAlert
 */
ol.interaction.DragShearIntegrated.prototype.setLowFpsAlert = function(lowFpsAlert) {
    this.lowFpsAlert = lowFpsAlert;
};
goog.exportProperty(ol.interaction.DragShearIntegrated.prototype, 'setLowFpsAlert', ol.interaction.DragShearIntegrated.prototype.setLowFpsAlert);


/**
 * Set callback function to fire on every drag
 * @param {function()} onMouseUpCallback
 */
ol.interaction.DragShearIntegrated.prototype.setOnMouseUpCallback = function(onMouseUpCallback) {
    this.onMouseUpCallback = onMouseUpCallback;
};
goog.exportProperty(ol.interaction.DragShearIntegrated.prototype, 'setOnMouseUpCallback', ol.interaction.DragShearIntegrated.prototype.setOnMouseUpCallback);


/**
 * Get average fps 
 * @return {number}
 */
ol.interaction.DragShearIntegrated.prototype.getFps = function() {
    return this.fpsMean / this.animationFrameCounter;
};
goog.exportProperty(ol.interaction.DragShearIntegrated.prototype, 'getFps', ol.interaction.DragShearIntegrated.prototype.getFps);


/**
 * Apply shearing to model and trigger rendering
 * @param {number} shearX
 * @param {number} shearY   
 * @this {ol.interaction.DragShearIntegrated}
 */
ol.interaction.DragShearIntegrated.prototype.shear = function(shearX, shearY) {
    this.demLayer.setTerrainShearing({
        x: shearX,
        y: shearY
    });
    this.demLayer.redraw();
};

/**
 * Animates shearing & panning according to currentDragPositionPx
 */
ol.interaction.DragShearIntegrated.prototype.animation = function() {

    var
    // mouse position [meters]
        currentDragPosition = this.map.getCoordinateFromPixel(this.currentDragPositionPx),
        // position of drag start [meters]
        startDragPosition = this.map.getCoordinateFromPixel(this.startDragPositionPx),
        // position of point that is animated [meters]. Compensate for shifted map center.
        animatingPositionX = startDragPosition[0] - (this.currentCenter[0] - this.startCenter[0]),
        animatingPositionY = startDragPosition[1] - (this.currentCenter[1] - this.startCenter[1]);

    // Distance between current mouse position and point being animated [meters].
    // This distance is also needed for fading out animation when the mouse is released during an explicit
    // shear. The animation wiggles the mountains back to the start drag position. There
    // are no drag events during this animation that would adjust currentDragPositionPx, so we
    // use the previous distanceX and distanceY during the animation.
    if (this.shearingStatus !== ol.interaction.State.ANIMATION_AFTER_EXPLICIT_SHEARING) {
        this.distanceX = currentDragPosition[0] - animatingPositionX;
        this.distanceY = currentDragPosition[1] - animatingPositionY;
    }


    // Fading the length of the spring during the transition from explicit to integrated shearing.
    // When the cursor leaves circle with radius dragDistanceBeforePan, the damping factor is 1. 
    // It fades to 0 within the time interval defined by hybridTransitionDuration.
    var currentTime = new Date(),
        timeSinceHybridTransitionStart = 0,
        hybridTransitionDamping = 1;

    if (this.shearingStatus === ol.interaction.State.INTEGRATED_SHEARING && this.integratedShearingStartTimeMS > -1) {
        timeSinceHybridTransitionStart = (currentTime.getTime() - this.integratedShearingStartTimeMS) / 1000;

        if (timeSinceHybridTransitionStart <= this.options['hybridTransitionDampingDuration']) {
            hybridTransitionDamping = 1 - timeSinceHybridTransitionStart / this.options['hybridTransitionDampingDuration'];
        } else {
            // the damping animation is over
            hybridTransitionDamping = 0;
            this.integratedShearingStartTimeMS = -1;
            this.springLength = 0;
        }
    }

    // increase mesh resolution when explicit shearing is active
    if (this.shearingStatus === ol.interaction.State.EXPLICIT_SHEARING || (timeSinceHybridTransitionStart <= this.options['hybridTransitionDampingDuration'] && timeSinceHybridTransitionStart > 0)) {
        // if automatic resolution active
        if (this.demLayer.getResolution() === 0) {
            this.demLayer.setAutoResolution({
                high: true
            });
        }
    } else {
        this.demLayer.setAutoResolution({
            high: false
        });
    }

    var distance = Math.sqrt(this.distanceX * this.distanceX + this.distanceY * this.distanceY),
        // spring lengths along the two axes [meters]
        springLengthX = distance > 0 ? this.distanceX / distance * this.springLength * hybridTransitionDamping : 0,
        springLengthY = distance > 0 ? this.distanceY / distance * this.springLength * hybridTransitionDamping : 0,

        // spring coefficient
        k = this.options['springCoefficient'],

        // friction for damping previous speed
        friction = 1 - this.options['frictionForce'],

        // stretch or compression of the spring
        springStretchX = this.distanceX - springLengthX,
        springStretchY = this.distanceY - springLengthY,

        // current velocity of animation [meters per second]
        vx_t0 = k * springStretchX + friction * this.vx_t_1,
        vy_t0 = k * springStretchY + friction * this.vy_t_1,

        // time since last frame was rendered [seconds]
        dTsec = this.lastRenderTime !== null ? (currentTime.getTime() - this.lastRenderTime.getTime()) / 1000 : 1 / 60,

        // displacement of clicked point due to spring [meters]
        dx = vx_t0 * dTsec,
        dy = vy_t0 * dTsec,

        // The stretch is the length by which the spring differs from its resting position.
        springStretch = Math.sqrt(springStretchX * springStretchX + springStretchY * springStretchY),

        // The acceleration is triggered by the spring, and is proportional to the stretch of the spring.
        a = k * springStretch / dTsec,
        // velocity
        v = Math.sqrt(vx_t0 * vx_t0 + vy_t0 * vy_t0),
        // minimum distance
        dTol = this.options['threshold'] * this.view.getResolution(),
        // minimum velocity
        vTol = dTol / dTsec,
        // minimum acceleration
        aTol = vTol / dTsec / 100, // 100 is an empirical factor

        // Test for end of animation: stop animation when speed and acceleration of the animation are close to zero.
        stopAnimation = this.shearingStatus !== ol.interaction.State.EXPLICIT_SHEARING && a < aTol && v < vTol,

        // test for other active interactions like zooming or rotation
        otherInteractionActive = this.view.getHints()[ol.ViewHint.INTERACTING];

    if (stopAnimation || otherInteractionActive) {

        // stop the animation
        this.stopAnimation();

    } else {

        if (this.shearingStatus === ol.interaction.State.ANIMATION_AFTER_EXPLICIT_SHEARING) {
            // map center is not moved during animation following static shearing
            dx *= this.options['explicitFadeOutAnimationSpeed'];
            dy *= this.options['explicitFadeOutAnimationSpeed'];
        } else {
            // shift map center
            this.currentCenter[0] -= dx;
            this.currentCenter[1] -= dy;
        }


        // Recompute distances after the new velocity is applied.
        this.distanceX -= dx;
        this.distanceY -= dy;

        // store values for next rendered frame
        this.vx_t_1 = vx_t0;
        this.vy_t_1 = vy_t0;


        var shearX = this.distanceX,
            shearY = this.distanceY;

        // limit shearing to maxTerrainDistortion.
        if (this.shearingStatus === ol.interaction.State.EXPLICIT_SHEARING) {
            var shearLength = Math.sqrt(this.distanceX * this.distanceX + this.distanceY * this.distanceY);
            if (shearLength > this.options['maxTerrainDistortion'] * this.view.getResolution()) {
                shearX = (this.distanceX / shearLength) * this.options['maxTerrainDistortion'] * this.view.getResolution();
                shearY = (this.distanceY / shearLength) * this.options['maxTerrainDistortion'] * this.view.getResolution();
            }
        }

        // normalized elevation between 0 and 1 for the visible minimum and maximum
        var normalizedDraggedElevation = Math.abs((this.startDragElevation - this.minElevation) / (this.maxElevation - this.minElevation)),

            // normalized elevation between 0 and 1 for the minimum and maximum in the local neighborhood
            normalizedDraggedElevationLocal = Math.abs((this.startDragElevation - this.minElevationLocal) / (this.maxElevationLocal - this.minElevationLocal)),

            // value to normalize shearing of high points
            // to give the impression of direct control over terrain shearing, the shearing factor has to be normalized with normalizedDraggedElevation
            // however, this leads to undesired "over-shearing" effects when shearing at a low relative high point
            // to avoid this, we use the normalizedDraggedElevationLocal for local high points that are low points globally
            shearingNormalization = (normalizedDraggedElevation > 0.6) ? normalizedDraggedElevation : normalizedDraggedElevationLocal;
            
        if (normalizedDraggedElevationLocal > 0.5) {
            // high elevations
            this.shear(shearX / shearingNormalization, shearY / shearingNormalization);
            this.view.setCenter(this.view.constrainCenter([this.currentCenter[0], this.currentCenter[1]]));
        } else {
            // low elevations: invert shearing direction and normalize panning
            this.shear(-shearX, -shearY);
            this.view.setCenter(this.view.constrainCenter([this.currentCenter[0] - this.distanceX, this.currentCenter[1] - this.distanceY]));
        }

        // update last rendering time
        this.lastRenderTime = currentTime;

        // log fps
        this.animationFrameCounter++;
        this.fpsMean = this.fpsMean + Math.round(1 / dTsec);

        // trigger the next frame rendering   
        this.animationDelay.start();
    }
};
