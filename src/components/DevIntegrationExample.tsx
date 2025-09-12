/**
 * Development Integration Example
 * Shows how to integrate development tools into your components
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { devUtils } from '@/utils/devUtils';

const DevIntegrationExample = () => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState<any>(null);

  // Example of using development utilities
  useEffect(() => {
    // This will only log in development mode with debug enabled
    devUtils.devLog('DevIntegrationExample mounted', { count });
    
    // Example of performance measurement
    devUtils.measurePerformance('Data Loading', () => {
      // Simulate data loading
      setTimeout(() => {
        setData({ message: 'Data loaded successfully', timestamp: new Date() });
      }, 100);
    });

    // Development-only code
    devUtils.devOnly(() => {
      console.log('This only runs in development mode');
    });
  }, [count]);

  const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);
    
    // Log the action
    devUtils.devLog('Button clicked', { newCount });
    
    // Store in development storage
    devUtils.devStorage.set('clickCount', newCount);
  };

  const loadMockData = async () => {
    // Simulate API call with network delay
    await devUtils.simulateNetworkDelay(500);
    
    // Use mock data in development
    if (devUtils.devConfig.mockApi) {
      setData(devUtils.mockData.interview);
      devUtils.devLog('Using mock data', devUtils.mockData.interview);
    } else {
      // Real API call would go here
      setData({ message: 'Real API data', timestamp: new Date() });
    }
  };

  // Validate props (development only)
  devUtils.validateProps('DevIntegrationExample', { count, data }, ['count']);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Development Tools Example</CardTitle>
        <CardDescription>
          This component demonstrates how to use development utilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm text-muted-foreground">Click count</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleClick} className="flex-1">
            Increment
          </Button>
          <Button onClick={loadMockData} variant="outline" className="flex-1">
            Load Data
          </Button>
        </div>

        {data && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Data:</p>
            <pre className="text-xs mt-1 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {devUtils.isDevelopment && (
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              🛠️ Development mode active - Check console for debug logs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DevIntegrationExample;
