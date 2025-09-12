# Preppeers Development Environment Setup

This guide will help you set up the development environment for the Preppeers application.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase CLI** (optional, for local development) - [Installation guide](https://supabase.com/docs/guides/cli/getting-started)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd preppeers-76

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jhhoeodofsbgfxndhotq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmUIsInJlZiI6ImpoaG9lb2RvZnNiZ2Z4bmRob3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTAwNjQsImV4cCI6MjA2NjY4NjA2NH0.FgJT65W6Vk0jF4sdY0DLbUiAhvR1t3hm-gx57rZc88I

# Database Password for CLI operations
SUPABASE_DB_PASSWORD=pzAgZazM9U5piDV

# Development Environment
NODE_ENV=development
VITE_APP_ENV=development

# Application URLs
VITE_APP_URL=http://localhost:8080
VITE_API_URL=https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false

# Payment Configuration (Cashfree) - Add your keys here
VITE_CASHFREE_APP_ID=your_cashfree_app_id
VITE_CASHFREE_SECRET_KEY=your_cashfree_secret_key
VITE_CASHFREE_ENVIRONMENT=sandbox

# Google Workspace Configuration - Add your keys here
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

### Development Scripts

- `npm run dev` - Start the Vite development server
- `npm run dev:full` - Start both Vite and Supabase (if installed)
- `npm run dev:supabase` - Start Supabase local development
- `npm run dev:stop` - Stop Supabase
- `npm run dev:reset` - Reset local database
- `npm run dev:logs` - View Supabase logs
- `npm run dev:status` - Check Supabase status
- `npm run dev:db-push` - Push migrations to remote database
- `npm run dev:db-pull` - Pull schema from remote database
- `npm run dev:functions` - Serve Supabase functions locally
- `npm run dev:test` - Run tests in watch mode
- `npm run dev:lint` - Run linter in watch mode
- `npm run dev:type-check` - Run TypeScript type checking in watch mode
- `npm run dev:setup` - Run the development setup script

### Build Scripts

- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build

### Utility Scripts

- `npm run lint` - Run ESLint
- `npm run dev:setup` - Run development environment setup

## Development Features

### 1. Development Dashboard

The application includes a development dashboard that provides:

- **System Information**: Browser details, memory usage, platform info
- **Database Status**: Connection status and error monitoring
- **Development Logs**: Real-time logging and debugging
- **Performance Monitoring**: Track component render times

**Access the dashboard:**
- Click the bug icon in the top-right corner
- Or use keyboard shortcut: `Ctrl+Shift+D`

### 2. Debug Utilities

The application includes several debug utilities:

```typescript
import { devUtils } from '@/utils/devUtils';

// Logging
devUtils.devLog('Debug message');
devUtils.devWarn('Warning message');
devUtils.devError('Error message');

// Performance monitoring
devUtils.measurePerformance('Component Render', () => {
  // Your code here
});

// Development-only code
devUtils.devOnly(() => {
  console.log('This only runs in development');
});
```

### 3. Environment Detection

```typescript
import { devUtils } from '@/utils/devUtils';

if (devUtils.isDevelopment) {
  // Development-only code
}

if (devUtils.isDebugMode) {
  // Debug mode code
}
```

## Database Management

### Remote Database Operations

```bash
# Push migrations to remote database
export SUPABASE_DB_PASSWORD="pzAgZazM9U5piDV" && npm run dev:db-push

# Pull latest schema from remote database
npm run dev:db-pull
```

### Local Database (Optional)

If you want to run Supabase locally:

```bash
# Start Supabase locally
npm run dev:supabase

# Check status
npm run dev:status

# View logs
npm run dev:logs

# Stop Supabase
npm run dev:stop
```

## Project Structure

```
preppeers-76/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # UI components (shadcn/ui)
│   │   ├── DevDashboard.tsx # Development dashboard
│   │   └── DevWrapper.tsx   # Development wrapper
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase configuration
│   ├── pages/              # Page components
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   │   └── devUtils.ts     # Development utilities
│   └── main.tsx           # Application entry point
├── supabase/              # Supabase configuration
│   ├── config.toml        # Supabase config
│   ├── functions/         # Edge functions
│   └── migrations/        # Database migrations
├── scripts/               # Development scripts
│   └── dev-setup.js       # Setup script
├── dev.config.js          # Development configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **Port 8080 already in use**
   ```bash
   # Kill the process using port 8080
   lsof -ti:8080 | xargs kill -9
   
   # Or change the port in vite.config.ts
   ```

2. **Supabase connection issues**
   - Check your internet connection
   - Verify the Supabase project is active
   - Check environment variables in `.env.local`

3. **Database migration errors**
   - Ensure you're using the correct database password
   - Check migration file syntax
   - Verify database permissions

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run dev:type-check`
   - Check linting errors: `npm run dev:lint`

### Getting Help

1. **Check the console** for error messages
2. **Use the development dashboard** for debugging
3. **Review the Supabase logs**: `npm run dev:logs`
4. **Check the application status**: `npm run dev:status`

## Development Workflow

1. **Make changes** to the code
2. **The development server** will automatically reload
3. **Test your changes** in the browser
4. **Use the dev dashboard** to monitor performance and debug
5. **Run tests**: `npm run dev:test`
6. **Check for linting issues**: `npm run dev:lint`
7. **When ready**, push database changes: `npm run dev:db-push`

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `SUPABASE_DB_PASSWORD` | Database password for CLI | Yes | - |
| `VITE_APP_URL` | Application URL | No | http://localhost:8080 |
| `VITE_ENABLE_DEBUG` | Enable debug mode | No | true |
| `VITE_CASHFREE_APP_ID` | Cashfree app ID | No | - |
| `VITE_CASHFREE_SECRET_KEY` | Cashfree secret key | No | - |
| `VITE_GOOGLE_CLIENT_ID` | Google client ID | No | - |

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes**
4. **Test thoroughly** using the development tools
5. **Run linting**: `npm run dev:lint`
6. **Commit your changes**: `git commit -m "Add your feature"`
7. **Push to your branch**: `git push origin feature/your-feature`
8. **Create a pull request**

## Support

If you encounter any issues:

1. Check this documentation
2. Use the development dashboard for debugging
3. Check the console for error messages
4. Review the Supabase logs
5. Create an issue with detailed information

Happy coding! 🚀
