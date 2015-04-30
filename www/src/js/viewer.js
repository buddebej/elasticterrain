var Viewer = function(config, layers, container) {
    'use strict';

    this.config = config;
    this.configStore = [];
    this.layers = layers.getAll();

    // get handle for base layer with elevation data
    this.dem = layers.getDem().data;

    // init ol map object
    this.map = new ol.Map({
        controls: ol.control.defaults({
            attribution: false
        }).extend([new ol.control.ScaleLine(), new ol.control.MousePositionDem(this.dem)]),
        view: new ol.View({
            maxZoom: this.config.get('viewZoomConstraint')[1],
            minZoom: this.config.get('viewZoomConstraint')[0]
        }),
        target: container,
        renderer: 'webgl',
        layers: layers.getData()
    });

    this.view = this.map.getView();

    this.view.setHighlevelAreas(layers.getDem().highLevelAreas);

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

    // hide all over-layers except the given id
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

    // apply preload level (zoomlevel 1 to maxZoom) for enabled layers
    this.setLayerPreload = function(maxZoom) {
        $.each(this.layers, function(val, obj) {
            obj.data.setPreload(maxZoom);
        });
    };

    // wrapper for config.set    
    this.set = function(attr, val) {
        config.set(attr, val);
        this.update();
    };

    // wrapper for config.get
    this.get = function(attr) {
        return config.get(attr);
    };

    // wrapper for config.swap
    this.swapConfig = function(newStore) {
        config.swap(newStore);
        this.update();
    };

    // setter for configStore
    this.setConfigStore = function(newStore) {
        this.configStore = newStore;
    };

    // getter for configStore
    this.getConfigStore = function() {
        return this.configStore;
    };

    // apply current config to renderer and map view
    this.update = function() {
        this.view.setCenterConstraint(this.config.get('viewCenterConstraint'));        
        this.view.setCenter(ol.proj.transform(this.config.get('viewCenter'), 'EPSG:4326', 'EPSG:3857'));
        this.view.setRotation(this.toRadians(this.config.get('viewRotation')));
        this.view.setRotationEnabled(this.config.get('viewRotationEnabled')); 
        this.view.setZoomConstraint(this.config.get('viewZoomConstraint'));                       
        this.view.setZoom(this.config.get('viewZoom'));
        this.dem.setAmbientLight(this.config.get('ambientLight'));
        this.dem.setColorScale(this.config.get('colorScale'));
        this.dem.setColorRamp(this.config.get('colorRamp'));
        this.dem.setStackedCardboard(this.config.get('stackedCardboard'));
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
        this.dem.setOverlayTiles((this.config.get('texture') !== 'hypso') ? this.layers[this.config.get('texture')].data : null);
        this.shearingInteraction.setOptions(this.getShearingInteractionOptions());
        this.shearingInteraction.setActive(this.config.get('terrainInteraction'));
        this.render();
    };

    // return shearingInteractionOptions from config
    this.getShearingInteractionOptions = function() {
        return {
            threshold: this.config.get('iShearingThreshold'),
            springCoefficient: this.config.get('iSpringCoefficient'),
            frictionForce: this.config.get('iFrictionForce'),
            maxInnerShearingPx: this.config.get('iMaxInnerShearingPx'),
            maxOuterShearingPx: this.config.get('iMaxOuterShearingPx'),
            staticShearFadeOutAnimationSpeed: this.config.get('iStaticShearFadeOutAnimationSpeed'),
            minMaxNeighborhoodSize: this.config.get('iminMaxNeighborhoodSize')
        };
    }.bind(this);

    // init elastic terrain interactions
    this.shearingInteraction = new ol.interaction.DragShearIntegrated(this.getShearingInteractionOptions(), this.map, ol.events.condition.noModifierKeys);
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
    this.setLayerPreload(3);
    this.hideLayersExcept(null);
    // apply initial config
    this.update();
};
