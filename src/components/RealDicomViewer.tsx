import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowLeft } from 'lucide-react';

interface RealDicomViewerProps {
  studyUid: string;
  className?: string;
}

export const RealDicomViewer: React.FC<RealDicomViewerProps> = ({ studyUid }) => {
  const ohifUrl = `http://localhost:3000/viewer?StudyInstanceUIDs=${studyUid}&datasources=fastapi`;

  const openInOHIF = () => {
    window.open(ohifUrl, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* OHIF Integration Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div>
          <h3 className="text-lg font-semibold">OHIF DICOM Viewer</h3>
          <p className="text-sm text-muted-foreground">Study: {studyUid}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={openInOHIF}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in OHIF Viewer</span>
          </Button>
        </div>
      </div>

      {/* Embedded OHIF Viewer */}
      <div className="flex-1 relative">
        <iframe
          src={ohifUrl}
          className="w-full h-full border-0"
          title="OHIF DICOM Viewer"
          allow="cross-origin-isolated"
        />
        
        {/* Overlay with instructions */}
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">OHIF Viewer Ready</h3>
              <p className="text-muted-foreground">
                Your DICOM study is ready to view in the professional OHIF viewer.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={openInOHIF}
                size="lg"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Launch OHIF Viewer
              </Button>
              
              <div className="text-xs text-muted-foreground">
                Opens in new window: localhost:3000
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};