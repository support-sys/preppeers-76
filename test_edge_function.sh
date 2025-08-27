#!/bin/bash

# Test the edge function directly to see if it works
curl -X POST "https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/send-interviewer-welcome" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "type": "eligibility",
    "interviewer_name": "Test Int 99",
    "interviewer_email": "8bhq3@powerscrews.com"
  }'
