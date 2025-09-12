/**
 * Development Utilities
 * Helper functions and tools for development environment
 */

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isDebugMode = import.meta.env.VITE_ENABLE_DEBUG === 'true';

// Console logging with development checks
export const devLog = (message: string, ...args: any[]) => {
  if (isDevelopment && isDebugMode) {
    console.log(`[DEV] ${message}`, ...args);
  }
};

export const devWarn = (message: string, ...args: any[]) => {
  if (isDevelopment && isDebugMode) {
    console.warn(`[DEV WARNING] ${message}`, ...args);
  }
};

export const devError = (message: string, ...args: any[]) => {
  if (isDevelopment && isDebugMode) {
    console.error(`[DEV ERROR] ${message}`, ...args);
  }
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  if (isDevelopment && isDebugMode) {
    const start = performance.now();
    fn();
    const end = performance.now();
    devLog(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
};

// Async performance monitoring
export const measureAsyncPerformance = async (name: string, fn: () => Promise<any>) => {
  if (isDevelopment && isDebugMode) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    devLog(`Async Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    return result;
  } else {
    return await fn();
  }
};

// Development-only features
export const devOnly = (fn: () => void) => {
  if (isDevelopment) {
    fn();
  }
};

// Mock data for development
export const mockData = {
  user: {
    id: 'dev-user-123',
    email: 'dev@preppeers.com',
    name: 'Dev User',
    role: 'interviewee'
  },
  interviewer: {
    id: 'dev-interviewer-123',
    name: 'Dev Interviewer',
    experience: 5,
    skills: ['React', 'Node.js', 'TypeScript'],
    timeSlots: {
      Monday: [{ start: '09:00', end: '10:00' }],
      Tuesday: [{ start: '14:00', end: '15:00' }]
    }
  },
  interview: {
    id: 'dev-interview-123',
    candidateEmail: 'dev@preppeers.com',
    interviewerId: 'dev-interviewer-123',
    scheduledTime: '2025-09-15T10:00:00Z',
    status: 'scheduled'
  }
};

// Development API endpoints
export const devEndpoints = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://jhhoeodofsbgfxndhotq.supabase.co',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:8080'
};

// Development configuration
export const devConfig = {
  enableHotReload: true,
  enableSourceMaps: true,
  enableReactDevTools: true,
  enableReduxDevTools: false,
  logLevel: isDebugMode ? 'debug' : 'info',
  mockApi: false, // Set to true to use mock data instead of real API
  slowNetworkSimulation: false, // Simulate slow network for testing
  networkDelay: 1000 // Delay in milliseconds for network simulation
};

// Network simulation for development
export const simulateNetworkDelay = async (delay: number = devConfig.networkDelay) => {
  if (isDevelopment && devConfig.slowNetworkSimulation) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

// Development storage helpers
export const devStorage = {
  set: (key: string, value: any) => {
    if (isDevelopment) {
      localStorage.setItem(`dev_${key}`, JSON.stringify(value));
    }
  },
  get: (key: string) => {
    if (isDevelopment) {
      const item = localStorage.getItem(`dev_${key}`);
      return item ? JSON.parse(item) : null;
    }
    return null;
  },
  remove: (key: string) => {
    if (isDevelopment) {
      localStorage.removeItem(`dev_${key}`);
    }
  },
  clear: () => {
    if (isDevelopment) {
      Object.keys(localStorage)
        .filter(key => key.startsWith('dev_'))
        .forEach(key => localStorage.removeItem(key));
    }
  }
};

// Development error boundary helper
export const devErrorBoundary = (error: Error, errorInfo: any) => {
  if (isDevelopment) {
    devError('Error Boundary Caught:', error);
    devError('Error Info:', errorInfo);
    
    // Store error for debugging
    devStorage.set('lastError', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    });
  }
};

// Development component props validation
export const validateProps = (componentName: string, props: any, requiredProps: string[]) => {
  if (isDevelopment && isDebugMode) {
    const missingProps = requiredProps.filter(prop => !(prop in props));
    if (missingProps.length > 0) {
      devWarn(`${componentName} is missing required props:`, missingProps);
    }
  }
};

// Development hook for debugging
export const useDevDebug = (name: string, value: any) => {
  if (isDevelopment && isDebugMode) {
    devLog(`${name}:`, value);
  }
};

export default {
  isDevelopment,
  isProduction,
  isDebugMode,
  devLog,
  devWarn,
  devError,
  measurePerformance,
  measureAsyncPerformance,
  devOnly,
  mockData,
  devEndpoints,
  devConfig,
  simulateNetworkDelay,
  devStorage,
  devErrorBoundary,
  validateProps,
  useDevDebug
};
