'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ----------------------------------------------------------------------
// Cyber Mountain Distortion (Codrops Classic)
// ----------------------------------------------------------------------

const mountainUniforms = {
  uFreq: new THREE.Uniform(new THREE.Vector3(3, 6, 10)),
  uAmp: new THREE.Uniform(new THREE.Vector3(30, 30, 20)),
};

const nsin = (val: number) => Math.sin(val) * 0.5 + 0.5;

const CyberMountain = {
  name: 'Cyber Mountain',
  uniforms: mountainUniforms,
  getDistortion: `
    uniform vec3 uAmp;
    uniform vec3 uFreq;
    #define PI 3.14159265358979
    float nsin(float val){ return sin(val) * 0.5 + 0.5; }
    vec3 getDistortion(float progress){
      float movementProgressFix = 0.02;
      return vec3( 
        cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
        nsin(progress * PI * uFreq.y + uTime) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + uTime) * uAmp.y,
        nsin(progress * PI * uFreq.z + uTime) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + uTime) * uAmp.z
      );
    }
  `,
  getJS: (progress: number, time: number) => {
    const movementProgressFix = 0.02;
    const uFreq = mountainUniforms.uFreq.value;
    const uAmp = mountainUniforms.uAmp.value;
    const distortion = new THREE.Vector3(
      Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x -
        Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
      nsin(progress * Math.PI * uFreq.y + time) * uAmp.y -
        nsin(movementProgressFix * Math.PI * uFreq.y + time) * uAmp.y,
      nsin(progress * Math.PI * uFreq.z + time) * uAmp.z -
        nsin(movementProgressFix * Math.PI * uFreq.z + time) * uAmp.z
    );
    return distortion.multiply(new THREE.Vector3(2, 2, 2)).add(new THREE.Vector3(0, 0, -5));
  },
};

// Helper utils
const random = (base: number | [number, number]) => {
  if (Array.isArray(base)) return Math.random() * (base[1] - base[0]) + base[0];
  return Math.random() * base;
};

const pickRandom = (arr: any) => {
  if (Array.isArray(arr)) return arr[Math.floor(Math.random() * arr.length)];
  return arr;
};

function lerp(current: number, target: number, speed = 0.1, limit = 0.001) {
  let change = (target - current) * speed;
  if (Math.abs(change) < limit) {
    change = target - current;
  }
  return change;
}

// ----------------------------------------------------------------------
// Shaders & Scene Objects
// ----------------------------------------------------------------------

const carLightsFragment = `
  varying vec3 vColor;
  varying vec2 vUv; 
  uniform vec2 uFade;
  void main() {
    vec3 color = vec3(vColor);
    float alpha = smoothstep(uFade.x, uFade.y, vUv.x);
    gl_FragColor = vec4(color, alpha);
    if (gl_FragColor.a < 0.0001) discard;
  }
`;

const carLightsVertex = `
  attribute vec3 aOffset;
  attribute vec3 aMetrics;
  attribute vec3 aColor;

  uniform float uTravelLength;
  uniform float uTime;

  varying vec2 vUv; 
  varying vec3 vColor; 
  
  #include <getDistortion_vertex>

  void main() {
    vec3 transformed = position.xyz;
    float radius = aMetrics.r;
    float myLength = aMetrics.g;
    float speed = aMetrics.b;

    transformed.xy *= radius;
    transformed.z *= myLength;
  
    transformed.z += myLength - mod(uTime * speed + aOffset.z, uTravelLength);
    transformed.xy += aOffset.xy;

    float progress = abs(transformed.z / uTravelLength);
    transformed.xyz += getDistortion(progress);

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    vColor = aColor;
  }
`;

class CarLights {
  webgl: any;
  options: any;
  colors: any;
  speed: any;
  fade: THREE.Vector2;
  mesh!: THREE.Mesh;

  constructor(webgl: any, options: any, colors: any, speed: any, fade: THREE.Vector2) {
    this.webgl = webgl;
    this.options = options;
    this.colors = colors;
    this.speed = speed;
    this.fade = fade;
  }

