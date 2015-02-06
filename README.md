Open Terrain Explorer
=========

This project is the further development of [ol3-dem](http://github.com/buddebej/ol3-dem/).
It is based on a fork of [OpenLayers 3.1.1](https://github.com/openlayers/ol3). 

The Open Terrain Explorer is able to render digital elevation models using webgl and offers various methods to explore terrain.

Set up the development environment as for OpenLayers 3 ([How to Contribute to ol3](https://github.com/buddebej/ote/blob/master/ol3/CONTRIBUTING.md)).

The program works with a set of tiles that can be computed from all common digital elevation models using [dem2tiles](https://github.com/buddebej/dem2tiles).

Run the example:

```
./build.py serve
```

Run:

```
http://localhost:3000/examples/openterrainexplorer.html
```
