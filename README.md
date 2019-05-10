## Elastic Terrain Map

Elastic Terrain Map implements a new method for terrain visualization that uses animation.
The application renders digital elevation models with WebGL and offers many configurable parameters.

### Demo

Check out the [live demo](http://elasticterrain.xyz) at [elasticterrain.xyz](http://elasticterrain.xyz). 

Watch [demo movie](https://vimeo.com/140730282).

The live demo performs best with an up-to-date version of Google Chrome.

### Getting Started

Clone the repository and browse to the `ol3` folder. Run:

```
make install
```

```
make serve
```

Browse to example (sample data with global coverage up to zoomlevel 4): 

```
http://localhost:3000/build/examples/elasticterrain.html
```

A solution for potential node errors of the watch process can be found [here](http://stackoverflow.com/questions/16748737/grunt-watch-error-waiting-fatal-error-watch-enospc).

### Data

The application uses precomputed tiles with encoded terrain data that can be produced from publicly available digital elevation models. For this purpose, we used [a collection of python scripts](https://github.com/buddebej/dem2tiles).

### License & Credits

This project is based on a fork of [OpenLayers 3.1.1](https://github.com/openlayers/ol3). 
OpenLayers 3 is licensed under the [2-Clause BSD](https://tldrlegal.com/license/bsd-2-clause-license-(freebsd)).
For comments or contribution please contact [Cartography and Geovisualization Group, Oregon State University](http://cartography.oregonstate.edu/).

![Screenshots](https://raw.github.com/buddebej/elasticterrain/master/elastic_terrain_screenshot_01.jpg) 

![Screenshots](https://raw.github.com/buddebej/elasticterrain/master/elastic_terrain_screenshot_02.jpg) 
