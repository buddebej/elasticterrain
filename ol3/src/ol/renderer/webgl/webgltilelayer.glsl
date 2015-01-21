//! NAMESPACE=ol.renderer.webgl.tilelayer.shader
//! CLASS=ol.renderer.webgl.tilelayer.shader.

//! COMMON

// texture with encoded elevation values
uniform sampler2D u_texture;

// length of one tile in meter at equator
uniform float u_tileSizeM;

// temporary values for transfer to fragment shader
varying vec2 v_texCoord;

float decodeElevation(in vec4 colorChannels) {
	// decode input data elevation value
 	float elevationM = ((colorChannels.r*255.0 + (colorChannels.g*255.0)*256.0)-11000.0)/10.0;
    return elevationM;
}

vec4 decodeTextureColor(in vec4 colorChannels) {
		// decode input data color value
		int i1 = int(colorChannels.b*255.0);
		int i2 = int(colorChannels.a*255.0);

        int r = 0;
        int g = 0;
        int b = 0;
        
        if (i1 >= 128) {
            i1 -= 128;
            r += 16;
        }
        if (i1 >= 64) {
            i1 -= 64;
            r += 8;
        }
        if (i1 >= 32) {
            i1 -= 32;
            r += 4;
        }
        if (i1 >= 16) {
            i1 -= 16;
            r += 2;
        }
        if (i1 >= 8) {
            i1 -= 8;
            r += 1;
        }      
        // read bits 3 to 1
        if (i1 >= 4) {
            i1 -= 4;
            g += 32;
        }
        if (i1 >= 2) {
            i1 -= 2;
            g += 16;
        }
        if (i1 >= 1) {
            g += 8;
        }  
        if (i2 >= 128) {
            i2 -= 128;
            g += 4;
        }
        if (i2 >= 64) {
            i2 -= 64;
            g += 2;
        }
        if (i2 >= 32) {
            i2 -= 32;
            g += 1;
        }
        b = i2;
        return vec4(float(r*8)/255.0,float(g*4)/255.0,float(b*8)/255.0,1.0);
}


//! VERTEX

// vertex coordinates for computed mesh
attribute vec2 a_position;

// open layers tile structure
uniform vec4 u_tileOffset;

// current scale factor for plan oblique rendering
uniform vec2 u_scaleFactor;

void main(void) { 

	// Orientation of coordinate system in vertex shader:
	// y
	// ^ 
	// |
	// |
	// ------>	x

    // pass current vertex coordinates to fragment shader
    v_texCoord = a_position;
    
    // compute y-flipped texture coordinates for further processing in fragment-shader
    v_texCoord.y = 1.0 - v_texCoord.y;

    // read and decode elevation for current vertex
    float absElevation = decodeElevation(texture2D(u_texture, v_texCoord.xy));
    
    // shift vertex positions by given scale factor (dependend of the plan oblique inclination)
    // direction of shift is always the top of the screen so it has to be adapted when the map view is rotated
    // z value has to be inverted to get a left handed coordinate system and to make the depth test work
    vec4 vertexPosition = vec4((a_position+(absElevation * u_scaleFactor.xy) / u_tileSizeM) * u_tileOffset.xy + u_tileOffset.zw, 1.0-abs(absElevation/u_tileSizeM), 1.0);

	gl_Position = vertexPosition;
}

//! FRAGMENT

// color ramp texture to look up hypsometric tints
uniform sampler2D u_colorRamp;

// scale threshold values to adapt color ramp 
// u_colorScale.x is lower threshold, u_colorScale.y is upper threshold
uniform vec2 u_colorScale;

// flag for coloring inland waterbodies
uniform bool u_waterBodies; 

// flag for coloring inland waterbodies
uniform bool u_hillShading; 

// direction of light source
uniform vec3 u_light; 

// intensity of ambient light
uniform float u_ambient_light; 

// number of vertices per edge
uniform float u_meshResolution; 

// flag for testing mode
uniform bool u_testing; 

const float MAX_ELEVATION = 4900.0; // assumed to be the highest elevation in the eu-dem
// mesh cellsize for tile resolution of 256x256 pixel
const highp float CELLSIZE = 0.00390625; // =1.0/256.0

