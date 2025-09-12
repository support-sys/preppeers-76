# Preppeers Development Environment

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Start Supabase locally (optional):**
   ```bash
   npm run dev:supabase
   ```

3. **View the application:**
   Open http://localhost:8080 in your browser

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run dev:full` - Start both Vite and Supabase
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

## Environment Configuration

The application uses the following environment variables (configured in `.env.local`):

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_DB_PASSWORD` - Database password for CLI operations
- `VITE_APP_URL` - Application URL
- `VITE_ENABLE_DEBUG` - Enable debug mode

## Database Management

### Push migrations to remote database:
```bash
export SUPABASE_DB_PASSWORD="pzAgZazM9U5piDV" && npm run dev:db-push
```

### Pull latest schema from remote database:
```bash
npm run dev:db-pull
```

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   - Change the port in `vite.config.ts`
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
- Review the Supabase logs: `npm run dev:logs`
- Check the application status: `npm run dev:status`

## Development Workflow

1. Make your changes to the code
2. The development server will automatically reload
3. Test your changes in the browser
4. Run tests: `npm run dev:test`
5. Check for linting issues: `npm run dev:lint`
6. When ready, push database changes: `npm run dev:db-push`

Happy coding! 🚀
