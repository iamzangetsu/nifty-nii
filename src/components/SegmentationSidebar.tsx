import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SegmentationClass {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  opacity: number;
  count?: number;
}

interface SegmentationSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSegmentationChange: (classId: string, visible: boolean, opacity: number) => void;
  studyUid?: string;
}

const SEGMENTATION_CLASSES: SegmentationClass[] = [
  {
    id: 'mandible',
    name: 'Mandible',
    color: 'hsl(var(--seg-mandible))',
    visible: true,
    opacity: 70,
    count: 1247,
  },
  {
    id: 'nerve',
    name: 'Inferior Alveolar Nerve',
    color: 'hsl(var(--seg-nerve))',
    visible: true,
    opacity: 80,
    count: 892,
  },
  {
    id: 'teeth',
    name: 'Teeth',
    color: 'hsl(var(--seg-teeth))',
    visible: false,
    opacity: 60,
    count: 2156,
  },
  {
    id: 'maxilla',
    name: 'Maxilla',
    color: 'hsl(var(--seg-maxilla))',
    visible: true,
    opacity: 65,
    count: 1834,
  },
  {
    id: 'bone',
    name: 'Cortical Bone',
    color: 'hsl(var(--seg-bone))',
    visible: false,
    opacity: 50,
    count: 3421,
  },
  {
    id: 'soft-tissue',
    name: 'Soft Tissue',
    color: 'hsl(var(--seg-soft-tissue))',
    visible: false,
    opacity: 40,
    count: 5673,
  },
];

export const SegmentationSidebar: React.FC<SegmentationSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onSegmentationChange,
  studyUid,
}) => {
  const [classes, setClasses] = useState<SegmentationClass[]>(SEGMENTATION_CLASSES);
  const [globalOpacity, setGlobalOpacity] = useState(70);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (studyUid) {
      console.log('Loading segmentation classes for study:', studyUid);
      // Future: Load real segmentation classes from backend
    }
  }, [studyUid]);

  const updateClass = (id: string, updates: Partial<SegmentationClass>) => {
    setClasses(prev => 
      prev.map(cls => 
        cls.id === id 
          ? { ...cls, ...updates }
          : cls
      )
    );
    
    const updatedClass = classes.find(cls => cls.id === id);
    if (updatedClass) {
      onSegmentationChange(
        id, 
        updates.visible ?? updatedClass.visible, 
        updates.opacity ?? updatedClass.opacity
      );
    }
  };

  const toggleVisibility = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (cls) {
      updateClass(id, { visible: !cls.visible });
    }
  };

  const updateOpacity = (id: string, opacity: number) => {
    updateClass(id, { opacity });
  };

  const toggleShowAll = () => {
    const newShowAll = !showAll;
    setShowAll(newShowAll);
    setClasses(prev => 
      prev.map(cls => ({ ...cls, visible: newShowAll }))
    );
    classes.forEach(cls => {
      onSegmentationChange(cls.id, newShowAll, cls.opacity);
    });
  };

  const applyGlobalOpacity = () => {
    setClasses(prev => 
      prev.map(cls => ({ ...cls, opacity: globalOpacity }))
    );
    classes.forEach(cls => {
      onSegmentationChange(cls.id, cls.visible, globalOpacity);
    });
  };

  const visibleCount = classes.filter(cls => cls.visible).length;

  return (
    <Card className={cn(
      "h-full transition-[width,var(--transition-medical)] shadow-[var(--shadow-panel)] flex flex-col",
      isCollapsed ? "w-12" : "w-80"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-accent/50">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Segmentation</h3>
            <Badge variant="secondary" className="text-xs">
              {visibleCount}/{classes.length}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* Global Controls */}
          <div className="p-3 space-y-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Global Controls</span>
              <Button variant="ghost" size="sm" onClick={toggleShowAll}>
                {showAll ? 'Hide All' : 'Show All'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Global Opacity</span>
                <span className="text-xs text-muted-foreground">{globalOpacity}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[globalOpacity]}
                  onValueChange={(value) => setGlobalOpacity(value[0])}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyGlobalOpacity}
                  className="text-xs h-6 px-2"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Segmentation Classes */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Anatomical Structures</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="space-y-2">
                    {/* Class Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded border border-border flex-shrink-0"
                          style={{ 
                            backgroundColor: cls.color,
                            opacity: cls.visible ? cls.opacity / 100 : 0.3
                          }}
                        />
                        <span className="text-sm font-medium">{cls.name}</span>
                        {cls.count && (
                          <Badge variant="outline" className="text-xs">
                            {cls.count.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(cls.id)}
                        className="h-6 w-6"
                      >
                        {cls.visible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>

                    {/* Opacity Control */}
                    {cls.visible && (
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Opacity</span>
                          <span className="text-xs text-muted-foreground">{cls.opacity}%</span>
                        </div>
                        <Slider
                          value={[cls.opacity]}
                          onValueChange={(value) => updateOpacity(cls.id, value[0])}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/20">
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Structures:</span>
                <span>{classes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Visible:</span>
                <span>{visibleCount}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="flex-1 p-1 space-y-1">
          {classes.slice(0, 6).map((cls) => (
            <Button
              key={cls.id}
              variant="ghost"
              size="icon"
              onClick={() => toggleVisibility(cls.id)}
              className={cn(
                "h-8 w-8 p-0",
                cls.visible && "bg-accent"
              )}
              title={cls.name}
            >
              <div
                className="w-4 h-4 rounded border border-border"
                style={{ 
                  backgroundColor: cls.color,
                  opacity: cls.visible ? cls.opacity / 100 : 0.3
                }}
              />
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};