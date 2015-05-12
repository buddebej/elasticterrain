Elastic Terrain Map
=========

The Elastic Terrain Map is able to render digital elevation models using webgl and offers various methods to explore terrain.

Demo: [EU Mirror](http://eu.elasticterrain.xyz), [EU Mirror](http://us-west.elasticterrain.xyz)

The program works with a set of tiles that can be computed from all common digital elevation models using [dem2tiles](https://github.com/buddebej/dem2tiles).

This project is based on [ol3-dem](http://github.com/buddebej/ol3-dem/), which is a fork of [OpenLayers 3.1.1](https://github.com/openlayers/ol3). 
OpenLayers 3 is licensed under the [2-Clause BSD](https://tldrlegal.com/license/bsd-2-clause-license-(freebsd)).

Set up the development environment as for OpenLayers 3 ([How to Contribute to ol3](https://github.com/buddebej/elasticterrain/blob/master/ol3/CONTRIBUTING.md)).

Start local server to browse the examples:

```
./build.py serve
```

Access:

```
http://localhost:3000/examples/elasticterrain.html
```


