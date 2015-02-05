// thanks to http://www.browserleaks.com/webgl#howto-detect-webgl
function webgl_detect()
{
    if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
             names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
           context = false;
 
        for(var i=0;i<4;i++) {
            try {
                context = canvas.getContext(names[i]);
                if (context && typeof context.getParameter == "function") {
                    // WebGL is enabled
                    return true;
                }
            } catch(e) {}
        }
 
        // WebGL is supported, but disabled
        return false;
    }
 
    // WebGL not supported
    return false;
}