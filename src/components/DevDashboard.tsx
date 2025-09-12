/**
 * Development Dashboard Component
 * Shows development tools and information when in development mode
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Code, 
  Bug, 
  Activity, 
  RefreshCw, 
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload
} from 'lucide-react';
import { devUtils, devStorage } from '@/utils/devUtils';
import { supabase } from '@/integrations/supabase/client';

interface DevDashboardProps {
  isOpen: boolean;
  onToggle: () => void;
}

const DevDashboard = ({ isOpen, onToggle }: DevDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && devUtils.isDevelopment) {
      loadSystemInfo();
      checkDatabaseStatus();
      loadLogs();
    }
  }, [isOpen]);

  const loadSystemInfo = async () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      timestamp: new Date().toISOString()
    };
    setSystemInfo(info);
  };

  const checkDatabaseStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      setDbStatus({
        connected: !error,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDbStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  const loadLogs = () => {
    const storedLogs = devStorage.get('logs') || [];
    setLogs(storedLogs);
  };

  const clearLogs = () => {
    devStorage.remove('logs');
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dev-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const refreshAll = () => {
    loadSystemInfo();
    checkDatabaseStatus();
    loadLogs();
  };

  if (!devUtils.isDevelopment || !isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bug className="w-5 h-5 text-green-400" />
          Dev Dashboard
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-slate-400 hover:text-white"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
          <TabsTrigger value="database" className="text-xs">Database</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
        </TabsList>

        <div className="p-4 max-h-64 overflow-y-auto">
          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline" className="text-green-400 border-green-400">
                Development Mode
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Debug Enabled
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-slate-300">
                <strong>Environment:</strong> {import.meta.env.MODE}
              </div>
              <div className="text-sm text-slate-300">
                <strong>API URL:</strong> {devUtils.devEndpoints.apiUrl}
              </div>
              <div className="text-sm text-slate-300">
                <strong>App URL:</strong> {devUtils.devEndpoints.appUrl}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-3">
            {systemInfo && (
              <div className="space-y-2 text-sm">
                <div className="text-slate-300">
                  <strong>Platform:</strong> {systemInfo.platform}
                </div>
                <div className="text-slate-300">
                  <strong>Language:</strong> {systemInfo.language}
                </div>
                <div className="text-slate-300">
                  <strong>Online:</strong> {systemInfo.onLine ? 'Yes' : 'No'}
                </div>
                {systemInfo.memory && (
                  <div className="text-slate-300">
                    <strong>Memory:</strong> {systemInfo.memory.used}MB / {systemInfo.memory.total}MB
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="database" className="space-y-3">
            {dbStatus && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-slate-300">
                    {dbStatus.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {dbStatus.error && (
                  <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                    {dbStatus.error}
                  </div>
                )}
                <div className="text-xs text-slate-400">
                  Last checked: {new Date(dbStatus.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Development Logs</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportLogs}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {logs.length === 0 ? (
                  <div className="text-xs text-slate-500">No logs available</div>
                ) : (
                  logs.slice(-10).map((log, index) => (
                    <div key={index} className="text-xs text-slate-300 font-mono">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DevDashboard;
