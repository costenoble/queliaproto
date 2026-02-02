
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, Save, RotateCcw, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ConfigPanel = ({ onConfigChange, isOpen, onToggle }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    dataUrl: '',
    mapCenter: [-74.5, 40],
    mapZoom: 9
  });

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('mapConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Only load supported fields
        setConfig(prev => ({
          ...prev,
          dataUrl: parsed.dataUrl || '',
          mapCenter: parsed.mapCenter || [-74.5, 40],
          mapZoom: parsed.mapZoom || 9
        }));
        
        if (onConfigChange) {
          onConfigChange(parsed);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('mapConfig', JSON.stringify(config));

    // Notify parent
    if (onConfigChange) {
      onConfigChange(config);
    }

    toast({
      title: "Settings Saved",
      description: "Your configuration has been saved successfully.",
    });
  };

  const handleReset = () => {
    const defaultConfig = {
      dataUrl: '',
      mapCenter: [-74.5, 40],
      mapZoom: 9
    };
    
    setConfig(defaultConfig);
    localStorage.removeItem('mapConfig');
    
    if (onConfigChange) {
      onConfigChange(defaultConfig);
    }

    toast({
      title: "Settings Reset",
      description: "Configuration has been reset to defaults.",
    });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 right-4 z-50 bg-white text-gray-900 p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="Toggle settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed lg:relative top-0 right-0 h-full bg-white shadow-xl
          w-80 flex flex-col z-40 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Configuration</h2>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-gray-500 hover:text-gray-700"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Data URL */}
          <div className="space-y-2">
            <Label htmlFor="dataUrl" className="text-gray-700 font-medium">
              JSON Data Source URL (Optional)
            </Label>
            <input
              id="dataUrl"
              type="url"
              value={config.dataUrl}
              onChange={(e) => setConfig({ ...config, dataUrl: e.target.value })}
              placeholder="https://api.example.com/pois.json"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500">Leave empty to use built-in mock data</p>
          </div>

          {/* Map Center */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Map Center</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="lng" className="text-xs text-gray-600">Longitude</Label>
                <input
                  id="lng"
                  type="number"
                  step="0.1"
                  value={config.mapCenter[0]}
                  onChange={(e) => setConfig({
                    ...config,
                    mapCenter: [parseFloat(e.target.value) || 0, config.mapCenter[1]]
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="lat" className="text-xs text-gray-600">Latitude</Label>
                <input
                  id="lat"
                  type="number"
                  step="0.1"
                  value={config.mapCenter[1]}
                  onChange={(e) => setConfig({
                    ...config,
                    mapCenter: [config.mapCenter[0], parseFloat(e.target.value) || 0]
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Map Zoom */}
          <div className="space-y-2">
            <Label htmlFor="zoom" className="text-gray-700 font-medium">
              Map Zoom Level: {config.mapZoom}
            </Label>
            <input
              id="zoom"
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={config.mapZoom}
              onChange={(e) => setConfig({ ...config, mapZoom: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>World</span>
              <span>Street</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <Button
            onClick={handleSave}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </div>
    </>
  );
};

export default ConfigPanel;
