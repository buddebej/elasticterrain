$(document).ready(function() {
    'use strict';
    if (webgl_detect()) {

        var viewer, controlBar, configManager, config, layers;      

        config = new Config();
        layers = new Layers(); 
        viewer = new Viewer(config, layers);
        controlBar = new ControlBar(viewer);
        configManager = new ConfigManager(controlBar, viewer);

    } else {
        $('body').append('<div class="webglMissing"><p><span class="title">WebGL Not Supported!</span><br> WebGL is required for this application, and your Web browser does not support WebGL. Google Chrome or Firefox are recommended browsers with WebGL support. Click <a href="http://www.browserleaks.com/webgl" target="_blank">here</a> to check the WebGL specifications of your browser.</p></div>');
    }
});