void main(void) {
  
    // When on eastern or southern tile border, take not current cells elevation
    // but use (northern / western) neighbour cell to avoid stronger artefacts.
    // The values on each adjacent tile border is the same so without this filter
    // there would be a two pixel wide line visible.
    vec2 m_texCoord = v_texCoord;


	if(m_texCoord.y <= CELLSIZE){ // southern border of tile
		m_texCoord = vec2(m_texCoord.x,m_texCoord.y+CELLSIZE);
	}
	if(m_texCoord.x >= 1.0-CELLSIZE){ // eastern border of tile
		m_texCoord = vec2(m_texCoord.x-0.8*CELLSIZE,m_texCoord.y);
	}

	// compute neighbouring vertices
	vec3 neighbourRight = vec3(m_texCoord.x+CELLSIZE, 1.0 - m_texCoord.y,0.0);
	vec3 neighbourBelow = vec3(m_texCoord.x, 1.0 - m_texCoord.y+CELLSIZE,0.0);
    
	// read encoded values from dem tile texture and decode elevation values
    float absElevation = decodeElevation(texture2D(u_texture, m_texCoord.xy));
    neighbourRight.z = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x+CELLSIZE, m_texCoord.y)));
    neighbourBelow.z = decodeElevation(texture2D(u_texture, vec2(m_texCoord.x, m_texCoord.y-CELLSIZE)));
  
	// transform x and y to meter coordinates for normal computation and add elevation value
	vec3 currentV = vec3(m_texCoord.x*u_tileSizeM,(1.0 - m_texCoord.y)*u_tileSizeM,absElevation);


// computation of hypsometric color
	// scaling of color ramp
	float colorMin = u_colorScale.x/MAX_ELEVATION;
	float colorMax = u_colorScale.y/MAX_ELEVATION;
	float relativeElevation = absElevation/MAX_ELEVATION;
	if(relativeElevation<=colorMin){
		relativeElevation = 0.0;
	} else if(relativeElevation>=colorMax){
		relativeElevation = 1.0;
	} else {
		relativeElevation = (relativeElevation - colorMin) / (colorMax - colorMin);
	}
	// read corresponding value from color ramp texture
	vec4 hypsoColor = abs(texture2D(u_colorRamp,vec2(0.5,relativeElevation)));

	// color for water surfaces in flat terrain
	if(currentV.z == absElevation && neighbourRight.z == absElevation && neighbourBelow.z == absElevation){
		
		// sealevel (0.0m) or below (i.e. negative no data values)
		if(absElevation <= 0.0){
			hypsoColor = vec4(0.5058823529,0.7725490196,0.8470588235,1.0);	// set color to blue

		// if not on sea-level and inland waterBody flag is true	
		} else if(u_waterBodies) {

			// doublecheck if this pixel really belongs to a larger surface with help of remaining two neighbours
			//vec3 neighbourAbove = vec3(v_texCoord.x,v_texCoord.y-CELLSIZE/2.0,0.0);  
			//vec3 neighbourLeft = vec3(v_texCoord.x+CELLSIZE/2.0,v_texCoord.y,0.0);  
			//if(decodeElevation(texture2D(u_texture, neighbourAbove.xy)) == absElevation && decodeElevation(texture2D(u_texture, neighbourLeft.xy)) == absElevation){
				hypsoColor = vec4(0.5058823529,0.7725490196,0.8470588235,1.0); 	// set color to blue
			//}
		}
	} 

	if(u_testing){
		//hypsoColor = decodeTextureColor(texture2D(u_texture, m_texCoord.xy));
	}

// computation of hillshading
	if(u_hillShading){
		// transform to meter coordinates for normal computation
		neighbourRight.xy *= u_tileSizeM;
		neighbourBelow.xy *= u_tileSizeM;

		// normal computation
		vec3 normal = normalize(cross(neighbourRight -currentV,neighbourBelow-currentV));

		// compute hillShade with help of u_light and normal and blend hypsocolor with hillShade
		float hillShade = clamp(u_ambient_light * 1.0+ max(dot(normal,normalize(u_light)),0.0),0.0,1.0);
		gl_FragColor = hypsoColor * vec4(hillShade,hillShade,hillShade,1.0);
	} else {
		// apply only hypsometric color
		gl_FragColor = hypsoColor;
	}



// testing mode
	if(u_testing){

		float lineWidth = 3.0 * CELLSIZE;
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
