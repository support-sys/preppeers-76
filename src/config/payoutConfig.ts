/**
 * Payout Configuration - Reference/Documentation only
 * 
 * ⚠️ NOTE: The actual payout amounts are stored in the database table `payout_config`.
 * This file is for reference/documentation purposes only.
 * 
 * To update payout rates:
 * 1. Update the `payout_config` table in Supabase (via SQL Editor or Admin UI)
 * 2. Changes take effect immediately for NEW payouts
 * 3. See supabase/migrations/UPDATE_PAYOUT_RATES.sql.example for SQL examples
 * 
 * The database trigger reads from `payout_config` table on every payout creation,
 * so rate changes apply immediately without any code deployments.
 */
export const payoutConfig = {
  amounts: {
    essential: 300.00, // For 30-minute Essential plan interviews
    professional: 700.00, // For 60-minute Professional plan interviews
    referral: 100.00 // Future: referral bonus amount
  },
  settings: {
    autoCreateOnComplete: true, // Auto-create payout when interview marked completed
    defaultStatus: 'pending', // Initial payout status
    daysToPayment: 7 // Future: expected days until payment is processed
  }
};
