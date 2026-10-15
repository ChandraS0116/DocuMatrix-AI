import React, { useRef, useMemo, useState, useEffect, createContext, useContext } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import DashboardSpatial from '../../pages/DashboardSpatial';
import { useDesignSystem } from '../../design/ThemeProvider';
import * as THREE from 'three';

// --------------------------------------------------------
// Context for Planetary Navigation
// --------------------------------------------------------
const FocusContext = createContext({
  focusedPlanet: null,
  setFocusedPlanet: () => {}
});

// --------------------------------------------------------
// 1. Lighting Layer
// --------------------------------------------------------
const LightingLayer = ({ themeColors }) => {
  return (
    <group name="lighting-layer">
      {/* High ambient light to ensure the dark sides of planets are clearly visible */}
      <ambientLight intensity={0.4} color="#ffffff" />
      {/* Global directional fill light to add a subtle rim highlight everywhere */}
      <directionalLight position={[-1, -0.5, -1]} intensity={0.6} color={themeColors.accentBlue} />
      <fog attach="fog" args={[themeColors.bgDeep, 800, 10000]} />
    </group>
  );
};

// --------------------------------------------------------
// 2. Nebula Layer (Background Galactic Band)
// --------------------------------------------------------
const NebulaLayer = ({ themeColors }) => {
  const geometry = useMemo(() => new THREE.SphereGeometry(10000, 32, 32), []);
  
  const uniforms = useMemo(() => ({
    uColorBg: { value: new THREE.Color() },
    uColorAccent: { value: new THREE.Color() },
    uColorAlt: { value: new THREE.Color() }
  }), []);

  useEffect(() => {
    uniforms.uColorBg.value.set(themeColors.bgDeep);
    uniforms.uColorAccent.value.set(themeColors.accentPurple);
    uniforms.uColorAlt.value.set(themeColors.accentBlue);
  }, [themeColors, uniforms]);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorBg;
    uniform vec3 uColorAccent;
    uniform vec3 uColorAlt;
    varying vec2 vUv;
    
    // We can use a simple sine/cos noise here instead of full simplex to keep it ultra lightweight
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    void main() {
      // Create a band across the equator (vUv.y = 0.5)
      float distToEquator = abs(vUv.y - 0.5);
      float band = smoothstep(0.4, 0.0, distToEquator);

      // Add wispy noise across the band
      float n = noise(vUv * vec2(15.0, 8.0));
      float n2 = noise(vUv * vec2(30.0, 15.0));
      float wisps = (n * 0.6 + n2 * 0.4);

      vec3 col = mix(uColorBg, uColorAccent, band * wisps * 0.7);
      col = mix(col, uColorAlt, band * (1.0 - wisps) * 0.5);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  return (
    <mesh name="nebula-layer" geometry={geometry}>
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false} // Ensure it renders strictly behind everything else
      />
    </mesh>
  );
};

// --------------------------------------------------------
// 2b. Background Planets Layer
// --------------------------------------------------------
// Removed to make way for realistic SolarSystemLayer

// --------------------------------------------------------
// 4. The Sun (Absolute Center [0,0,0])
// --------------------------------------------------------
const SunLayer = () => {
  const map = useLoader(THREE.TextureLoader, '/textures/sun.jpg');
  const sunRef = useRef();
  
  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group name="sun-system" position={[0, 0, 0]}>
      {/* Sun Surface */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[45, 64, 64]} />
        <meshBasicMaterial map={map} />
      </mesh>
      {/* Sun Core Glow */}
      <mesh>
        <sphereGeometry args={[47, 64, 64]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Massive Outer Corona Glow */}
      <mesh>
        <sphereGeometry args={[55, 64, 64]} />
        <meshBasicMaterial color="#ff7700" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Dynamic Light originating from the exact center to perfectly light the planets.
          High intensity and extremely low decay so it reaches Neptune clearly! */}
      <pointLight intensity={15.0} color="#ffffff" distance={5000} decay={0.05} castShadow />
    </group>
  );
};

// --------------------------------------------------------
// 4b. Solar System Layer (Detailed Planets)
// --------------------------------------------------------

const PlanetMesh = ({ texturePath, size, hasAtmosphere, themeColors }) => {
  const map = useLoader(THREE.TextureLoader, texturePath);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
      {hasAtmosphere && (
        <mesh>
          <sphereGeometry args={[size * 1.05, 64, 64]} />
          <shaderMaterial
            transparent={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
            uniforms={{
              uColor: { value: new THREE.Color(themeColors.accentPurple) }
            }}
            vertexShader={`
              varying vec3 vNormal;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform vec3 uColor;
              varying vec3 vNormal;
              void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                gl_FragColor = vec4(uColor, intensity * 0.7);
              }
            `}
          />
        </mesh>
      )}
    </group>
  );
};

