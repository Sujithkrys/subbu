"use client";

import React, { useState, useRef } from 'react';
import { 
  MousePointer2, Scissors, Trash2, Type, Crop, Palette,
  Undo2, Redo2, Play, Pause, StepBack, StepForward, 
  ZoomIn, ZoomOut, Maximize, Video, Mic, Type as TypeIcon,
  Eye, Volume2, Plus
} from 'lucide-react';

interface AdvancedTimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onPlayPause?: () => void;
  isPlaying?: boolean;
  project?: any;
  captions?: any[];
  activeCloneLang?: string | null;
}

export default function AdvancedTimeline({
  duration = 60,
  currentTime = 0,
  onSeek,
  onPlayPause,
  isPlaying = false,
  project,
  captions = [],
  activeCloneLang
}: AdvancedTimelineProps) {
  // Timeline State
  const [zoom, setZoom] = useState(1); // 1 = 10px per second, 10 = 100px per second
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'split'>('select');

  const pixelsPerSecond = 20 * zoom;
  const timelineWidth = Math.max(duration * pixelsPerSecond, 1000);

  // Tools
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'split', icon: Scissors, label: 'Split' },
    { id: 'delete', icon: Trash2, label: 'Delete' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'crop', icon: Crop, label: 'Crop' },
    { id: 'color', icon: Palette, label: 'Color' },
  ];

  // Ruler markings
  const renderRuler = () => {
    const marks = [];
    const step = zoom > 2 ? 1 : zoom > 1 ? 5 : 10; // Seconds per mark based on zoom
    
    for (let i = 0; i <= duration; i += step) {
      const left = i * pixelsPerSecond;
      const mins = Math.floor(i / 60).toString().padStart(2, '0');
      const secs = (i % 60).toString().padStart(2, '0');
      
      marks.push(
        <div key={i} className="absolute top-0 bottom-0 border-l border-white/10" style={{ left: `${left}px` }}>
          <span className="absolute top-1 -translate-x-1/2 text-[10px] text-gray-400 select-none">
            {mins}:{secs}:00
          </span>
          <div className="absolute bottom-0 w-px h-2 bg-white/20" />
        </div>
      );
      
      if (step > 1) {
        for (let j = 1; j < step; j++) {
          if (i + j <= duration) {
            marks.push(
              <div 
                key={`${i}-${j}`} 
                className="absolute bottom-0 w-px h-1 bg-white/10" 
                style={{ left: `${(i + j) * pixelsPerSecond}px` }} 
              />
            );
          }
        }
      }
    }
    return marks;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + workspaceRef.current.scrollLeft;
    const time = Math.max(0, Math.min(x / pixelsPerSecond, duration));
    onSeek(time);
  };

  return (
    <div className="flex flex-col w-full h-[320px] bg-[#121216] border-t border-[#2A2A35] text-white overflow-hidden select-none">
      
      {/* 1. Toolbar */}
      <div className="flex items-center justify-between px-4 h-12 bg-[#1A1A24] border-b border-[#2A2A35]">
        
        {/* Left: Tools */}
        <div className="flex items-center gap-1">
          <div className="flex gap-1 border-r border-white/10 pr-2 mr-2">
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
              <Undo2 size={16} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
              <Redo2 size={16} />
            </button>
          </div>
          
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={`p-1.5 rounded transition-colors ${
                activeTool === tool.id 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={tool.label}
            >
              <tool.icon size={16} />
            </button>
          ))}
        </div>
        
        {/* Center: Playback */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-full transition-colors border border-green-400/30">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
          </button>
          <button className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors">
            <StepBack size={18} fill="currentColor" />
          </button>
          <button 
            onClick={onPlayPause}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors">
            <StepForward size={18} fill="currentColor" />
          </button>
        </div>
        
        {/* Right: Zoom & Settings */}
        <div className="flex items-center gap-3">
          <button className="p-1 text-gray-400 hover:text-white"><ZoomOut size={16} /></button>
          <input 
            type="range" 
            min="0.5" max="10" step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <button className="p-1 text-gray-400 hover:text-white"><ZoomIn size={16} /></button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
            <Maximize size={16} />
          </button>
        </div>
      </div>
      
      {/* 2. Timeline Grid area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Track Headers */}
        <div className="w-48 bg-[#1A1A24] border-r border-[#2A2A35] flex flex-col z-20 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
          {/* Ruler spacer */}
          <div className="h-8 border-b border-[#2A2A35]" />
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
            {/* Video Track */}
            <div className="h-20 border-b border-[#2A2A35] flex flex-col justify-center px-3 gap-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <div className="flex items-center gap-2">
                  <Video size={14} /> Video 1
                </div>
                <div className="flex gap-1.5">
                  <Eye size={14} className="hover:text-white cursor-pointer" />
                </div>
              </div>
            </div>
            
            {/* Audio Track */}
            <div className="h-20 border-b border-[#2A2A35] flex flex-col justify-center px-3 gap-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <div className="flex items-center gap-2">
                  <Mic size={14} /> Audio 1
                </div>
                <div className="flex gap-1.5">
                  <Volume2 size={14} className="hover:text-white cursor-pointer" />
                </div>
              </div>
            </div>
            
            {/* Captions Track */}
            <div className="h-16 border-b border-[#2A2A35] flex flex-col justify-center px-3 gap-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <div className="flex items-center gap-2">
                  <TypeIcon size={14} /> Captions
                </div>
                <div className="flex gap-1.5">
                  <Eye size={14} className="hover:text-white cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Workspace (Scrollable) */}
        <div 
          ref={workspaceRef}
          className="flex-1 overflow-auto bg-[#121216] relative custom-scrollbar"
          onClick={handleTimelineClick}
        >
          <div className="relative" style={{ width: `${timelineWidth}px`, minHeight: '100%' }}>
            
            {/* Ruler Header */}
            <div className="sticky top-0 h-8 border-b border-[#2A2A35] bg-[#1A1A24]/90 backdrop-blur z-10 w-full overflow-hidden">
              {renderRuler()}
            </div>
            
            {/* Tracks Container */}
            <div className="relative w-full pt-2">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                   style={{ backgroundSize: `${pixelsPerSecond}px 100%`, backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px)' }} 
              />
              
              {/* Track 1: Video */}
              <div className="h-20 border-b border-[#2A2A35] relative flex items-center">
                {project ? (
                  <div 
                    className="absolute h-14 bg-[#2A2E44] border border-[#444A6B] rounded-md cursor-pointer hover:border-[#6672A3] transition-colors overflow-hidden flex items-center px-2 shadow-md"
                    style={{ left: 0, width: `${duration * pixelsPerSecond}px` }}
                  >
                    <span className="text-[10px] text-gray-300 font-medium truncate">{project.title || 'Video Source.mp4'}</span>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center h-full">
                    <span className="text-gray-600 text-xs flex items-center gap-2"><Plus size={14}/> Drag media here</span>
                  </div>
                )}
              </div>
              
              {/* Track 2: Audio */}
              <div className="h-20 border-b border-[#2A2A35] relative flex items-center">
                {activeCloneLang ? (
                  <div 
                    className="absolute h-14 bg-[#1E362D] border border-[#2D5545] rounded-md cursor-pointer hover:border-[#427A63] transition-colors overflow-hidden flex flex-col justify-center px-2 shadow-md"
                    style={{ left: 0, width: `${duration * pixelsPerSecond}px` }}
                  >
                    <span className="text-[10px] text-green-400 font-medium truncate">Dubbed Audio ({activeCloneLang})</span>
                    <div className="w-full h-4 mt-1 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjEwIj48cmVjdCB4PSIxIiB5PSIyIiB3aWR0aD0iMiIgaGVpZ2h0PSI2IiBmaWxsPSIjNGNhZjdkIi8+PC9zdmc+')] bg-repeat-x" />
                  </div>
                ) : null}
              </div>
              
              {/* Track 3: Captions */}
              <div className="h-16 border-b border-[#2A2A35] relative flex items-center">
                {captions.map((c, i) => (
                  <div
                    key={i}
                    className="absolute h-10 bg-[#7469B6]/30 border border-[#7469B6] rounded cursor-pointer hover:bg-[#7469B6]/50 transition-colors flex items-center justify-center shadow-sm overflow-hidden group"
                    style={{ 
                      left: `${c.start * pixelsPerSecond}px`, 
                      width: `${(c.end - c.start) * pixelsPerSecond}px` 
                    }}
                  >
                    <span className="text-[9px] text-white truncate px-1">{c.text}</span>
                    <div className="absolute left-0 top-0 bottom-0 w-2 opacity-0 group-hover:opacity-100 hover:bg-white/40 cursor-ew-resize rounded-l" />
                    <div className="absolute right-0 top-0 bottom-0 w-2 opacity-0 group-hover:opacity-100 hover:bg-white/40 cursor-ew-resize rounded-r" />
                  </div>
                ))}
              </div>
              
            </div>
            
            {/* Playhead Scrubber */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none transition-all duration-75 ease-linear"
              style={{ left: `${currentTime * pixelsPerSecond}px`, height: '100%' }}
            >
              <div className="absolute -top-0 -translate-x-1/2 w-[11px] h-[15px] bg-red-500 rounded-b pointer-events-auto flex justify-center pt-1 shadow-md">
                <div className="w-0.5 h-1.5 bg-white/50 rounded-full" />
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
    </div>
  );
}
