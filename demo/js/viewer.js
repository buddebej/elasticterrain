var Viewer = function(config, layers) {
    'use strict';

    this.config = config;

    this.layers = layers.getAll();

    // get handle for base layer with elevation data
    this.dem = layers.getDem().data;

    // init ol map object
    this.map = new ol.Map({
        controls: ol.control.defaults({
            attribution: false
        }).extend([new ol.control.ScaleLine(), new ol.control.MousePositionDem(this.dem)]),
        view: new ol.View({
            maxZoom: 13,
            minZoom: 1
        }),
        target: 'map',
        renderer: 'webgl',
        layers: layers.getData()
    });

    this.view = this.map.getView();

    // render map with current config
    this.render = function() {
        this.dem.redraw();
    };

    // round given number to closest step
    this.DEGREE_STEP = 1.0;
    this.toStep = function(n) {
        var rest = n % this.DEGREE_STEP;
        if (rest <= (this.DEGREE_STEP / 2)) {
            return n - rest;
        } else {
            return n + this.DEGREE_STEP - rest;
        }
    };
    this.toRadians = function(a) {
        return a * Math.PI / 180.0;
    };
    this.toDegrees = function(a) {
        return Math.abs(a) * 180 / Math.PI;
    };
    this.hideLayersExcept = function(id) {
        $.each(this.layers, function(val, obj) {
            if (!obj.base) { // don't hide dem base layer
                if (obj === this.layers[id]) {
                    obj.data.setVisible(true);
                } else {
                    obj.data.setVisible(false);
                }
            }
        }.bind(this));
    };
    this.setLayerPreload = function(l) {
        $.each(this.layers, function(val, obj) {
            obj.data.setPreload(l);
        });
    };
    // wrapper for config.set    
    this.set = function(attr, val) {
        config.set(attr, val);
        this.update();
    };
    // wrapper for config.get
    this.get = function(attr, val) {
        return config.get(attr);
    };

    // apply current config values to map
    this.update = function() {
        this.view.setCenter(ol.proj.transform(this.config.get('viewCenter'), 'EPSG:4326', 'EPSG:3857'));
        this.view.setRotation(this.toRadians(this.config.get('viewRotation')));
        this.view.setZoom(this.config.get('viewZoom'));
        this.dem.setAmbientLight(this.config.get('ambientLight'));
        this.dem.setColorScale(this.config.get('colorScale'));
        this.dem.setColorRamp(this.config.get('colorRamp'));
        this.dem.setShading(this.config.get('shading'));
        this.dem.setShadingOpacity(this.config.get('shadingDarkness'));
        this.dem.setShadingExaggeration(this.config.get('shadingExaggeration'));
        this.dem.setLightAzimuth(this.config.get('lightAzimuth'));
        this.dem.setLightZenith(this.config.get('lightZenith'));
        this.dem.setResolution(this.config.get('resolution'));
        this.dem.setTesting(this.config.get('debug'));
        this.dem.setObliqueInclination(this.config.get('obliqueInclination'));
        this.dem.setWaterBodies(this.config.get('waterBodies'));
        this.dem.setTerrainInteraction(this.config.get('terrainInteraction'));
        this.dem.setCriticalElevationThreshold(this.config.get('iCriticalElevationThreshold'));
        this.dem.setOverlayTiles((this.config.get('texture') !== -1) ? this.layers[this.config.get('texture')].data : null);
        this.render();
    };

    // init elastic terrain interactions
    this.shearingConfig = {
        threshold: this.config.get('iShearingThreshold'),
        springCoefficient: this.config.get('iSpringCoefficient'),
        frictionForce: this.config.get('iFrictionForce'),
        maxInnerShearingPx: this.config.get('iMaxInnerShearingPx'),
        maxOuterShearingPx: this.config.get('iMaxOuterShearingPx'),
        staticShearFadeOutAnimationSpeed: this.config.get('iStaticShearFadeOutAnimationSpeed'),
        criticalElevationThreshold: this.config.get('iCriticalElevationThreshold')
    };
    this.shearingInteraction = new ol.interaction.DragShearIntegrated(this.shearingConfig, this.map, ol.events.condition.noModifierKeys);
    this.map.addInteraction(this.shearingInteraction);

    // update config file when zooming
    this.view.on('change:resolution', function() {
        this.config.set('viewZoom', this.view.getZoom());
    }.bind(this));

    // update config file when panning
    this.view.on('change:center', function() {
        this.config.set('viewCenter', (ol.proj.transform(this.view.getCenter(), 'EPSG:3857', 'EPSG:4326')));
    }.bind(this));

    // update config file when rotating
    this.view.on('change:rotation', function() {
        this.config.set('viewRotation', this.toDegrees(this.view.getRotation()));
    }.bind(this));

    // INIT
    // hide all overlay maps (disables preloading and caching)
    this.hideLayersExcept(null);
    this.setLayerPreload(5);
    // apply initial config
    this.update();
};