  init() {
    const options = this.options;
    const curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
    const geometry = new THREE.TubeGeometry(curve, 32, 1, 8, false);

    const instanced = new THREE.InstancedBufferGeometry().copy(geometry as any);
    instanced.instanceCount = options.lightPairsPerRoadWay * 2;

    const laneWidth = options.roadWidth / options.lanesPerRoad;
    const aOffset: number[] = [];
    const aMetrics: number[] = [];
    const aColor: number[] = [];

    let colors = this.colors;
    if (Array.isArray(colors)) {
      colors = colors.map((c: any) => new THREE.Color(c));
    } else {
      colors = new THREE.Color(colors);
    }

    for (let i = 0; i < options.lightPairsPerRoadWay; i++) {
      const radius = random(options.carLightsRadius);
      const length = random(options.carLightsLength);
      const speed = random(this.speed);

      const carLane = i % 3;
      let laneX = carLane * laneWidth - options.roadWidth / 2 + laneWidth / 2;
      const carWidth = random(options.carWidthPercentage) * laneWidth;
      const carShiftX = random(options.carShiftX) * laneWidth;
      laneX += carShiftX;

      const offsetY = random(options.carFloorSeparation) + radius * 1.3;
      const offsetZ = -random(options.length);

      aOffset.push(laneX - carWidth / 2, offsetY, offsetZ);
      aOffset.push(laneX + carWidth / 2, offsetY, offsetZ);

      aMetrics.push(radius, length, speed);
      aMetrics.push(radius, length, speed);

      const color = pickRandom(colors);
      aColor.push(color.r, color.g, color.b);
      aColor.push(color.r, color.g, color.b);
    }

    instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3));
    instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 3));
    instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3));

    const material = new THREE.ShaderMaterial({
      fragmentShader: carLightsFragment,
      vertexShader: carLightsVertex,
      transparent: true,
      uniforms: Object.assign(
        {
          uTime: new THREE.Uniform(0),
          uTravelLength: new THREE.Uniform(options.length),
          uFade: new THREE.Uniform(this.fade),
        },
        options.distortion.uniforms
      ),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <getDistortion_vertex>',
        options.distortion.getDistortion
      );
    };

    const mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    this.webgl.scene.add(mesh);
    this.mesh = mesh;
  }

  update(time: number) {
    if (this.mesh && this.mesh.material) {
      (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.webgl.scene.remove(this.mesh);
    }
  }
}

const sideSticksVertex = `
  attribute float aOffset;
  attribute vec3 aColor;
  attribute vec2 aMetrics;

  uniform float uTravelLength;
  uniform float uTime;

  varying vec3 vColor;

  mat4 rotationY(in float angle) {
    return mat4(
      cos(angle),  0, sin(angle), 0,
      0,          1.0, 0,         0,
      -sin(angle), 0, cos(angle), 0,
      0,          0, 0,         1
    );
  }

  #include <getDistortion_vertex>

  void main() {
    vec3 transformed = position.xyz;
    float width = aMetrics.x;
    float height = aMetrics.y;

    transformed.xy *= vec2(width, height);
    float time = mod(uTime * 60. * 2. + aOffset, uTravelLength);

    transformed = (rotationY(3.14 / 2.) * vec4(transformed, 1.)).xyz;
    transformed.z += -uTravelLength + time;

    float progress = abs(transformed.z / uTravelLength);
    transformed.xyz += getDistortion(progress);

    transformed.y += height / 2.;
    transformed.x += -width / 2.;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vColor = aColor;
  }
`;

