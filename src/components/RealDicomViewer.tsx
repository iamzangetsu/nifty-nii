import React, { useState, useEffect, useRef } from 'react';
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

interface RealDicomViewerProps {
  studyUid: string;
  className?: string;
}

interface ViewportProps {
  title: string;
  studyUid: string;
  view: 'axial' | 'coronal' | 'sagittal' | '3d';
  isActive: boolean;
  onClick: () => void;
}

interface DicomImage {
  imageId: string;
  instanceNumber: number;
  url: string;
}

const Viewport: React.FC<ViewportProps> = ({ title, studyUid, view, isActive, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<DicomImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadDicomImages();
  }, [studyUid]);

  useEffect(() => {
    if (images.length > 0) {
      renderCurrentImage();
    }
  }, [images, currentImageIndex, zoom, pan]);

  useEffect(() => {
    if (isPlaying && view !== '3d' && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isPlaying, view, images.length]);

  const loadDicomImages = async () => {
    try {
      setIsLoading(true);
      
      // Fetch series data
      const seriesResponse = await fetch(`http://localhost:9999/studies/${studyUid}/series`);
      const seriesData = await seriesResponse.json();
      
      if (seriesData.length === 0) {
        throw new Error('No series found');
      }

      const seriesUid = seriesData[0]['0020000E'].Value[0];
      
      // Fetch instances metadata
      const instancesResponse = await fetch(`http://localhost:9999/studies/${studyUid}/series/${seriesUid}/metadata`);
      const instancesData = await instancesResponse.json();

      const dicomImages: DicomImage[] = instancesData.map((instance: any, index: number) => ({
        imageId: instance['00080018'].Value[0],
        instanceNumber: instance['00200013']?.Value[0] || index + 1,
        url: instance['00081190'].Value[0].replace('wadouri:', ''),
      }));

      // Sort by instance number
      dicomImages.sort((a, b) => a.instanceNumber - b.instanceNumber);
      setImages(dicomImages);
      setCurrentImageIndex(Math.floor(dicomImages.length / 2)); // Start in middle
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load DICOM images:', error);
      setIsLoading(false);
    }
  };

  const renderCurrentImage = async () => {
    if (!canvasRef.current || images.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentImage = images[currentImageIndex];
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Calculate image dimensions with zoom and pan
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight;
        if (imgAspect > canvasAspect) {
          drawWidth = canvas.width * zoom;
          drawHeight = (canvas.width / imgAspect) * zoom;
        } else {
          drawWidth = (canvas.height * imgAspect) * zoom;
          drawHeight = canvas.height * zoom;
        }
        
        const x = (canvas.width - drawWidth) / 2 + pan.x;
        const y = (canvas.height - drawHeight) / 2 + pan.y;
        
        // Draw image
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        // Add crosshair for medical imaging
        if (view !== '3d') {
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, 0);
          ctx.lineTo(canvas.width / 2, canvas.height);
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      };
      
      img.onerror = () => {
        // Fallback: draw placeholder
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DICOM Image Loading...', canvas.width / 2, canvas.height / 2);
      };
      
      img.src = currentImage.url;
    } catch (error) {
      console.error('Error rendering image:', error);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    
    if (e.ctrlKey) {
      // Zoom
      setZoom(prev => Math.max(0.1, Math.min(5, prev + delta * 0.1)));
    } else {
      // Scroll through images
      if (images.length > 1) {
        setCurrentImageIndex(prev => {
          const newIndex = prev + delta;
          return Math.max(0, Math.min(images.length - 1, newIndex));
        });
      }
    }
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
            {view !== '3d' && images.length > 1 && (
              <>
                <span className="text-xs">
                  {currentImageIndex + 1}/{images.length}
                </span>
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
          {/* DICOM Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onWheel={handleWheel}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Slice Navigation for 2D views */}
          {view !== '3d' && images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
              <input
                type="range"
                min="0"
                max={images.length - 1}
                value={currentImageIndex}
                onChange={(e) => setCurrentImageIndex(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Image Info Overlay */}
          <div className="absolute bottom-2 left-2 text-white text-xs space-y-1 bg-black/50 p-2 rounded">
            <div>Study: {studyUid}</div>
            <div>Zoom: {Math.round(zoom * 100)}%</div>
            {images.length > 0 && <div>Instance: {images[currentImageIndex]?.instanceNumber}</div>}
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

export const RealDicomViewer: React.FC<RealDicomViewerProps> = ({ studyUid, className }) => {
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
          <h3 className="font-semibold">Real DICOM Viewer</h3>
          <span className="text-sm text-muted-foreground">Study: {studyUid}</span>
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
            studyUid={studyUid}
            view={viewport.view}
            isActive={activeViewport === viewport.id}
            onClick={() => setActiveViewport(viewport.id)}
          />
        ))}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted text-sm text-muted-foreground border-t">
        <div>Active Tool: {Object.entries(tools).find(([_, active]) => active)?.[0] || 'None'}</div>
        <div>Connected to: localhost:9999</div>
      </div>
    </div>
  );
};