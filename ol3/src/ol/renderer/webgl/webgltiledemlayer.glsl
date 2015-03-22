//! NAMESPACE=ol.renderer.webgl.tiledemlayer.shader
//! CLASS=ol.renderer.webgl.tiledemlayer.shader.

//! COMMON

// texture with encoded elevation values
uniform sampler2D u_texture;

// length of one tile in meter at equator
uniform float u_tileSizeM;

// min Elevation in current Extent
uniform float u_minElevation; 

// max Elevation in current Extent
uniform float u_maxElevation;

// temporary variable for coord transfer to fragment shader
varying vec2 v_texCoord;

// decodes input data elevation value and apply exaggeration
float decodeElevation(in vec4 colorChannels) {
    float elevationM = (colorChannels.r*255.0 + (colorChannels.g*255.0)*256.0)-11000.0;
    return elevationM;
}

//! VERTEX

// vertex coordinates for tile mesh
attribute vec2 a_position;

// tile offset in current framebuffer view
uniform vec4 u_tileOffset;

// current shearing factor
uniform vec2 u_scaleFactor;

// current depth depends on zoomlevel
uniform float u_z;

void main(void) { 

    // Orientation of coordinate system in vertex shader:
    // y
    // ^ 
    // |
    // |
    // ------>  x

    // pass current vertex coordinates to fragment shader
    v_texCoord = a_position;
    
    // compute y-flipped texture coordinates for further processing in fragment-shader
    v_texCoord.y = 1.0 - v_texCoord.y;

    // read and decode elevation for current vertex
    float absElevation = decodeElevation(texture2D(u_texture, v_texCoord.xy));
    
    // shift vertex positions by given shearing factors
    // z value has to be inverted to get a left handed coordinate system and to make the depth test work
    if(absElevation<11000.0){
        // normalize elevation for current minimum and maximum
        float nElevation = u_maxElevation*(absElevation-u_minElevation)/(u_maxElevation-u_minElevation);

        gl_Position = vec4((a_position+(nElevation * u_scaleFactor.xy) / u_tileSizeM) * u_tileOffset.xy + u_tileOffset.zw, 
                            (u_z-abs(absElevation/u_tileSizeM)), 
                            1.0);
    }
}

//! FRAGMENT

// color ramp texture to look up hypsometric tints
uniform sampler2D u_colorRamp;

// texture with overlay map
uniform sampler2D u_overlayTexture;

// flag for coloring inland waterbodies
uniform bool u_waterBodies; 

// flag for hillShading
uniform bool u_hillShading; 

// flag for active overlay texture
uniform bool u_overlayActive;

// flag for testing mode
uniform bool u_testing;    

// scale threshold values to adapt color ramp 
// u_colorScale.x is lower threshold, u_colorScale.y is upper threshold
uniform vec2 u_colorScale;

// direction of light source
uniform vec3 u_light; 

// hillShading Opacity for Blending
uniform float u_hillShadingOpacity; 

// hillShading Exaggeration
uniform float u_hsExaggeration; 

// intensity of ambient light
uniform float u_ambient_light;    

// critical elevation threshold
uniform float u_critElThreshold;  

// cellsize for tile resolution of 256x256 pixel = 1.0/256.0
const highp float CELLSIZE = 0.00390625; 

