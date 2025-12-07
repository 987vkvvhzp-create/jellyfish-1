import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { JellyfishConfig } from '../types';

interface JellyfishParticlesProps {
  config: JellyfishConfig;
  handTension: number; // 0 to 1
}

const JellyfishParticles: React.FC<JellyfishParticlesProps> = ({ config, handTension }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(config.color) },
        uTension: { value: 0 },
        uCoreRadius: { value: config.coreRadius },
        uTentacleLength: { value: config.tentacleLength },
        uTentacleSpread: { value: config.tentacleSpread },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uTension;
        uniform float uCoreRadius;
        uniform float uTentacleLength;
        uniform float uTentacleSpread;
        
        attribute float aSize;
        attribute float aPhase;
        attribute float aType; // 0 = head, 1 = tentacle
        attribute vec3 aRandom;

        varying float vAlpha;
        varying vec3 vColor;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vec3 pos = position;
          
          // Breathing animation (slow pulse when relaxed, rapid when tense)
          float breathSpeed = 1.5 + (uTension * 5.0);
          float breathAmp = 0.1 + (uTension * 0.2);
          float breath = sin(uTime * breathSpeed + aPhase) * breathAmp;
          
          // DISPERSION: Expands the distance between particles based on tension
          float dispersion = uTension * 3.5; 
          
          // ROTATION: Twist effect with tension
          float twist = uTension * pos.y * 0.5;
          float cosT = cos(twist);
          float sinT = sin(twist);
          mat2 rotation = mat2(cosT, -sinT, sinT, cosT);
          pos.xz = rotation * pos.xz;

          if (aType < 0.5) { 
            // HEAD (Bell)
            // When tense, the head expands significantly
            pos += normalize(pos) * (breath + dispersion * 0.3);
            pos *= uCoreRadius * (1.0 + uTension * 0.5);
            vAlpha = 0.8 - (uTension * 0.2); 
          } else {
            // TENTACLES
            float yNorm = 1.0 - (pos.y + 1.0) / 2.0; // 0 at top, 1 at bottom
            
            // Waving motion increases with tension
            float waveAmp = (0.5 + uTension * 2.0) * uTentacleSpread;
            float waveFreq = 0.5 + uTension;
            float wave = snoise(vec3(pos.x * 0.5, pos.y * 0.5 - uTime * waveFreq, uTime * 0.2 + aRandom.x));
            
            pos.x += wave * waveAmp;
            pos.z += wave * waveAmp;
            
            // Length extension: Tension pulls them down
            pos.y -= (uTentacleLength * aRandom.y) + (uTension * 1.5);
            
            // Explosive radial dispersion for tentacles
            vec3 radialDir = normalize(vec3(pos.x, 0.0, pos.z));
            pos += radialDir * (dispersion * yNorm * 1.5);

            vAlpha = (1.0 - yNorm) * (0.6 + uTension * 0.4);
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          // SCALING: Particles get larger when tense/close
          float sizeScale = 1.0 + (uTension * 1.5);
          gl_PointSize = aSize * sizeScale * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          // Circular particle
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          
          // Soft edge with internal hot spot
          float glow = 1.0 - (r * 2.0);
          glow = pow(glow, 2.0);

          gl_FragColor = vec4(uColor, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, [config.color, config.coreRadius, config.tentacleLength, config.tentacleSpread]);

  // Generate particles
  const particles = useMemo(() => {
    const count = config.particleCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const types = new Float32Array(count); // 0 or 1
    const randoms = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Distribute particles: 30% head, 70% tentacles
      const isHead = Math.random() > 0.7; 
      types[i] = isHead ? 0.0 : 1.0;

      if (isHead) {
        // Sphere distribution for bell head
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const phiRestricted = phi * 0.5; 
        
        positions[i3] = Math.sin(phiRestricted) * Math.cos(theta);
        positions[i3 + 1] = Math.cos(phiRestricted); // Y up
        positions[i3 + 2] = Math.sin(phiRestricted) * Math.sin(theta);
        
        sizes[i] = Math.random() * 3.0 + 1.0;
      } else {
        // Cylinder/Cone distribution for tentacles
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.5; // Inner core radius
        
        positions[i3] = Math.cos(theta) * radius;
        positions[i3 + 1] = -Math.random() * 0.5; // Start just below head
        positions[i3 + 2] = Math.sin(theta) * radius;

        sizes[i] = Math.random() * 2.0 + 0.5;
      }

      phases[i] = Math.random() * Math.PI * 2;
      randoms[i3] = Math.random();
      randoms[i3+1] = Math.random();
      randoms[i3+2] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aType', new THREE.BufferAttribute(types, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
    
    return geometry;
  }, [config.particleCount]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Rotation speed increases with tension
      pointsRef.current.rotation.y += (0.001 + handTension * 0.005) * config.movementSpeed;
      
      const mat = pointsRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime * config.movementSpeed;
      
      // Interpolate tension for smoothness
      mat.uniforms.uTension.value = THREE.MathUtils.lerp(
        mat.uniforms.uTension.value,
        handTension,
        0.15
      );
      
      mat.uniforms.uColor.value.set(config.color);
    }
  });

  return (
    <points ref={pointsRef} geometry={particles} material={material} />
  );
};

export default JellyfishParticles;