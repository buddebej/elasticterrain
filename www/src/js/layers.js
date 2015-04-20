var Layers = function() {
    'use strict';

    this.layers_enabled = [];

    this.dem = {
        title: 'Hypsometric Colors',
        pos: 1,
        base: true,
        enabled: true,
        data: new ol.layer.TileDem({
            source: new ol.source.XYZ({
                // url: 'http://192.168.0.127/demo/data/pdx/{z}/{x}/{y}.png',                
                url: 'http://192.168.0.127/demo/data/kr/{z}/{x}/{y}.png',                
                // url: 'http://elasticreliefmap.s3-website-us-east-1.amazonaws.com/data/tiles/{z}/{x}/{y}.png',
                // url: 'http://elasticterrain.xyz/data/tiles/{z}/{x}/{y}.png',
                // url: '../demo/data/eudem/{z}/{x}/{y}.png',
                // url: 'data/tiles/{z}/{x}/{y}.png',                
                dem: true
            })
        })
    };

    this.layers_available = [{
        title: 'Mapbox Streets',
        pos: 2,
        enabled: false,
        data: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            }),
        })
    }, {
        title: 'Mapbox Satellite',
        pos: 3,
        enabled: false,
        data: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://api.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            }),
        })
    }, {
        title: 'Mapbox Outdoors',
        pos: 4,
        enabled: false,
        data: new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://api.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            }),
        })
    }, {
        title: 'Open Street Map',
        pos: 5,
        enabled: true,
        data: new ol.layer.Tile({
            source: new ol.source.OSM(),
        })
    }, {
        title: 'Stamen Watercolor',
        pos: 6,
        enabled: true,
        data: new ol.layer.Tile({
            source: new ol.source.Stamen({
                layer: 'watercolor'
            })
        }),
    }, {
        title: 'Bing Aerial',
        pos: 7,
        enabled: true,
        data: new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
                imagerySet: 'Aerial'
            })
        }),
    }, this.dem];

    this.getAll = function() {
        return this.layers_enabled;
    };

    this.getDem = function() {
        return this.dem;
    };

    this.getData = function() {
        var array = [];
        $.each(this.layers_enabled, function(key, layer) {
            array.push(layer.data);
        });
        return array;
    };

    this.enable = function() {
        $.each(this.layers_available, function(key, layer) {
            if (layer.enabled) {
                this.layers_enabled.push(layer);
            }
        }.bind(this));
    };

    this.enable();
};
