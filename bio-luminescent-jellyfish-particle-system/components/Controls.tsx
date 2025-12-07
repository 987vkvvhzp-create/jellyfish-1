import React, { useState } from 'react';
import { Camera, Maximize, Palette, Sparkles, AlertCircle, Grid, Cpu } from 'lucide-react';
import { JellyfishConfig, CameraStatus } from '../types';

interface ControlsProps {
  currentConfig: JellyfishConfig;
  presets: JellyfishConfig[];
  cameraStatus: CameraStatus;
  handTension: number;
  onPresetSelect: (config: JellyfishConfig) => void;
  onColorChange: (color: string) => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  currentConfig, 
  presets,
  cameraStatus, 
  handTension,
  onPresetSelect,
  onColorChange,
  onGenerate,
  isGenerating
}) => {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'generate'>('library');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/30 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <h1 className="text-white text-3xl font-light tracking-wider opacity-90 drop-shadow-md">
            BIO<span className="font-bold text-cyan-400">LUMEN</span>
          </h1>
          <p className="text-cyan-200/60 text-xs mt-1 max-w-xs uppercase tracking-widest">
            Kinetic Particle System
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
            cameraStatus === CameraStatus.ACTIVE 
              ? 'border-green-500/50 bg-green-900/20 text-green-400' 
              : 'border-red-500/50 bg-red-900/20 text-red-400'
          } backdrop-blur-sm transition-all`}>
            {cameraStatus === CameraStatus.ACTIVE ? <Camera size={18} /> : <AlertCircle size={18} />}
            <span className="text-xs font-mono uppercase hidden md:block">
              {cameraStatus === CameraStatus.ACTIVE ? 'Camera Linked' : 'No Input'}
            </span>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Tension Meter Feedback */}
      <div className="absolute right-6 top-24 pointer-events-none flex flex-col gap-2 items-end">
        <div className="text-[10px] uppercase text-white/40 tracking-widest">Tension Level</div>
        <div className="w-2 h-32 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
          <div 
            className="w-full bg-gradient-to-t from-cyan-500 to-purple-500 transition-all duration-100 ease-out"
            style={{ height: `${handTension * 100}%`, marginTop: `${(1-handTension)*100}%` }}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col lg:flex-row gap-6 items-end pointer-events-auto w-full max-w-6xl mx-auto">
        
        {/* Main Control Panel */}
        <div className="flex-1 w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
          
          {/* Tab Sidebar */}
          <div className="flex md:flex-col border-b md:border-b-0 md:border-r border-white/10">
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex-1 md:flex-none p-4 flex flex-col items-center gap-2 transition-colors ${activeTab === 'library' ? 'bg-white/10 text-cyan-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Grid size={20} />
              <span className="text-[10px] uppercase font-bold tracking-wider">Library</span>
            </button>
            <button 
              onClick={() => setActiveTab('generate')}
              className={`flex-1 md:flex-none p-4 flex flex-col items-center gap-2 transition-colors ${activeTab === 'generate' ? 'bg-white/10 text-purple-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Cpu size={20} />
              <span className="text-[10px] uppercase font-bold tracking-wider">AI Lab</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-5 min-h-[200px]">
            
            {/* Library Tab */}
            {activeTab === 'library' && (
              <div className="h-full">
                <div className="text-xs text-white/50 uppercase tracking-widest mb-4">Select Model</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {presets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => onPresetSelect(preset)}
                      className={`relative group overflow-hidden rounded-xl border transition-all duration-300 text-left p-3 h-24 flex flex-col justify-end
                        ${currentConfig.id === preset.id 
                          ? 'border-cyan-500 bg-cyan-500/20' 
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
                    >
                      <div 
                        className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity"
                        style={{ background: `radial-gradient(circle at center, ${preset.color}, transparent)` }}
                      />
                      <div className="relative z-10">
                        <div className="font-bold text-white text-sm group-hover:text-cyan-200 transition-colors">{preset.name}</div>
                        <div className="text-[10px] text-white/50 truncate">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Lab Tab */}
            {activeTab === 'generate' && (
              <div className="h-full flex flex-col">
                <div className="text-xs text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Generate New Species <Sparkles size={12} className="text-purple-400" />
                </div>
                <div className="relative flex-1 flex flex-col justify-center gap-4">
                  <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., A giant electric blue pulsating supernova jellyfish..."
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && onGenerate(prompt)}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => onGenerate(prompt)}
                      disabled={isGenerating || !prompt}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2"
                    >
                      {isGenerating ? 'Synthesizing...' : 'Generate Model'}
                      {!isGenerating && <Sparkles size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Style Controls (Color) */}
        <div className="w-full lg:w-64 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between text-cyan-100/80">
            <div className="flex items-center gap-2">
              <Palette size={16} />
              <span className="text-xs uppercase tracking-widest font-semibold">Pigment</span>
            </div>
            <div 
              className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]"
              style={{ backgroundColor: currentConfig.color, color: currentConfig.color }}
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {['#00ffff', '#ff00ff', '#ff3333', '#ffff00', '#00ff00', '#ffffff', '#aa00ff', '#ff8800', '#0000ff', '#00ffaa'].map(c => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`aspect-square rounded-md transition-all hover:scale-110 ${currentConfig.color === c ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          
          <div className="mt-2 pt-4 border-t border-white/10 text-[10px] text-white/30 font-mono">
            <div>CORE: {currentConfig.coreRadius.toFixed(1)}</div>
            <div>SPREAD: {currentConfig.tentacleSpread.toFixed(1)}</div>
            <div>PARTICLES: {currentConfig.particleCount}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Controls;