const PlanetClouds = ({ texturePath, size }) => {
  const map = useLoader(THREE.TextureLoader, texturePath);
  const ref = useRef();
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.05; });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size * 1.02, 64, 64]} />
      <meshStandardMaterial map={map} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

const PlanetRings = ({ texturePath, innerRadius, outerRadius, opacity = 0.8, color = "#ffffff" }) => {
  const map = texturePath ? useLoader(THREE.TextureLoader, texturePath) : null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <meshBasicMaterial 
        map={map} 
        color={color}
        transparent 
        side={THREE.DoubleSide} 
        opacity={opacity} 
        depthWrite={false}
      />
    </mesh>
  );
};

// --------------------------------------------------------
// Dynamic Moons Layer (InstancedMesh)
// --------------------------------------------------------
const PlanetMoonsLayer = ({ count, planetSize }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const moons = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const radius = planetSize * (1.5 + Math.random() * 3); 
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 0.5;
      const speed = (Math.random() * 1.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1); 
      const size = Math.random() * 0.15 + 0.05;
      arr.push({ radius, theta, phi, speed, size });
    }
    return arr;
  }, [count, planetSize]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    moons.forEach((moon, i) => {
      moon.theta += delta * moon.speed;
      const x = Math.cos(moon.theta) * moon.radius;
      const z = Math.sin(moon.theta) * moon.radius;
      const y = Math.sin(moon.theta) * moon.radius * moon.phi;
      dummy.position.set(x, y, z);
      dummy.scale.set(moon.size, moon.size, moon.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#cccccc" roughness={0.8} />
    </instancedMesh>
  );
};

const DetailedPlanet = ({ texturePath, size, orbitRadius, speed, color = '#ffffff', cloudsPath, ringPath, hasAtmosphere, moonsCount = 0, themeColors, children, name }) => {
  const orbitRef = useRef();
  const planetRef = useRef();
  const { focusedPlanet, setFocusedPlanet } = useContext(FocusContext);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    // If this planet is focused, drastically slow down its orbit so it's easy to look at
    const isFocused = focusedPlanet && focusedPlanet.ref === orbitRef;
    timeRef.current += isFocused ? delta * 0.02 : delta;
    const time = timeRef.current;

    if (orbitRef.current) {
      orbitRef.current.position.x = Math.cos(time * speed) * orbitRadius;
      orbitRef.current.position.z = Math.sin(time * speed) * orbitRadius;
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 2.5, orbitRadius + 2.5, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      
      {/* The group that translates around the orbit */}
      <group 
        ref={orbitRef}
        onClick={(e) => {
          e.stopPropagation();
          setFocusedPlanet({ ref: orbitRef, size, name });
        }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}
      >
        {/* The group that spins on its axis */}
        <group ref={planetRef}>
          <PlanetMesh texturePath={texturePath} size={size} hasAtmosphere={hasAtmosphere} themeColors={themeColors} />
          {cloudsPath && <PlanetClouds texturePath={cloudsPath} size={size} />}
          {ringPath && <PlanetRings texturePath={ringPath} innerRadius={size * 1.2} outerRadius={size * 2.2} opacity={0.85} />}
          {name === 'Uranus' && <PlanetRings innerRadius={size * 1.4} outerRadius={size * 1.8} color="#ffffff" opacity={0.15} />}
          {name === 'Neptune' && <PlanetRings innerRadius={size * 1.6} outerRadius={size * 1.9} color="#88aaff" opacity={0.1} />}
          {moonsCount > 0 && <PlanetMoonsLayer count={moonsCount} planetSize={size} />}
        </group>
        {children}
      </group>
    </group>
  );
};

// --------------------------------------------------------
// Custom Earth System with its own Moon and Dashboard UI
// --------------------------------------------------------
const EarthSystem = ({ orbitRadius, speed, themeColors }) => {
  const orbitRef = useRef();
  const planetRef = useRef();
  const moonRef = useRef();
  const { focusedPlanet, setFocusedPlanet } = useContext(FocusContext);
  const timeRef = useRef(0);
  
  const [dayMap, normalMap, specularMap, cloudsMap, moonMap] = useLoader(THREE.TextureLoader, [
    '/textures/earth_day.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png',
    '/textures/moon.jpg'
  ]);

  useFrame((state, delta) => {
    // Drastically slow down Earth's orbit when focused so Dashboard is easily clickable
    const isFocused = focusedPlanet && focusedPlanet.name === 'Earth';
    timeRef.current += isFocused ? delta * 0.02 : delta;
    const time = timeRef.current;

    if (orbitRef.current) {
      orbitRef.current.position.x = Math.cos(time * speed) * orbitRadius;
      orbitRef.current.position.z = Math.sin(time * speed) * orbitRadius;
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.5;
    }
    if (moonRef.current) {
      moonRef.current.position.x = Math.cos(time * 0.8) * 18; // Moon radius pushed out for larger earth
      moonRef.current.position.z = Math.sin(time * 0.8) * 18;
      moonRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 2.5, orbitRadius + 2.5, 128]} />
        <meshBasicMaterial color="#4F8AFF" transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Earth Orbit Translation Group */}
      <group 
        ref={orbitRef}
        onClick={(e) => {
          e.stopPropagation();
          setFocusedPlanet({ ref: orbitRef, size: 4, name: 'Earth' });
        }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}
      >
        
        {/* Floating UX Label visible from Overview */}
        {(!focusedPlanet || focusedPlanet.name !== 'Earth') && (
          <Html position={[0, 18, 0]} center zIndexRange={[100, 0]}>
            <div className="flex flex-col items-center pointer-events-none animate-pulse">
              <div className="bg-blue-500/20 border border-blue-400/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,100,255,0.5)]">
                Dashboard & Upload
              </div>
              <div className="w-[1px] h-6 bg-gradient-to-b from-blue-400/50 to-transparent mt-1"></div>
            </div>
          </Html>
        )}

        {/* Earth Axial Rotation Group */}
        <group ref={planetRef}>
          <mesh>
            <sphereGeometry args={[12, 64, 64]} />
            <meshPhongMaterial map={dayMap} normalMap={normalMap} specularMap={specularMap} specular={new THREE.Color(0x222222)} shininess={35} />
          </mesh>
          <mesh>
            <sphereGeometry args={[12.2, 64, 64]} />
            <meshStandardMaterial map={cloudsMap} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[12.6, 64, 64]} />
            <shaderMaterial
              transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide}
              uniforms={{ uColor: { value: new THREE.Color(themeColors.accentBlue) } }}
              vertexShader={`varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
              fragmentShader={`uniform vec3 uColor; varying vec3 vNormal; void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0); gl_FragColor = vec4(uColor, intensity * 0.8); }`}
            />
          </mesh>
        </group>

        {/* The Moon */}
        <mesh ref={moonRef} castShadow receiveShadow>
          <sphereGeometry args={[3, 32, 32]} />
          <meshStandardMaterial map={moonMap} roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[17.8, 18.2, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// --------------------------------------------------------
// Asteroid Belt Layer (InstancedMesh for Performance)
// --------------------------------------------------------
const AsteroidBeltLayer = () => {
  const count = 3000;
  const meshRef = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Precompute random orbits between Mars (300) and Jupiter (450)
  const asteroids = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const radius = 350 + Math.random() * 50; // Between 350 and 400
      const theta = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 15; // Vertical scatter
      
      const speed = (Math.random() * 0.05 + 0.05); // Speed multiplier
      
      const size = Math.random() * 0.8 + 0.2; // Asteroid scale
      
      arr.push({ radius, theta, yOffset, speed, size });
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    asteroids.forEach((ast, i) => {
      ast.theta += delta * ast.speed * 0.2; // Move slowly along orbit
      
      const x = Math.cos(ast.theta) * ast.radius;
      const z = Math.sin(ast.theta) * ast.radius;
      
      dummy.position.set(x, ast.yOffset, z);
      
      // Random rotation
      dummy.rotation.x += delta * 0.1 * ast.speed;
      dummy.rotation.y += delta * 0.15 * ast.speed;
      
      dummy.scale.set(ast.size, ast.size, ast.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.9} />
    </instancedMesh>
  );
};

// --------------------------------------------------------
// Comet with Glowing Tail
// --------------------------------------------------------
const Comet = ({ semiMajorAxis, eccentricity, inclination, speed }) => {
  const cometRef = useRef();
  const tailRef = useRef();
  const timeRef = useRef(Math.random() * Math.PI * 2);
  const tailCount = 200;
  
  const positions = useMemo(() => new Float32Array(tailCount * 3), [tailCount]);
  const dummy = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    timeRef.current += delta * speed;
    const t = timeRef.current;
    
    // Elliptical Orbit
    const E = t; 
    const a = semiMajorAxis;
    const e = eccentricity;
    const x = a * (Math.cos(E) - e);
    const z = a * Math.sqrt(1 - e*e) * Math.sin(E);
    const y = x * Math.sin(inclination);
    const finalX = x * Math.cos(inclination);
    
    if (cometRef.current) {
      cometRef.current.position.set(finalX, y, z);
    }
    
    if (tailRef.current) {
      // Tail always points away from the Sun (origin)
      const headPos = dummy.set(finalX, y, z);
      const dir = headPos.clone().normalize();
      
      const positionsArray = tailRef.current.geometry.attributes.position.array;
      for (let i = 0; i < tailCount; i++) {
        // Spread particles along the direction away from the sun
        const distanceBehind = i * 1.5; 
        const spreadScale = i * 0.15;
        const spreadX = (Math.random() - 0.5) * spreadScale;
        const spreadY = (Math.random() - 0.5) * spreadScale;
        const spreadZ = (Math.random() - 0.5) * spreadScale;
        
        positionsArray[i * 3] = headPos.x + dir.x * distanceBehind + spreadX;
        positionsArray[i * 3 + 1] = headPos.y + dir.y * distanceBehind + spreadY;
        positionsArray[i * 3 + 2] = headPos.z + dir.z * distanceBehind + spreadZ;
      }
      tailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh ref={cometRef}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <points ref={tailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={tailCount} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#88ddff" size={6} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
};

// --------------------------------------------------------
// Meteoroids Layer (High Speed Tiny Rocks)
// --------------------------------------------------------
const MeteoroidLayer = () => {
  const count = 1500;
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const meteoroids = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 600 + 50; 
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 150;
      
      const vx = (Math.random() - 0.5) * 2;
      const vy = (Math.random() - 0.5) * 2;
      const vz = (Math.random() - 0.5) * 2;
      
      const size = Math.random() * 0.4 + 0.1;
      
      arr.push({ pos: new THREE.Vector3(Math.cos(theta)*r, y, Math.sin(theta)*r), vel: new THREE.Vector3(vx, vy, vz), size });
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meteoroids.forEach((m, i) => {
      m.pos.addScaledVector(m.vel, delta * 40);
      
      // Wrap around if they go too far out
      if (m.pos.length() > 800) {
        m.pos.setLength(50); 
      }
      
      dummy.position.copy(m.pos);
      dummy.scale.set(m.size, m.size, m.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#666666" roughness={1} />
    </instancedMesh>
  );
};

// --------------------------------------------------------
// Interplanetary Medium (Space Dust Volume)
// --------------------------------------------------------
const InterplanetaryMediumLayer = () => {
  const count = 30000;
  const pointsRef = useRef();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Concentrate towards the sun and ecliptic plane
      const r = Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * (Math.random() * 150); // Disk like shape
      
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02; // Slowly rotate the whole dust cloud
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#aab5ff" size={3} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
};

const SolarSystemLayer = ({ themeColors }) => {
  return (
    <group name="solar-system">
      <DetailedPlanet name="Mercury" texturePath="/textures/mercury.jpg" size={3} orbitRadius={90} speed={0.4} color="#aaaaaa" themeColors={themeColors} />
      <DetailedPlanet name="Venus" texturePath="/textures/venus.jpg" cloudsPath="/textures/venus_clouds.jpg" size={8} orbitRadius={140} speed={0.3} color="#ffccaa" hasAtmosphere themeColors={themeColors} />
      
      <EarthSystem orbitRadius={220} speed={0.25} themeColors={themeColors} />
      
      <DetailedPlanet name="Mars" texturePath="/textures/mars.jpg" size={6} orbitRadius={300} speed={0.2} color="#ff4422" moonsCount={2} themeColors={themeColors} />
      
      {/* The Asteroid Belt */}
      <AsteroidBeltLayer />
      
      {/* Interplanetary Medium */}
      <InterplanetaryMediumLayer />
      
      {/* Meteoroids */}
      <MeteoroidLayer />
      
      {/* Comets */}
      <Comet semiMajorAxis={500} eccentricity={0.7} inclination={0.2} speed={0.05} />
      <Comet semiMajorAxis={700} eccentricity={0.85} inclination={-0.3} speed={0.03} />
      <Comet semiMajorAxis={350} eccentricity={0.5} inclination={0.8} speed={0.08} />

      <DetailedPlanet name="Jupiter" texturePath="/textures/jupiter.jpg" size={25} orbitRadius={450} speed={0.08} color="#ddaa77" hasAtmosphere moonsCount={79} themeColors={themeColors} />
      <DetailedPlanet name="Saturn" texturePath="/textures/saturn.jpg" ringPath="/textures/saturn_ring.png" size={20} orbitRadius={600} speed={0.05} color="#eeddaa" moonsCount={82} themeColors={themeColors} />
      <DetailedPlanet name="Uranus" texturePath="/textures/uranus.jpg" size={14} orbitRadius={750} speed={0.03} color="#88ddff" hasAtmosphere moonsCount={27} themeColors={themeColors} />
      <DetailedPlanet name="Neptune" texturePath="/textures/neptune.jpg" size={13} orbitRadius={900} speed={0.02} color="#3355ff" hasAtmosphere moonsCount={14} themeColors={themeColors} />
    </group>
  );
};

// --------------------------------------------------------
// 5. Starfield Layer (With FPS Adaptive Scaling)
// --------------------------------------------------------
const StarfieldLayer = () => {
  const pointsRef = useRef();
  const [densityMultiplier, setDensityMultiplier] = useState(1.0);
  const frameTimes = useRef([]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      // Extremely slow drift for depth parallax
      pointsRef.current.rotation.y -= delta * 0.005;
      pointsRef.current.rotation.x += delta * 0.002;
    }

    if (delta > 0) {
      frameTimes.current.push(delta);
      if (frameTimes.current.length > 60) {
        const avgDelta = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
        const avgFps = 1 / avgDelta;
        
        if (avgFps < 40 && densityMultiplier > 0.2) {
          setDensityMultiplier(prev => Math.max(0.2, prev - 0.4));
          frameTimes.current = [];
        } else if (avgFps > 55 && densityMultiplier < 1.0 && frameTimes.current.length > 120) {
          setDensityMultiplier(prev => Math.min(1.0, prev + 0.2));
          frameTimes.current = [];
        } else {
          frameTimes.current.shift();
        }
      }
    }
  });

  const baseStarCount = 4000;
  const currentStarCount = Math.floor(baseStarCount * densityMultiplier);

  const positions = useMemo(() => {
    const pos = new Float32Array(currentStarCount * 3);
    const colors = new Float32Array(currentStarCount * 3);
    const colorObj = new THREE.Color();
    
    for (let i = 0; i < currentStarCount; i++) {
      // Spread stars in a massive volume to cover the expanded solar system
      pos[i * 3] = (Math.random() - 0.5) * 8000;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8000;
      pos[i * 3 + 2] = (Math.random() * -4000) + 1000; 

      // Give stars subtle variations in color (blueish to reddish)
      const starType = Math.random();
      if (starType > 0.9) colorObj.setHex(0xaabfff); // Hot blue
      else if (starType > 0.7) colorObj.setHex(0xffddaa); // Warm orange
      else colorObj.setHex(0xffffff); // White
      
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }
    return { pos, colors };
  }, [currentStarCount]);

  return (
    <points ref={pointsRef} name="starfield-layer">
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.pos.length / 3}
          array={positions.pos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={positions.colors.length / 3}
          array={positions.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        vertexColors
        size={1.5} 
        transparent 
        opacity={0.8} 
        sizeAttenuation 
      />
    </points>
  );
};

// --------------------------------------------------------
// Camera Rig for Smooth Planetary Transitions
// --------------------------------------------------------
const CameraRig = ({ orbitControlsRef }) => {
  const { focusedPlanet } = useContext(FocusContext);
  const v = new THREE.Vector3();
  const prevTarget = useRef(new THREE.Vector3());
  const isFlying = useRef(false);

  // Trigger cinematic flights when the focused planet changes
  useEffect(() => {
    isFlying.current = true;
    const timer = setTimeout(() => { isFlying.current = false; }, 2000);
    return () => clearTimeout(timer);
  }, [focusedPlanet]);

  useFrame((state, delta) => {
    if (!orbitControlsRef.current) return;
    
    if (focusedPlanet && focusedPlanet.ref.current) {
      focusedPlanet.ref.current.getWorldPosition(v);
      
      if (isFlying.current) {
        orbitControlsRef.current.enabled = false; // Disable to allow manual lerp
        
        // Smoothly fly to the planet
        orbitControlsRef.current.target.lerp(v, delta * 4);
        const offset = new THREE.Vector3(0, focusedPlanet.size * 4, focusedPlanet.size * 12);
        const targetCamPos = v.clone().add(offset);
        state.camera.position.lerp(targetCamPos, delta * 3);
      } else {
        orbitControlsRef.current.enabled = true; // Re-enable for user interaction
        
        // Instantly track moving planet without interrupting manual zoom/pan
        const deltaTarget = v.clone().sub(prevTarget.current);
        orbitControlsRef.current.target.copy(v);
        state.camera.position.add(deltaTarget);
      }
      prevTarget.current.copy(v);
    } else {
      // Fly back to overview (Sun)
      if (isFlying.current) {
        orbitControlsRef.current.enabled = false;
        
        orbitControlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), delta * 4);
        
        // Ensure overview is zoomed out
        const len = state.camera.position.length();
        if (len < 1200) {
           const dir = len > 0.1 ? state.camera.position.clone().divideScalar(len) : new THREE.Vector3(0, 1, 1).normalize();
           const targetCamPos = dir.multiplyScalar(1500);
           targetCamPos.y = Math.max(targetCamPos.y, 400); // Maintain a nice top-down angle
           state.camera.position.lerp(targetCamPos, delta * 3);
        }
      } else {
        orbitControlsRef.current.enabled = true;
      }
      prevTarget.current.set(0,0,0);
    }
  });

  return null;
};

// --------------------------------------------------------
// Main CoreVisualization Component (The Single WebGL Canvas)
// --------------------------------------------------------
export default function CoreVisualization() {
  const { theme } = useDesignSystem();
  const location = useLocation();
  const [focusedPlanet, setFocusedPlanet] = useState(null);
  const orbitControlsRef = useRef();
  
  const themeColors = useMemo(() => {
    if (!theme) {
      return {
        bgDeep: '#050510', bgPanel: '#111122', borderLight: '#333344',
        textPrimary: '#ffffff', accentBlue: '#0066ff', accentPurple: '#8800ff'
      };
    }
    const isDark = theme.name === 'Midnight';
    return {
      bgDeep: isDark ? '#08080C' : '#E8ECEF', bgPanel: isDark ? '#12121A' : '#F5F7F9',
      borderLight: isDark ? '#2A2A35' : '#D1D9E0', textPrimary: isDark ? '#F8F9FA' : '#1A1D20',
      accentBlue: isDark ? '#4F8AFF' : '#0055FF', accentPurple: isDark ? '#9D4EDD' : '#7209B7'
    };
  }, [theme?.name]);

  return (
    <FocusContext.Provider value={{ focusedPlanet, setFocusedPlanet }}>
      <div style={{ width: '100%', height: '100%', background: themeColors.bgDeep, overflow: 'hidden', position: 'relative' }}>
        
        {/* 2D Overlay: Close / Back Button */}
        {focusedPlanet && (
          <div className="absolute top-6 left-6 z-50">
            <button 
              onClick={() => setFocusedPlanet(null)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-105"
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--accent-blue)',
                color: 'var(--text-primary)',
                boxShadow: '0 0 15px rgba(0, 102, 255, 0.3)'
              }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              <span className="text-sm font-bold tracking-wide uppercase">Back to Overview</span>
            </button>
          </div>
        )}

        {/* 2D Overlay: Dashboard (Stationary) */}
        {focusedPlanet && focusedPlanet.name === 'Earth' && (
          <DashboardSpatial />
        )}

        <Canvas 
          dpr={[1, 1.5]} 
          camera={{ position: [0, 100, 250], fov: 45, far: 20000 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ pointerEvents: 'auto' }}
        >
          <OrbitControls 
            ref={orbitControlsRef} 
            enablePan={false} 
            enableZoom={true} 
            enableRotate={true} 
            minDistance={5} 
            maxDistance={4000} 
            zoomSpeed={1.5}
            makeDefault 
          />
          <CameraRig orbitControlsRef={orbitControlsRef} />
          
          <LightingLayer themeColors={themeColors} />
          <NebulaLayer themeColors={themeColors} />
          <StarfieldLayer />
          
          <React.Suspense fallback={null}>
            <SunLayer />
            <SolarSystemLayer themeColors={themeColors} />
            <EffectComposer multisampling={0}>
              <SMAA />
              <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur />
              <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
          </React.Suspense>
        </Canvas>
      </div>
    </FocusContext.Provider>
  );
}
