##Elastic Terrain Map

Elastic Terrain Map implements a new method for terrain visualization that uses animation.
The application renders digital elevation models with WebGL and offers many configurable parameters.

### Demo

Check out the [live demo](http://elasticterrain.xyz). 
The performance is best with an up-to-date version of Google Chrome or Chromium.

Watch [demo movie](https://vimeo.com/140798332).

### Getting Started

Clone the repository and browse to the ol3 folder. Run:

```
make install
```

```
make serve
```

Browse: http://localhost:3000/build/examples/elasticterrain.html

### Data

The client uses precomputed tiles with encoded terrain data that can be produced from publicly available digital elevation models. For this purpose, we used [a collection of python scripts](https://github.com/buddebej/dem2tiles).

### License & Credits

This project is based on a fork of [OpenLayers 3.1.1](https://github.com/openlayers/ol3). 
OpenLayers 3 is licensed under the [2-Clause BSD](https://tldrlegal.com/license/bsd-2-clause-license-(freebsd)).

For comments or contribution please contact [Cartography and Geovisualization Group, Oregon State University](http://cartography.oregonstate.edu/).

![Screenshots](https://raw.github.com/buddebej/elasticterrain/master/elastic_terrain_screenshot_01.jpg) 
