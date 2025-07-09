-- Enable real-time updates for payment_sessions table
ALTER TABLE public.payment_sessions REPLICA IDENTITY FULL;

-- Add the payment_sessions table to the realtime publication
ALTER publication supabase_realtime ADD TABLE public.payment_sessions;