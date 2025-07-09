-- Enable real-time for payment_sessions table
ALTER TABLE public.payment_sessions REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.payment_sessions;