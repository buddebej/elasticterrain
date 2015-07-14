var Viewer = function(config, layers, container) {
    'use strict';

    this.config = config;
    this.configStore = [];
    this.layers = layers.getAll();
    this.controlBar = undefined;
    this.showCase = undefined;

    this.setControlBar = function(controlbar) {
        this.controlBar = controlbar;
    };

    this.setShowCase = function(showCase) {
        this.showCase = showCase;
    };

    // get handle for base layer with elevation data
    this.dem = layers.getDem().data;
    this.elevationIndicator = new ol.control.MousePositionDem(this.dem);
    this.attribution = new ol.control.Attribution({
        collapsible: true,
        collapseLabel: '«'
    });

    this.mapControls = [new ol.control.Zoom(), new ol.control.Rotate(), new ol.control.ScaleLine(), this.elevationIndicator, this.attribution];
    // this.mapControls = [this.attribution, new ol.control.Zoom(), new ol.control.Rotate(), new ol.control.ScaleLine(), this.elevationIndicator];

    // init ol map object
    this.map = new ol.Map({
        controls: this.mapControls,
        view: new ol.View({
            maxZoom: this.config.get('viewZoomConstraint')[1],
            minZoom: this.config.get('viewZoomConstraint')[0]
        }),
        target: container.attr('id'),
        renderer: 'webgl',
        layers: layers.getData()
    });

    this.view = this.map.getView();

    this.view.setHighlevelAreas(layers.getDem().highLevelAreas);

    this.disableControls = function() {
        $.each(this.mapControls, function(i, v) {
            this.map.removeControl(v);
        }.bind(this));
    }.bind(this);

    this.enableControls = function() {
        $.each(this.mapControls, function(i, v) {
            this.map.addControl(v);
        }.bind(this));
    }.bind(this);

    // render map with current config
    this.render = function() {
        this.dem.redraw();
    }.bind(this);

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
        Object.keys(this.layers).forEach(function(key) {
            var layer = this.layers[key];
            if (!layer.base) { // don't hide dem base layer
                if (layer.id === id) {
                    layer.data.setVisible(true);
                } else {
                    layer.data.setVisible(false);
                }
            }
        }.bind(this));
    };

    // apply preload level (zoomlevel 1 to maxZoom) for enabled layers
    this.setLayerPreload = function(maxZoom) {
        Object.keys(this.layers).forEach(function(key) {
            this.layers[key].data.setPreload(maxZoom);
        }.bind(this));
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
        // use a copy of config for read only access during runtime 
        var configCopy = $.extend(true, {}, newStore);
        this.shearingInteraction.stopAnimation();
        config.swap(configCopy);
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
        this.view.setRotationConstraint(this.config.get('viewRotationEnabled'));
        this.view.setZoomConstraint(this.config.get('viewZoomConstraint'));
        this.view.setZoom(this.config.get('viewZoom'));
        this.dem.setAmbientLight(this.config.get('ambientLight'));
        this.dem.setColorScale(this.config.get('colorScale'));
        this.dem.setDynamicColors(this.config.get('dynamicColors'));
        this.dem.setColorRamp(this.config.get('colorRamp'));
        this.dem.setStackedCardboard(this.config.get('stackedCardboard'));
        this.dem.setShading(this.config.get('shading'));
        this.dem.setShadingOpacity(this.config.get('shadingDarkness'));
        this.dem.setShadingExaggeration(this.config.get('shadingExaggeration'));
        this.dem.setLightAzimuth(this.config.get('lightAzimuth'));
        this.dem.setLightZenith(this.config.get('lightZenith'));
        this.dem.setResolution(this.config.get('resolution'));
        this.dem.setTesting(this.config.get('debug'));
        this.dem.setWireframe(this.config.get('wireframe'));
        this.dem.setObliqueInclination(this.config.get('obliqueInclination'));
        this.dem.setWaterBodies(this.config.get('waterBodies'));
        this.dem.setTerrainInteraction(this.config.get('terrainInteraction'));
        this.dem.setOverlayTiles((this.config.get('texture') !== 'hypso') ? this.layers[this.config.get('texture')] : null);
        // hide all overlayers             
        this.hideLayersExcept((this.config.get('texture') !== 'hypso') ? this.config.get('texture') : null);
        this.shearingInteraction.setOptions(this.getShearingInteractionOptions());
        this.shearingInteraction.setActive(this.config.get('terrainInteraction'));
        this.render();
    };

    // return shearingInteractionOptions from config
    this.getShearingInteractionOptions = function() {
        return {
            threshold: this.config.get('shearingThreshold'),
            springCoefficient: this.config.get('springCoefficient'),
            frictionForce: this.config.get('frictionForce'),
            maxInnerShearingPx: this.config.get('maxInnerShearingPx'),
            maxOuterShearingPx: this.config.get('maxOuterShearingPx'),
            staticShearFadeOutAnimationSpeed: this.config.get('staticShearFadeOutAnimationSpeed'),
            minMaxNeighborhoodSize: this.config.get('minMaxNeighborhoodSize'),
            hybridDampingDuration: this.config.get('hybridDampingDuration')
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
    this.setLayerPreload(3);
    // apply initial config
    this.update();
};
