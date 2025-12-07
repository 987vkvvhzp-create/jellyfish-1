import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import JellyfishParticles from './components/JellyfishParticles';
import Controls from './components/Controls';
import CameraInput from './components/CameraInput';
import { generateJellyfishModel } from './services/geminiService';
import { JellyfishConfig, CameraStatus } from './types';

// Predefined Models
const PRESETS: JellyfishConfig[] = [
  {
    id: 'neon-pulse',
    name: 'Neon Pulse',
    description: 'Cyberpunk electric blue structure',
    color: '#00ffff',
    coreRadius: 1.2,
    tentacleLength: 4.5,
    tentacleSpread: 0.6,
    particleCount: 3000,
    movementSpeed: 1.2,
    noiseStrength: 0.6
  },
  {
    id: 'deep-void',
    name: 'Deep Void',
    description: 'Bioluminescent deep sea phantom',
    color: '#4455ff',
    coreRadius: 0.8,
    tentacleLength: 7.0,
    tentacleSpread: 0.4,
    particleCount: 2000,
    movementSpeed: 0.6,
    noiseStrength: 0.3
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    description: 'Aggressive radioactive plasma',
    color: '#ff3300',
    coreRadius: 1.5,
    tentacleLength: 3.0,
    tentacleSpread: 1.2,
    particleCount: 4000,
    movementSpeed: 2.0,
    noiseStrength: 0.9
  },
  {
    id: 'zen-spirit',
    name: 'Zen Spirit',
    description: 'Peaceful drifting pastel entity',
    color: '#e0b0ff',
    coreRadius: 1.0,
    tentacleLength: 5.0,
    tentacleSpread: 0.8,
    particleCount: 2500,
    movementSpeed: 0.8,
    noiseStrength: 0.4
  }
];

const App: React.FC = () => {
  const [config, setConfig] = useState<JellyfishConfig>(PRESETS[0]);
  const [handTension, setHandTension] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>(CameraStatus.IDLE);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Smooth the tension input for visual stability
  const handleTensionUpdate = useCallback((rawTension: number) => {
    // rawTension is 0-1 based on motion.
    // 0 = Still (Closed), 1 = Active (Open/Tense)
    setHandTension(prev => prev + (rawTension - prev) * 0.1);
  }, []);

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const newConfig = await generateJellyfishModel(prompt);
      setConfig(newConfig);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePresetSelect = (preset: JellyfishConfig) => {
    setConfig(preset);
  };

  const handleColorChange = (color: string) => {
    setConfig(prev => ({ ...prev, color }));
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={['#020205']} />
        
        <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color={config.color} distance={50} decay={2} />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="blue" />
        
        <JellyfishParticles 
          config={config} 
          handTension={handTension} 
        />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minDistance={5} 
          maxDistance={25} 
          autoRotate={handTension < 0.2} // Auto rotate only when calm
          autoRotateSpeed={0.8}
        />
      </Canvas>

      {/* Vision Input (Hidden) */}
      <CameraInput 
        onUpdate={handleTensionUpdate}
        onStatusChange={setCameraStatus}
      />

      {/* UI Overlay */}
      <Controls 
        currentConfig={config}
        presets={PRESETS}
        cameraStatus={cameraStatus}
        handTension={handTension}
        onPresetSelect={handlePresetSelect}
        onColorChange={handleColorChange}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      {/* Fallback Instruction if Camera Denied */}
      {cameraStatus === CameraStatus.DENIED && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/80 text-white px-6 py-3 rounded-xl text-sm border border-red-500/50 backdrop-blur-md shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Camera access denied. Motion gestures disabled.
        </div>
      )}
    </div>
  );
};

export default App;