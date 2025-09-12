// Development Environment Configuration
export const devConfig = {
  // Supabase Configuration
  supabase: {
    url: "https://jhhoeodofsbgfxndhotq.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmUIsInJlZiI6ImpoaG9lb2RvZnNiZ2Z4bmRob3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTAwNjQsImV4cCI6MjA2NjY4NjA2NH0.FgJT65W6Vk0jF4sdY0DLbUiAhvR1t3hm-gx57rZc88I",
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "your_service_role_key_here",
    dbPassword: process.env.SUPABASE_DB_PASSWORD || "pzAgZazM9U5piDV"
  },

  // Application Configuration
  app: {
    url: "http://localhost:8080",
    apiUrl: "https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1",
    environment: "development",
    enableDebug: true,
    enableAnalytics: false
  },

  // Payment Configuration (Cashfree)
  payment: {
    cashfree: {
      appId: process.env.VITE_CASHFREE_APP_ID || "your_cashfree_app_id",
      secretKey: process.env.VITE_CASHFREE_SECRET_KEY || "your_cashfree_secret_key",
      environment: "sandbox" // or "production"
    }
  },

  // Google Workspace Configuration
  google: {
    clientId: process.env.VITE_GOOGLE_CLIENT_ID || "your_google_client_id",
    clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET || "your_google_client_secret"
  },

  // Development Tools
  devTools: {
    enableHotReload: true,
    enableSourceMaps: true,
    enableReactDevTools: true,
    enableReduxDevTools: false
  }
};

export default devConfig;
