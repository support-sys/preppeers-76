#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * This script helps set up the development environment for the Preppeers application
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, description) {
  log(`\n${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    throw error;
  }
}

async function setupDevelopmentEnvironment() {
  log('\n🚀 Setting up Preppeers Development Environment', 'bold');
  log('=' .repeat(50), 'blue');

  // Check prerequisites
  log('\n📋 Checking prerequisites...', 'blue');
  
  const requiredCommands = ['node', 'npm', 'git'];
  const missingCommands = requiredCommands.filter(cmd => !checkCommand(cmd));
  
  if (missingCommands.length > 0) {
    log(`❌ Missing required commands: ${missingCommands.join(', ')}`, 'red');
    log('Please install the missing dependencies and try again.', 'yellow');
    process.exit(1);
  }
  
  log('✅ All prerequisites found', 'green');

  // Check if .env.local exists
  if (!fs.existsSync('.env.local')) {
    log('\n📝 Creating .env.local file...', 'blue');
    const envContent = `# Supabase Configuration
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
`;
    
    fs.writeFileSync('.env.local', envContent);
    log('✅ .env.local file created', 'green');
  } else {
    log('✅ .env.local file already exists', 'green');
  }

  // Install dependencies
  runCommand('npm install', 'Installing dependencies');

  // Check Supabase CLI
  if (!checkCommand('supabase')) {
    log('\n📦 Installing Supabase CLI...', 'blue');
    try {
      runCommand('npm install -g supabase', 'Installing Supabase CLI globally');
    } catch {
      log('⚠️  Failed to install Supabase CLI globally. Please install it manually:', 'yellow');
      log('   npm install -g supabase', 'yellow');
      log('   or visit: https://supabase.com/docs/guides/cli/getting-started', 'yellow');
    }
  } else {
    log('✅ Supabase CLI found', 'green');
  }

  // Link to Supabase project
  log('\n🔗 Linking to Supabase project...', 'blue');
  try {
    runCommand('npx supabase link --project-ref jhhoeodofsbgfxndhotq', 'Linking to Supabase project');
  } catch {
    log('⚠️  Supabase linking failed. You may need to run this manually:', 'yellow');
    log('   npx supabase link --project-ref jhhoeodofsbgfxndhotq', 'yellow');
  }

  // Create development scripts
  log('\n📝 Creating development scripts...', 'blue');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add development scripts if they don't exist
  const devScripts = {
    'dev:full': 'npm run dev & npm run dev:supabase',
    'dev:supabase': 'supabase start',
    'dev:stop': 'supabase stop',
    'dev:reset': 'supabase db reset',
    'dev:logs': 'supabase logs',
    'dev:status': 'supabase status',
    'dev:db-push': 'supabase db push',
    'dev:db-pull': 'supabase db pull',
    'dev:functions': 'supabase functions serve',
    'dev:test': 'npm run test -- --watch',
    'dev:lint': 'npm run lint -- --watch',
    'dev:type-check': 'tsc --noEmit --watch'
  };

  Object.entries(devScripts).forEach(([script, command]) => {
    if (!packageJson.scripts[script]) {
      packageJson.scripts[script] = command;
    }
  });

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  log('✅ Development scripts added to package.json', 'green');

  // Create development documentation
  log('\n📚 Creating development documentation...', 'blue');
  
  const devReadme = `# Preppeers Development Environment

## Quick Start

1. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Start Supabase locally (optional):**
   \`\`\`bash
   npm run dev:supabase
   \`\`\`

3. **View the application:**
   Open http://localhost:8080 in your browser

## Available Scripts

- \`npm run dev\` - Start the Vite development server
- \`npm run dev:full\` - Start both Vite and Supabase
- \`npm run dev:supabase\` - Start Supabase local development
- \`npm run dev:stop\` - Stop Supabase
- \`npm run dev:reset\` - Reset local database
- \`npm run dev:logs\` - View Supabase logs
- \`npm run dev:status\` - Check Supabase status
- \`npm run dev:db-push\` - Push migrations to remote database
- \`npm run dev:db-pull\` - Pull schema from remote database
- \`npm run dev:functions\` - Serve Supabase functions locally
- \`npm run dev:test\` - Run tests in watch mode
- \`npm run dev:lint\` - Run linter in watch mode
- \`npm run dev:type-check\` - Run TypeScript type checking in watch mode

## Environment Configuration

The application uses the following environment variables (configured in \`.env.local\`):

- \`VITE_SUPABASE_URL\` - Supabase project URL
- \`VITE_SUPABASE_ANON_KEY\` - Supabase anonymous key
- \`SUPABASE_DB_PASSWORD\` - Database password for CLI operations
- \`VITE_APP_URL\` - Application URL
- \`VITE_ENABLE_DEBUG\` - Enable debug mode

## Database Management

### Push migrations to remote database:
\`\`\`bash
export SUPABASE_DB_PASSWORD="pzAgZazM9U5piDV" && npm run dev:db-push
\`\`\`

### Pull latest schema from remote database:
\`\`\`bash
npm run dev:db-pull
\`\`\`

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   - Change the port in \`vite.config.ts\`
   - Or kill the process using the port

2. **Supabase connection issues:**
   - Check your internet connection
   - Verify Supabase project is active
   - Check environment variables

3. **Database migration errors:**
   - Ensure you're using the correct database password
   - Check migration file syntax
   - Verify database permissions

### Getting Help:

- Check the console for error messages
- Review the Supabase logs: \`npm run dev:logs\`
- Check the application status: \`npm run dev:status\`

## Development Workflow

1. Make your changes to the code
2. The development server will automatically reload
3. Test your changes in the browser
4. Run tests: \`npm run dev:test\`
5. Check for linting issues: \`npm run dev:lint\`
6. When ready, push database changes: \`npm run dev:db-push\`

Happy coding! 🚀
`;

  fs.writeFileSync('DEV_README.md', devReadme);
  log('✅ Development documentation created (DEV_README.md)', 'green');

  // Final setup summary
  log('\n🎉 Development environment setup complete!', 'green');
  log('=' .repeat(50), 'blue');
  log('\nNext steps:', 'bold');
  log('1. Review and update .env.local with your API keys', 'yellow');
  log('2. Run: npm run dev', 'yellow');
  log('3. Open: http://localhost:8080', 'yellow');
  log('4. Read DEV_README.md for detailed instructions', 'yellow');
  log('\nHappy coding! 🚀', 'green');
}

// Run the setup
setupDevelopmentEnvironment().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
