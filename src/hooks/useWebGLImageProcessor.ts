import { useCallback, useRef } from 'react';

// Vertex shader - simple pass-through
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader for sharpening
const sharpeningShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_sharpenStrength;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    
    vec4 center = texture2D(u_image, v_texCoord);
    vec4 left = texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0));
    vec4 right = texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0));
    vec4 top = texture2D(u_image, v_texCoord + vec2(0.0, -onePixel.y));
    vec4 bottom = texture2D(u_image, v_texCoord + vec2(0.0, onePixel.y));
    
    // Unsharp mask
    vec4 blurred = (left + right + top + bottom) / 4.0;
    vec4 sharpened = center + (center - blurred) * u_sharpenStrength;
    
    gl_FragColor = clamp(sharpened, 0.0, 1.0);
  }
`;

// Fragment shader for noise reduction (bilateral-like blur)
const noiseReductionShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_strength;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    float sigma = u_strength * 2.0;
    
    vec4 center = texture2D(u_image, v_texCoord);
    vec4 sum = center;
    float totalWeight = 1.0;
    
    // 5x5 kernel for noise reduction
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        if (x == 0 && y == 0) continue;
        
        vec2 offset = vec2(float(x), float(y)) * onePixel;
        vec4 sample = texture2D(u_image, v_texCoord + offset);
        
        // Spatial weight
        float spatialDist = length(vec2(float(x), float(y)));
        float spatialWeight = exp(-spatialDist * spatialDist / (2.0 * sigma * sigma));
        
        // Range weight (color similarity)
        float colorDist = length(sample.rgb - center.rgb);
        float rangeWeight = exp(-colorDist * colorDist * 50.0);
        
        float weight = spatialWeight * rangeWeight;
        sum += sample * weight;
        totalWeight += weight;
      }
    }
    
    gl_FragColor = sum / totalWeight;
  }
`;

// Fragment shader for detail enhancement
const detailEnhancementShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_amount;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    
    vec4 center = texture2D(u_image, v_texCoord);
    
    // Sobel edge detection
    vec4 tl = texture2D(u_image, v_texCoord + vec2(-onePixel.x, -onePixel.y));
    vec4 t = texture2D(u_image, v_texCoord + vec2(0.0, -onePixel.y));
    vec4 tr = texture2D(u_image, v_texCoord + vec2(onePixel.x, -onePixel.y));
    vec4 l = texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0));
    vec4 r = texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0));
    vec4 bl = texture2D(u_image, v_texCoord + vec2(-onePixel.x, onePixel.y));
    vec4 b = texture2D(u_image, v_texCoord + vec2(0.0, onePixel.y));
    vec4 br = texture2D(u_image, v_texCoord + vec2(onePixel.x, onePixel.y));
    
    // Horizontal and vertical gradients
    vec4 gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
    vec4 gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
    
    // Edge magnitude
    vec4 edge = sqrt(gx*gx + gy*gy);
    
    // Enhance details by adding edge information
    vec4 enhanced = center + edge * u_amount * 0.5;
    
    gl_FragColor = clamp(enhanced, 0.0, 1.0);
  }
`;

// Fragment shader for color/contrast adjustment
const colorAdjustmentShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_brightness;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Brightness
    color.rgb += u_brightness;
    
    // Contrast
    color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
    
    // Saturation
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, u_saturation);
    
    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`;

interface ProcessingOptions {
  sharpenStrength: number; // 0-2
  noiseReduction: number; // 0-1
  detailEnhancement: number; // 0-1
  contrast: number; // 0.5-2
  saturation: number; // 0-2
  brightness: number; // -0.5 to 0.5
}

