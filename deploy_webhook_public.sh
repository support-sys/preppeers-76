#!/bin/bash

# Deploy webhook function with anonymous access
echo "🚀 Deploying payment-webhook function with anonymous access..."

# Deploy the function
supabase functions deploy payment-webhook --project-ref kqyynigirebbggphstac

# Note: You may need to enable anonymous access in Supabase Dashboard
echo "📝 Next steps:"
echo "1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/kqyynigirebbggphstac/functions"
echo "2. Find 'payment-webhook' function"
echo "3. Enable 'Allow anonymous access' if the option is available"
echo "4. Or check if there's a 'Public' toggle in the function settings"