void main(void) {
        vec2 m_texCoord = v_texCoord;

        // prevent artifacts at tile borders, shift texture coordinates
        if(m_texCoord.x >= 1.0-CELLSIZE){ // eastern border of tile                
            m_texCoord.x = m_texCoord.x - CELLSIZE;
        }

        if(m_texCoord.x < CELLSIZE){ // western border of tile                
            m_texCoord.x = m_texCoord.x + CELLSIZE;
        }

        if(m_texCoord.y >= 1.0-CELLSIZE){ // northern border of tile                
            m_texCoord.y = m_texCoord.y - CELLSIZE;
        }

        if(m_texCoord.y < CELLSIZE){ // southern border of tile                
            m_texCoord.y = m_texCoord.y + CELLSIZE;
        }

        // read and decode elevation values from tile texture
        float absElevation = decodeElevation(texture2D(u_texture, m_texCoord.xy));

        // read neighboring values
        float neighborRight = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x+CELLSIZE, m_texCoord.y)));
        float neighborLeft = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x-CELLSIZE, m_texCoord.y)));
        float neighborAbove = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x, m_texCoord.y+CELLSIZE)));
        float neighborBelow = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x, m_texCoord.y-CELLSIZE)));          
          
    // texture
        vec4 fragColor;

        if(u_overlayActive){
             // use overlay texture color
             fragColor = texture2D(u_overlayTexture, m_texCoord);
        } else {
            // lookup a hypsometric color        
                // scaling of color ramp
                float elevationRange = u_maxElevation-u_minElevation;
                float colorMin = u_colorScale.x/elevationRange;
                float colorMax = u_colorScale.y/elevationRange;             
                float relativeElevation = ((absElevation/elevationRange) - colorMin) / (colorMax - colorMin);
                
                // read corresponding value from color ramp texture
                fragColor = abs(texture2D(u_colorRamp,vec2(0.5,relativeElevation)));

                // color for water surfaces in flat terrain
                if(u_waterBodies) {
                    vec4 waterBlue = vec4(0.4058823529,0.6725490196,0.8970588235,1.0);

                    // compute other neighbors for water surface test
                    float n01 = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x+CELLSIZE, m_texCoord.y+CELLSIZE)));
                    float n02 = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x-CELLSIZE, m_texCoord.y+CELLSIZE)));
                    float n03 = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x+CELLSIZE, m_texCoord.y-CELLSIZE)));
                    float n04 = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x-CELLSIZE, m_texCoord.y+CELLSIZE)));         

                    if(n01 == absElevation && 
                       n02 == absElevation && 
                       n03 == absElevation && 
                       n04 == absElevation && 
                       neighborRight == absElevation && 
                       neighborLeft == absElevation && 
                       neighborAbove == absElevation && 
                       neighborBelow == absElevation) 
                    {
                        fragColor = waterBlue; 
                    }
                } 
        }

    // computation of hillshading
        if(u_hillShading){

            // apply exaggeration
            float exaggerationFactor = max(u_hsExaggeration*10.0,1.0);

            // compute normal with values from four neighbors
            vec3 normal = vec3(  neighborLeft - neighborRight,
                                 neighborAbove - neighborBelow,
                                 CELLSIZE * u_tileSizeM / exaggerationFactor);
           
            // compute the dot product of the normal and the light vector. This
            // gives a value between -1 (surface faces directly away from
            // light) and 1 (surface faces directly toward light)
            float hillShade = dot(normal,normalize(u_light)) / length(normal);

            // apply ambient light and adjust value to be between 0.0 and 1.0
            hillShade = clamp(u_ambient_light * 1.0 + (hillShade + 1.0) * 0.5, 0.0, 1.0);

            // remap image tonality
            hillShade = pow(hillShade, 1.0 / (1.0 + u_hillShadingOpacity * 2.0));

            // avoid black shadows
            hillShade = max(hillShade, 0.25);

            // mix with hypsometric color
            gl_FragColor = vec4(hillShade,hillShade,hillShade,1.0)*fragColor;
        } else {
            // apply hypsometric color without hillshading
            gl_FragColor = fragColor;
        }

    // testing mode
        if(u_testing){
            // highlight maxima and minima 
            float criticalEl = u_minElevation + (u_maxElevation - u_minElevation) * u_critElThreshold;
            if(absElevation > criticalEl){
                gl_FragColor = gl_FragColor+vec4(1.0,0.0,0.0,1.0);
            }
            if(absElevation < criticalEl){
                gl_FragColor = gl_FragColor+vec4(0.0,0.5,0.5,1.0);
            }
            // mark tile borders and draw a grid
            float lineWidth = 2.0 * CELLSIZE;
            if(m_texCoord.x >= 1.0-lineWidth){
                gl_FragColor = vec4(0.0,0.0,1.0,1.0);
            }
            if(m_texCoord.x <= lineWidth){
                gl_FragColor = vec4(1.0,0.0,0.0,1.0);
            }
            if(m_texCoord.y <= lineWidth){
                gl_FragColor = vec4(0.0,1.0,0.0,1.0);
            }
            if(m_texCoord.y >= 1.0-lineWidth){
                gl_FragColor = vec4(0.0,0.5,0.5,1.0);
            } 
            if(mod(m_texCoord.x,65.0*CELLSIZE) < CELLSIZE){
               gl_FragColor = vec4(0.9,0.9,0.9,0.1);
            }
            if(mod(m_texCoord.y,65.0*CELLSIZE) < CELLSIZE){
               gl_FragColor = vec4(0.9,0.9,0.9,0.1);
            }
          
        }
}