export const useWebGLImageProcessor = () => {
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const programsRef = useRef<Map<string, WebGLProgram>>(new Map());
  const texturesRef = useRef<WebGLTexture[]>([]);
  const framebuffersRef = useRef<WebGLFramebuffer[]>([]);

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null => {
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, []);

  const initWebGL = useCallback((width: number, height: number): boolean => {
    // Create or reuse canvas
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Get WebGL context
    const gl = canvasRef.current.getContext('webgl', {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    
    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }
    
    glRef.current = gl;

    // Create vertex shader (shared)
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    if (!vertexShader) return false;

    // Create fragment shaders and programs
    const shaders: Record<string, string> = {
      sharpen: sharpeningShaderSource,
      noiseReduction: noiseReductionShaderSource,
      detailEnhancement: detailEnhancementShaderSource,
      colorAdjustment: colorAdjustmentShaderSource,
    };

    for (const [name, source] of Object.entries(shaders)) {
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, source);
      if (!fragmentShader) continue;
      
      const program = createProgram(gl, vertexShader, fragmentShader);
      if (program) {
        programsRef.current.set(name, program);
      }
    }

    // Create textures for ping-pong rendering
    for (let i = 0; i < 2; i++) {
      const texture = gl.createTexture();
      if (!texture) continue;
      
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
      texturesRef.current.push(texture);

      const framebuffer = gl.createFramebuffer();
      if (!framebuffer) continue;
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
      framebuffersRef.current.push(framebuffer);
    }

    return true;
  }, [createShader, createProgram]);

  const setupGeometry = useCallback((gl: WebGLRenderingContext, program: WebGLProgram) => {
    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Texture coordinate buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      0, 0,
      1, 1,
      1, 0,
    ]), gl.STATIC_DRAW);

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  }, []);

  const renderPass = useCallback((
    gl: WebGLRenderingContext,
    programName: string,
    inputTexture: WebGLTexture,
    outputFramebuffer: WebGLFramebuffer | null,
    uniforms: Record<string, number | number[]>
  ) => {
    const program = programsRef.current.get(programName);
    if (!program) return;

    gl.useProgram(program);
    setupGeometry(gl, program);

    // Bind input texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

    // Set uniforms
    for (const [name, value] of Object.entries(uniforms)) {
      const location = gl.getUniformLocation(program, name);
      if (location === null) continue;
      
      if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(location, value);
        else if (value.length === 3) gl.uniform3fv(location, value);
        else if (value.length === 4) gl.uniform4fv(location, value);
      } else {
        gl.uniform1f(location, value);
      }
    }

    // Bind output framebuffer (null = screen/canvas)
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [setupGeometry]);

  const processImage = useCallback(async (
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData,
    options: Partial<ProcessingOptions> = {}
  ): Promise<ImageData | null> => {
    const defaults: ProcessingOptions = {
      sharpenStrength: 0,
      noiseReduction: 0,
      detailEnhancement: 0,
      contrast: 1,
      saturation: 1,
      brightness: 0,
    };
    
    const opts = { ...defaults, ...options };

    // Get dimensions
    let width: number, height: number;
    if (imageSource instanceof ImageData) {
      width = imageSource.width;
      height = imageSource.height;
    } else {
      width = imageSource.width;
      height = imageSource.height;
    }

    // Initialize WebGL
    if (!initWebGL(width, height)) {
      console.error('Failed to initialize WebGL');
      return null;
    }

    const gl = glRef.current!;
    const canvas = canvasRef.current!;

    // Create source texture
    const sourceTexture = gl.createTexture();
    if (!sourceTexture) return null;

    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    
    if (imageSource instanceof ImageData) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageSource.data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageSource);
    }
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let currentTexture = sourceTexture;
    let pingPong = 0;
    const textureSize = [width, height];

    // Apply noise reduction
    if (opts.noiseReduction > 0) {
      renderPass(gl, 'noiseReduction', currentTexture, framebuffersRef.current[pingPong], {
        u_textureSize: textureSize,
        u_strength: opts.noiseReduction,
      });
      currentTexture = texturesRef.current[pingPong];
      pingPong = 1 - pingPong;
    }

    // Apply sharpening
    if (opts.sharpenStrength > 0) {
      renderPass(gl, 'sharpen', currentTexture, framebuffersRef.current[pingPong], {
        u_textureSize: textureSize,
        u_sharpenStrength: opts.sharpenStrength,
      });
      currentTexture = texturesRef.current[pingPong];
      pingPong = 1 - pingPong;
    }

    // Apply detail enhancement
    if (opts.detailEnhancement > 0) {
      renderPass(gl, 'detailEnhancement', currentTexture, framebuffersRef.current[pingPong], {
        u_textureSize: textureSize,
        u_amount: opts.detailEnhancement,
      });
      currentTexture = texturesRef.current[pingPong];
      pingPong = 1 - pingPong;
    }

    // Apply color adjustments
    if (opts.contrast !== 1 || opts.saturation !== 1 || opts.brightness !== 0) {
      renderPass(gl, 'colorAdjustment', currentTexture, framebuffersRef.current[pingPong], {
        u_contrast: opts.contrast,
        u_saturation: opts.saturation,
        u_brightness: opts.brightness,
      });
      currentTexture = texturesRef.current[pingPong];
      pingPong = 1 - pingPong;
    }

    // Final render to canvas
    renderPass(gl, 'sharpen', currentTexture, null, {
      u_textureSize: textureSize,
      u_sharpenStrength: 0, // No additional sharpening, just copy
    });

    // Read pixels from canvas
    const pixels = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Flip vertically (WebGL has inverted Y)
    const flipped = new Uint8ClampedArray(pixels.length);
    for (let y = 0; y < height; y++) {
      const srcRow = (height - 1 - y) * width * 4;
      const dstRow = y * width * 4;
      for (let x = 0; x < width * 4; x++) {
        flipped[dstRow + x] = pixels[srcRow + x];
      }
    }

    // Cleanup
    gl.deleteTexture(sourceTexture);

    return new ImageData(flipped, width, height);
  }, [initWebGL, renderPass]);

  const isWebGLSupported = useCallback((): boolean => {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    return !!gl;
  }, []);

  const cleanup = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;

    // Delete textures
    for (const texture of texturesRef.current) {
      gl.deleteTexture(texture);
    }
    texturesRef.current = [];

    // Delete framebuffers
    for (const fb of framebuffersRef.current) {
      gl.deleteFramebuffer(fb);
    }
    framebuffersRef.current = [];

    // Delete programs
    for (const program of programsRef.current.values()) {
      gl.deleteProgram(program);
    }
    programsRef.current.clear();

    glRef.current = null;
  }, []);

  return {
    processImage,
    isWebGLSupported,
    cleanup,
  };
};
