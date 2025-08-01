import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Square, 
  Settings,
  Maximize2,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DicomViewerProps {
  studyId: string;
  className?: string;
}

interface ViewportProps {
  title: string;
  studyId: string;
  view: 'axial' | 'coronal' | 'sagittal' | '3d';
  isActive: boolean;
  onClick: () => void;
}

const Viewport: React.FC<ViewportProps> = ({ title, studyId, view, isActive, onClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sliceIndex, setSliceIndex] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Simulate loading DICOM data
    const timer = setTimeout(() => setIsLoading(false), 1000 + Math.random() * 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPlaying && view !== '3d') {
      const interval = setInterval(() => {
        setSliceIndex(prev => (prev + 1) % 100);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, view]);

  const handleSliceChange = (delta: number) => {
    setSliceIndex(prev => Math.max(0, Math.min(99, prev + delta)));
  };

  return (
    <Card 
      className={cn(
        "relative h-full min-h-[300px] bg-black border-2 transition-[var(--transition-medical)] cursor-pointer overflow-hidden",
        isActive ? "border-primary shadow-[var(--shadow-medical)]" : "border-border"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/70 text-white p-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{title}</span>
          <div className="flex items-center space-x-1">
            {view !== '3d' && (
              <>
                <span className="text-xs">Slice: {sliceIndex + 1}/100</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(!isPlaying);
                  }}
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading DICOM data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Simulated Medical Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Cross-hair for medical imaging */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-32 border border-primary/30 rounded-full">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30"></div>
                {/* Simulated anatomical structure */}
                <div className="absolute top-4 left-4 right-4 bottom-4 border border-white/20 rounded-full">
                  {view === '3d' && (
                    <div className="absolute inset-2 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Slice Navigation for 2D views */}
          {view !== '3d' && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
              <input
                type="range"
                min="0"
                max="99"
                value={sliceIndex}
                onChange={(e) => setSliceIndex(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Image Info Overlay */}
          <div className="absolute bottom-2 left-2 text-white text-xs space-y-1 bg-black/50 p-2 rounded">
            <div>Study: {studyId}</div>
            <div>WW: 400 WL: 40</div>
            {view !== '3d' && <div>Thickness: 1.0mm</div>}
          </div>
        </>
      )}

      {/* Active Border Indicator */}
      {isActive && (
        <div className="absolute inset-0 border-2 border-primary pointer-events-none"></div>
      )}
    </Card>
  );
};

export const DicomViewer: React.FC<DicomViewerProps> = ({ studyId, className }) => {
  const [activeViewport, setActiveViewport] = useState<string>('axial');
  const [tools, setTools] = useState({
    zoom: false,
    pan: false,
    windowing: false,
  });

  const viewports = [
    { id: 'axial', title: 'Axial', view: 'axial' as const },
    { id: 'coronal', title: 'Coronal', view: 'coronal' as const },
    { id: 'sagittal', title: 'Sagittal', view: 'sagittal' as const },
    { id: '3d', title: '3D Volume', view: '3d' as const },
  ];

  const toggleTool = (tool: keyof typeof tools) => {
    setTools(prev => ({
      ...prev,
      [tool]: !prev[tool],
    }));
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-card border-b shadow-[var(--shadow-panel)]">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">DICOM Viewer</h3>
          <span className="text-sm text-muted-foreground">Study: {studyId}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant={tools.zoom ? "default" : "ghost"}
            size="sm"
            onClick={() => toggleTool('zoom')}
            className="h-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant={tools.pan ? "default" : "ghost"}
            size="sm"
            onClick={() => toggleTool('pan')}
            className="h-8"
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant={tools.windowing ? "default" : "ghost"}
            size="sm"
            onClick={() => toggleTool('windowing')}
            className="h-8"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Viewport Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-2">
        {viewports.map((viewport) => (
          <Viewport
            key={viewport.id}
            title={viewport.title}
            studyId={studyId}
            view={viewport.view}
            isActive={activeViewport === viewport.id}
            onClick={() => setActiveViewport(viewport.id)}
          />
        ))}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted text-sm text-muted-foreground border-t">
        <div>Active Tool: {Object.entries(tools).find(([_, active]) => active)?.[0] || 'None'}</div>
        <div>Mouse: (0, 0) | Zoom: 100%</div>
      </div>
    </div>
  );
};