const sideSticksFragment = `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

class LightsSticks {
  webgl: any;
  options: any;
  mesh!: THREE.Mesh;

  constructor(webgl: any, options: any) {
    this.webgl = webgl;
    this.options = options;
  }

  init() {
    const options = this.options;
    const geometry = new THREE.PlaneGeometry(1, 1);
    const instanced = new THREE.InstancedBufferGeometry().copy(geometry as any);
    const totalSticks = options.totalSideLightSticks;
    instanced.instanceCount = totalSticks;

    const stickoffset = options.length / (totalSticks - 1);
    const aOffset: number[] = [];
    const aColor: number[] = [];
    const aMetrics: number[] = [];

    let colors = options.colors.sticks;
    if (Array.isArray(colors)) {
      colors = colors.map((c: any) => new THREE.Color(c));
    } else {
      colors = new THREE.Color(colors);
    }

    for (let i = 0; i < totalSticks; i++) {
      const width = random(options.lightStickWidth);
      const height = random(options.lightStickHeight);
      aOffset.push((i - 1) * stickoffset * 2 + stickoffset * Math.random());

      const color = pickRandom(colors);
      aColor.push(color.r, color.g, color.b);
      aMetrics.push(width, height);
    }

    instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 1));
    instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3));
    instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 2));

    const material = new THREE.ShaderMaterial({
      fragmentShader: sideSticksFragment,
      vertexShader: sideSticksVertex,
      side: THREE.DoubleSide,
      uniforms: Object.assign(
        {
          uTravelLength: new THREE.Uniform(options.length),
          uTime: new THREE.Uniform(0),
        },
        options.distortion.uniforms
      ),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <getDistortion_vertex>',
        options.distortion.getDistortion
      );
    };

    const mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    this.webgl.scene.add(mesh);
    this.mesh = mesh;
  }

  update(time: number) {
    if (this.mesh && this.mesh.material) {
      (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.webgl.scene.remove(this.mesh);
    }
  }
}

// ----------------------------------------------------------------------
// Highway Road Plane & Shaders
// ----------------------------------------------------------------------

const roadBaseFragment = `
  varying vec2 vUv; 
  uniform vec3 uColor;
  uniform float uTime;
  #include <roadMarkings_vars>
  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(uColor);
    #include <roadMarkings_fragment>
    gl_FragColor = vec4(color, 1.);
  }
`;

const roadMarkings_vars = `
  uniform float uLanes;
  uniform vec3 uBrokenLinesColor;
  uniform vec3 uShoulderLinesColor;
  uniform float uShoulderLinesWidthPercentage;
  uniform float uBrokenLinesWidthPercentage;
  uniform float uBrokenLinesLengthPercentage;
  highp float random(vec2 co) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt = dot(co.xy, vec2(a, b));
    highp float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
  }
`;

const roadMarkings_fragment = `
  uv.y = mod(uv.y + uTime * 0.1, 1.);
  float brokenLineWidth = 1. / uLanes * uBrokenLinesWidthPercentage;
  float laneEmptySpace = 1. - uBrokenLinesLengthPercentage;

  float brokenLines = step(1. - brokenLineWidth * uLanes, fract(uv.x * uLanes)) * step(laneEmptySpace, fract(uv.y * 100.));
  brokenLines *= step(uv.x * uLanes, uLanes - 1.);
  color = mix(color, uBrokenLinesColor, brokenLines);

  float shoulderLinesWidth = 1. / uLanes * uShoulderLinesWidthPercentage;
  float shoulderLines = step(1. - shoulderLinesWidth, uv.x) + step(uv.x, shoulderLinesWidth);
  color = mix(color, uShoulderLinesColor, shoulderLines);

  vec2 noiseFreq = vec2(4., 7000.);
  float roadNoise = random(floor(uv * noiseFreq) / noiseFreq) * 0.035 - 0.017; 
  color += roadNoise;
`;

const roadFragment = roadBaseFragment
  .replace('#include <roadMarkings_fragment>', roadMarkings_fragment)
  .replace('#include <roadMarkings_vars>', roadMarkings_vars);

const islandFragment = roadBaseFragment
  .replace('#include <roadMarkings_fragment>', '')
  .replace('#include <roadMarkings_vars>', '');

const roadVertex = `
  uniform float uTime;
  uniform float uTravelLength;
  varying vec2 vUv; 
  #include <getDistortion_vertex>

  void main() {
    vec3 transformed = position.xyz;
    vec3 distortion = getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
    transformed.x += distortion.x;
    transformed.z += distortion.y;
    transformed.y += -1. * distortion.z;  
    
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
  }
