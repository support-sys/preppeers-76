/**
 * Development Wrapper Component
 * Provides development tools and debugging features
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bug, Eye, EyeOff } from 'lucide-react';
import DevDashboard from './DevDashboard';
import { devUtils } from '@/utils/devUtils';

interface DevWrapperProps {
  children: React.ReactNode;
}

const DevWrapper = ({ children }: DevWrapperProps) => {
  const [showDevTools, setShowDevTools] = useState(false);
  const [devButtonVisible, setDevButtonVisible] = useState(false);

  useEffect(() => {
    // Only show dev tools in development mode
    if (devUtils.isDevelopment) {
      setDevButtonVisible(true);
      
      // Add keyboard shortcut (Ctrl+Shift+D) to toggle dev tools
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
          event.preventDefault();
          setShowDevTools(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Log component renders in development
  useEffect(() => {
    if (devUtils.isDevelopment && devUtils.isDebugMode) {
      devUtils.devLog('DevWrapper mounted');
    }
  }, []);

  if (!devUtils.isDevelopment) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Development Tools Toggle Button */}
      {devButtonVisible && (
        <div className="fixed top-4 right-4 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDevTools(!showDevTools)}
            className="bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {showDevTools ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Bug className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* Development Dashboard */}
      <DevDashboard 
        isOpen={showDevTools} 
        onToggle={() => setShowDevTools(false)} 
      />
    </>
  );
};

export default DevWrapper;
