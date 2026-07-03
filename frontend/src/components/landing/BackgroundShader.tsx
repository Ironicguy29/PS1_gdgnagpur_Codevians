"use client";
import React, { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_isLight;

  // Simple 2D Pseudo-random noise
  float noise(vec2 p) {
    return sin(p.x * 12.9898 + p.y * 78.233) * 43758.5453;
  }

  // Value noise function
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = fract(noise(i));
    float b = fract(noise(i + vec2(1.0, 0.0)));
    float c = fract(noise(i + vec2(0.0, 1.0)));
    float d = fract(noise(i + vec2(1.0, 1.0)));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractional Brownian Motion for medical liquid waves
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 4; ++i) {
      v += a * smoothNoise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Add noise distortion to simulate medical fluid/wave movement
    float time = u_time * 0.15;
    vec2 flow = vec2(fbm(p * 2.0 + time), fbm(p * 2.0 - time));
    
    // Distort uv mapping with the flow
    p += flow * 0.25;
    
    // Create organic breathing gradients
    float pulse = sin(u_time * 0.5) * 0.5 + 0.5;
    
    // Layer 1: Dark deep blue base vs Light soft sky blue base
    vec3 baseColor = mix(vec3(0.02, 0.03, 0.08), vec3(0.97, 0.98, 0.99), u_isLight);
    
    // Layer 2: Medical blue wave gradient
    float dist1 = length(p - vec2(sin(time) * 0.5, cos(time) * 0.3));
    vec3 color1 = mix(vec3(0.05, 0.2, 0.45), vec3(0.2, 0.45, 0.75), u_isLight) * (1.0 / (1.0 + dist1 * dist1 * 2.5));
    
    // Layer 3: Cyan breathing light / node
    float dist2 = length(p + vec2(cos(time * 0.8) * 0.6, sin(time * 0.9) * 0.4));
    vec3 color2 = mix(vec3(0.0, 0.35, 0.4), vec3(0.1, 0.55, 0.65), u_isLight) * (1.0 / (1.0 + dist2 * dist2 * 4.0)) * (0.8 + 0.2 * pulse);
    
    // Add interactive mouse glow
    float mouseDist = length(p - ((u_mouse - 0.5 * u_resolution) / u_resolution.y));
    vec3 mouseGlow = mix(vec3(0.0, 0.25, 0.5), vec3(0.1, 0.35, 0.6), u_isLight) * (1.0 / (1.0 + mouseDist * mouseDist * 12.0)) * 0.6;
    
    // Combine layers
    vec3 finalColor = baseColor + color1 + color2 + mouseGlow;
    
    // Add a very subtle noise texture overlay for high-end grain aesthetic
    float grain = (noise(gl_FragCoord.xy) - 0.5) * 0.012;
    finalColor += vec3(grain);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function BackgroundShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertShader) return;
    gl.shaderSource(vertShader, vertexShaderSource);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragShader) return;
    gl.shaderSource(fragShader, fragmentShaderSource);
    gl.compileShader(fragShader);

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const mouseLoc = gl.getUniformLocation(program, "u_mouse");
    const isLightLoc = gl.getUniformLocation(program, "u_isLight");

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      // Flip Y coordinates for WebGL space
      mouseRef.current.y = window.innerHeight - e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Handle resizing
    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Animation Loop throttled to 30 FPS for optimal background performance
    let animationFrameId: number;
    const startTime = performance.now();
    let lastFrameTime = 0;
    const targetFps = 30;
    const frameInterval = 1000 / targetFps;

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = now - lastFrameTime;
      if (delta < frameInterval) return;
      lastFrameTime = now - (delta % frameInterval);

      const elapsedSeconds = (now - startTime) / 1000.0;
      const isLight = document.documentElement.classList.contains("light") ? 1.0 : 0.0;
      
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsedSeconds);
      gl.uniform2f(mouseLoc, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(isLightLoc, isLight);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    animationFrameId = requestAnimationFrame(render);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none opacity-60 dark:opacity-85 dark:mix-blend-screen transition-opacity duration-500"
    />
  );
}