`;

class Road {
  webgl: any;
  options: any;
  uTime: THREE.Uniform;
  leftRoadWay!: THREE.Mesh;
  rightRoadWay!: THREE.Mesh;
  island!: THREE.Mesh;

  constructor(webgl: any, options: any) {
    this.webgl = webgl;
    this.options = options;
    this.uTime = new THREE.Uniform(0);
  }

  createPlane(side: number, width: number, isRoad: boolean) {
    const options = this.options;
    const geometry = new THREE.PlaneGeometry(
      isRoad ? options.roadWidth : options.islandWidth,
      options.length,
      20,
      100
    );

    let uniforms: any = {
      uTravelLength: new THREE.Uniform(options.length),
      uColor: new THREE.Uniform(
        new THREE.Color(isRoad ? options.colors.roadColor : options.colors.islandColor)
      ),
      uTime: this.uTime,
    };

    if (isRoad) {
      uniforms = Object.assign(uniforms, {
        uLanes: new THREE.Uniform(options.lanesPerRoad),
        uBrokenLinesColor: new THREE.Uniform(new THREE.Color(options.colors.brokenLines)),
        uShoulderLinesColor: new THREE.Uniform(new THREE.Color(options.colors.shoulderLines)),
        uShoulderLinesWidthPercentage: new THREE.Uniform(options.shoulderLinesWidthPercentage),
        uBrokenLinesLengthPercentage: new THREE.Uniform(options.brokenLinesLengthPercentage),
        uBrokenLinesWidthPercentage: new THREE.Uniform(options.brokenLinesWidthPercentage),
      });
    }

    const material = new THREE.ShaderMaterial({
      fragmentShader: isRoad ? roadFragment : islandFragment,
      vertexShader: roadVertex,
      side: THREE.DoubleSide,
      uniforms: Object.assign(uniforms, options.distortion.uniforms),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <getDistortion_vertex>',
        options.distortion.getDistortion
      );
    };

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = -options.length / 2;
    mesh.position.x += (this.options.islandWidth / 2 + options.roadWidth / 2) * side;
    this.webgl.scene.add(mesh);
    return mesh;
  }

  init() {
    this.leftRoadWay = this.createPlane(-1, this.options.roadWidth, true);
    this.rightRoadWay = this.createPlane(1, this.options.roadWidth, true);
    this.island = this.createPlane(0, this.options.islandWidth, false);
  }

  update(time: number) {
    this.uTime.value = time;
  }

  dispose() {
    [this.leftRoadWay, this.rightRoadWay, this.island].forEach((mesh) => {
      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.webgl.scene.remove(mesh);
      }
    });
  }
}

// ----------------------------------------------------------------------
// Main Infinite Lights Canvas
// ----------------------------------------------------------------------

export default function InfiniteLights() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const DISTORTION = CyberMountain;

    const options = {
      distortion: DISTORTION,
      length: 400,
      roadWidth: 12, // Increased road width by 20%
      islandWidth: 2.4,
      lanesPerRoad: 3,
      fov: 88,
      fovSpeedUp: 135,
      speedUp: 3.5,
      carLightsFade: 0.4,
      totalSideLightSticks: 40,
      lightPairsPerRoadWay: 35,
      shoulderLinesWidthPercentage: 0.05,
      brokenLinesWidthPercentage: 0.1,
      brokenLinesLengthPercentage: 0.5,
      lightStickWidth: [0.02, 0.05],
      lightStickHeight: [0.3, 0.7],
      movingAwaySpeed: [25, 60],
      movingCloserSpeed: [-160, -240],
      carLightsLength: [400 * 0.05, 400 * 0.2],
      carLightsRadius: [0.04, 0.09],
      carWidthPercentage: [0.1, 0.5],
      carShiftX: [-0.5, 0.5],
      carFloorSeparation: [0, 0.1],
      colors: {
        roadColor: 0x0a0d18, // Visible asphalt contrast
        islandColor: 0x060810,
        background: 0x030712, // Dark sky
        shoulderLines: 0x00f0ff,
        brokenLines: 0x3b82f6,
        leftCars: [0x00f0ff, 0x00a8ff, 0x3b82f6, 0x6366f1],
        rightCars: [0xd900ff, 0xff007f, 0xec4899, 0xa855f7],
        sticks: [0x00f0ff, 0xd900ff, 0x3b82f6],
      },
    };

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Camera setup - Lower camera slightly for dramatic perspective
    const camera = new THREE.PerspectiveCamera(
      options.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 6, -5);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(options.colors.background, options.length * 0.15, options.length * 0.85);

    const webglApp = { scene, camera, renderer, options };

    // Instantiate scene elements (including Road for asphalt & lane markers)
    const road = new Road(webglApp, options);
    const leftCarLights = new CarLights(
      webglApp,
      options,
      options.colors.leftCars,
      options.movingAwaySpeed,
      new THREE.Vector2(0, 1 - options.carLightsFade)
    );
    const rightCarLights = new CarLights(
      webglApp,
      options,
      options.colors.rightCars,
      options.movingCloserSpeed,
      new THREE.Vector2(1, 0 + options.carLightsFade)
    );
    const leftSticks = new LightsSticks(webglApp, options);

    road.init();

    leftCarLights.init();
    leftCarLights.mesh.position.setX(-options.roadWidth / 2 - options.islandWidth / 2);

    rightCarLights.init();
    rightCarLights.mesh.position.setX(options.roadWidth / 2 + options.islandWidth / 2);

    leftSticks.init();
    leftSticks.mesh.position.setX(-(options.roadWidth + options.islandWidth / 2));

    let animId: number;
    let clock = new THREE.Clock();
    let fovTarget = options.fov;
    let speedUpTarget = 0;
    let speedUp = 0;
    let timeOffset = 0;
    let isVisible = true;

    // Internal speed-up mechanics on hold (UI buttons completely removed)
    const handleMouseDown = () => {
      fovTarget = options.fovSpeedUp;
      speedUpTarget = options.speedUp;
    };

    const handleMouseUp = () => {
      fovTarget = options.fov;
      speedUpTarget = 0;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleMouseDown, { passive: true });
    window.addEventListener('touchend', handleMouseUp, { passive: true });

    // Render loop - Pauses when scrolled out of viewport
    const tick = () => {
      if (!isVisible) return;

      const delta = clock.getDelta();
      const lerpPercentage = Math.exp(-(-60 * Math.log2(1 - 0.1)) * delta);

      speedUp += lerp(speedUp, speedUpTarget, lerpPercentage, 0.00001);
      timeOffset += speedUp * delta;

      const time = clock.elapsedTime + timeOffset;

      rightCarLights.update(time);
      leftCarLights.update(time);
      leftSticks.update(time);
      road.update(time);

      let updateCamera = false;
      const fovChange = lerp(camera.fov, fovTarget, lerpPercentage);
      if (Math.abs(fovChange) > 0.001) {
        camera.fov += fovChange * delta * 6;
        updateCamera = true;
      }

      if (options.distortion.getJS) {
        const distortion = options.distortion.getJS(0.025, time);
        camera.lookAt(
          new THREE.Vector3(
            camera.position.x + distortion.x,
            camera.position.y + distortion.y,
            camera.position.z + distortion.z
          )
        );
        updateCamera = true;
      }

      if (updateCamera) {
        camera.updateProjectionMatrix();
      }

      if (scene.fog) {
        const isLight = document.documentElement.classList.contains('light');
        const targetFog = isLight ? 0xf8fafc : options.colors.background;
        if (scene.fog.color.getHex() !== targetFog) {
          scene.fog.color.setHex(targetFog);
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    // Pause WebGL rendering when hero section is not in viewport to guarantee smooth scrolling
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          clock.getDelta(); // Reset clock delta so no time jump occurs
          tick();
        } else if (!isVisible && animId) {
          cancelAnimationFrame(animId);
        }
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(container);

    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchend', handleMouseUp);

      road.dispose();
      leftCarLights.dispose();
      rightCarLights.dispose();
      leftSticks.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden select-none pointer-events-none">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
