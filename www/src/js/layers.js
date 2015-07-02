var Layers = function() {
    'use strict';

    this.layers_enabled = [];

    this.dem = {
        title: 'Hypsometric Colors',
        id: 'hypso',
        pos: 3,
        base: true,
        enabled: true,
        data: new ol.layer.TileDem({
            source: new ol.source.XYZ({
                // url: '../www/src/data/tiles/{z}/{x}/{y}.png',                                
                url: 'http://eu.elasticterrain.xyz/data/tiles/{z}/{x}/{y}.png',
                // url: 'data/tiles/{z}/{x}/{y}.png',                
                dem: true
            })
        }),
        highLevelAreas: [
            ['Vienna', 19, [1790460.950551968, 6124746.202434603, 1868732.4675159885, 6203017.719398623]],
            ['Berlin', 19, [1428455.184593372, 6848757.734351791, 1584998.218521413, 7005300.768279833]]
        ]
    };

    this.layers_available = [{
            title: 'Bing Aerial',
            id: 'bingaerial',
            pos: 1,
            enabled: true,
            data: new ol.layer.Tile({
                source: new ol.source.BingMaps({
                    key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
                    imagerySet: 'Aerial'
                })
            }),
        }, {
            title: 'Hypsometric Aerial Hybrid',
            id: 'bingaerial-hybrid',
            pos: 1,
            enabled: true,
            hybrid: [1, 0],
            data: new ol.layer.Tile({
                source: new ol.source.BingMaps({
                    key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
                    imagerySet: 'Aerial'
                })
            }),
        }, {
            title: 'Open Street Map Humanitarian',
            id: 'osm-humanitarian',
            pos: 1,
            enabled: false,
            data: new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'http://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
                })
            })
        }, {
            title: 'Map Quest',
            id: 'mapquest',
            pos: 2,
            enabled: true,
            data: new ol.layer.Tile({
                style: 'Road',
                source: new ol.source.MapQuest({
                    layer: 'osm'
                })
            }),
        }, {
            title: 'Open Street Map',
            id: 'osm',
            pos: 3,
            enabled: true,
            data: new ol.layer.Tile({
                source: new ol.source.OSM(),
            })
        }, {
            title: 'Open Street Map Hybrid',
            id: 'osm-hybrid',
            pos: 4,
            enabled: true,
            hybrid: [1, 1],
            data: new ol.layer.Tile({
                source: new ol.source.OSM(),
            })
        }, {
            title: 'Stamen Watercolor',
            id: 'stamen-watercolor',
            pos: 8,
            enabled: true,
            data: new ol.layer.Tile({
                source: new ol.source.Stamen({
                    layer: 'watercolor'
                })
            }),
        }, {
            title: 'Stamen Watercolor Hybrid',
            id: 'stamen-watercolor-hybrid',
            pos: 6,
            hybrid: [0, 1],
            enabled: true,
            data: new ol.layer.Tile({
                source: new ol.source.Stamen({
                    layer: 'watercolor'
                })
            }),
        }, {
            title: 'Stamen Toner Hybrid',
            id: 'stamen-toner-hybrid',
            pos: 7,
            enabled: true,
            hybrid: [0, 0],
            data: new ol.layer.Tile({
                source: new ol.source.Stamen({
                    layer: 'toner'
                })
            })
        },
        /*{
            //     title: 'Mapbox Streets',
            //     id: 'mbstreet',
            //     pos: 2,
            //     enabled: false,
            //     data: new ol.layer.Tile({
            //         source: new ol.source.XYZ({
            //             url: 'http://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            //         })
            //     })
            // }, {
            //     title: 'Mapbox Satellite',
            //     id: 'mbsat',
            //     pos: 3,
            //     enabled: false,
            //     data: new ol.layer.Tile({
            //         source: new ol.source.XYZ({
            //             url: 'http://api.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            //         })
            //     })
            // }, {
            //     title: 'Mapbox Outdoors',
            //     id: 'mbout',
            //     pos: 4,
            //     enabled: false,
            //     data: new ol.layer.Tile({
            //         source: new ol.source.XYZ({
            //             url: 'http://api.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnVkZGViZWoiLCJhIjoiQmc4LXVWUSJ9.ucOAXWQKD_a9eDibv7yuyQ'
            //         })
            //     })
            // },*/
        this.dem
    ];

    this.getAll = function() {
        return this.layers_enabled;
    };

    this.getDem = function() {
        return this.dem;
    };

    this.getData = function() {
        var array = [];
        Object.keys(this.layers_enabled).forEach(function(key) {
            array.push(this.layers_enabled[key].data);
        }.bind(this));
        return array;
    };

    this.enable = function() {
        $.each(this.layers_available, function(key, layer) {
            if (layer.enabled) {
                this.layers_enabled[layer.id] = layer;
            }
        }.bind(this));
    };

    this.enable();
};
