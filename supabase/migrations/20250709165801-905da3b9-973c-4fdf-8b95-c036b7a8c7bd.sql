-- Enable real-time updates for payment_sessions table
ALTER TABLE public.payment_sessions REPLICA IDENTITY FULL;