/**
 * Radar Component — WebGL interactive radar sweep background animation.
 */
import { useEffect, useRef } from 'react';
import './Radar.css';

function hexToVec3(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

const vertexShaderSource = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uRingCount;
uniform float uSpokeCount;
uniform float uRingThickness;
uniform float uSpokeThickness;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepLobes;
uniform vec3 uColor;
uniform vec3 uBgColor;
uniform float uFalloff;
uniform float uBrightness;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318530718
#define PI 3.14159265359

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st = st * 2.0 - 1.0;
  st.x *= uResolution.x / uResolution.y;

  if (uEnableMouse) {
    vec2 mShift = (uMouse * 2.0 - 1.0);
    mShift.x *= uResolution.x / uResolution.y;
    st -= mShift * uMouseInfluence;
  }

  st *= uScale;

  float dist = length(st);
  float theta = atan(st.y, st.x);
  float t = uTime * uSpeed;

  float ringPhase = dist * uRingCount - t;
  float ringDist = abs(fract(ringPhase) - 0.5);
  float ringGlow = 1.0 - smoothstep(0.0, uRingThickness, ringDist);

  float spokeAngle = abs(fract(theta * uSpokeCount / TAU + 0.5) - 0.5) * TAU / uSpokeCount;
  float arcDist = spokeAngle * dist;
  float spokeGlow = (1.0 - smoothstep(0.0, uSpokeThickness, arcDist)) * smoothstep(0.0, 0.1, dist);

  float sweepPhase = t * uSweepSpeed;
  float sweepBeam = pow(max(0.5 * sin(uSweepLobes * theta + sweepPhase) + 0.5, 0.0), uSweepWidth);

  float fade = smoothstep(1.05, 0.85, dist) * pow(max(1.0 - dist, 0.0), uFalloff);

  float intensity = max((ringGlow + spokeGlow + sweepBeam) * fade * uBrightness, 0.0);
  vec3 col = uColor * intensity + uBgColor;

  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

export default function Radar({
  speed = 1.0,
  scale = 0.5,
  ringCount = 10.0,
  spokeCount = 10.0,
  ringThickness = 0.05,
  spokeThickness = 0.01,
  sweepSpeed = 1.0,
  sweepWidth = 2.0,
  sweepLobes = 1.0,
  color = '#2b2bcbff',
  backgroundColor = '#000000',
  falloff = 2.0,
  brightness = 1.0,
  enableMouseInteraction = true,
  mouseInfluence = 0.1
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // Helper compile shader
    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (2 triangles covering clip space)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uResLoc = gl.getUniformLocation(program, 'uResolution');
    const uSpeedLoc = gl.getUniformLocation(program, 'uSpeed');
    const uScaleLoc = gl.getUniformLocation(program, 'uScale');
    const uRingCountLoc = gl.getUniformLocation(program, 'uRingCount');
    const uSpokeCountLoc = gl.getUniformLocation(program, 'uSpokeCount');
    const uRingThicknessLoc = gl.getUniformLocation(program, 'uRingThickness');
    const uSpokeThicknessLoc = gl.getUniformLocation(program, 'uSpokeThickness');
    const uSweepSpeedLoc = gl.getUniformLocation(program, 'uSweepSpeed');
    const uSweepWidthLoc = gl.getUniformLocation(program, 'uSweepWidth');
    const uSweepLobesLoc = gl.getUniformLocation(program, 'uSweepLobes');
    const uColorLoc = gl.getUniformLocation(program, 'uColor');
    const uBgColorLoc = gl.getUniformLocation(program, 'uBgColor');
    const uFalloffLoc = gl.getUniformLocation(program, 'uFalloff');
    const uBrightnessLoc = gl.getUniformLocation(program, 'uBrightness');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');
    const uMouseInfluenceLoc = gl.getUniformLocation(program, 'uMouseInfluence');
    const uEnableMouseLoc = gl.getUniformLocation(program, 'uEnableMouse');

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    function handleMouseMove(e) {
      if (!enableMouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      targetMouse = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height
      ];
    }

    function handleMouseLeave() {
      targetMouse = [0.5, 0.5];
    }

    if (enableMouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    function resize() {
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    window.addEventListener('resize', resize);
    resize();

    let animId;
    const startTime = performance.now();

    function render(now) {
      animId = requestAnimationFrame(render);
      const elapsedTime = (now - startTime) * 0.001;

      gl.useProgram(program);

      // Pass uniform values
      gl.uniform1f(uTimeLoc, elapsedTime);
      gl.uniform3f(uResLoc, canvas.width, canvas.height, canvas.width / (canvas.height || 1));
      gl.uniform1f(uSpeedLoc, speed);
      gl.uniform1f(uScaleLoc, scale);
      gl.uniform1f(uRingCountLoc, ringCount);
      gl.uniform1f(uSpokeCountLoc, spokeCount);
      gl.uniform1f(uRingThicknessLoc, ringThickness);
      gl.uniform1f(uSpokeThicknessLoc, spokeThickness);
      gl.uniform1f(uSweepSpeedLoc, sweepSpeed);
      gl.uniform1f(uSweepWidthLoc, sweepWidth);
      gl.uniform1f(uSweepLobesLoc, sweepLobes);

      const colorVec = hexToVec3(color);
      gl.uniform3f(uColorLoc, colorVec[0], colorVec[1], colorVec[2]);

      const bgVec = hexToVec3(backgroundColor);
      gl.uniform3f(uBgColorLoc, bgVec[0], bgVec[1], bgVec[2]);

      gl.uniform1f(uFalloffLoc, falloff);
      gl.uniform1f(uBrightnessLoc, brightness);

      if (enableMouseInteraction) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
        gl.uniform2f(uMouseLoc, currentMouse[0], currentMouse[1]);
      } else {
        gl.uniform2f(uMouseLoc, 0.5, 0.5);
      }

      gl.uniform1f(uMouseInfluenceLoc, mouseInfluence);
      gl.uniform1i(uEnableMouseLoc, enableMouseInteraction ? 1 : 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [
    speed,
    scale,
    ringCount,
    spokeCount,
    ringThickness,
    spokeThickness,
    sweepSpeed,
    sweepWidth,
    sweepLobes,
    color,
    backgroundColor,
    falloff,
    brightness,
    enableMouseInteraction,
    mouseInfluence,
  ]);

  return (
    <div className="radar-container">
      <canvas ref={canvasRef} className="radar-canvas" />
    </div>
  );
}
