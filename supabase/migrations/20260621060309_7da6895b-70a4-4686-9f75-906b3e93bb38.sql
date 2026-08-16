-- Enable realtime for partner applications and medical bookings so Partner UI
-- updates instantly when Admin changes status.
ALTER TABLE public.partner_applications REPLICA IDENTITY FULL;
ALTER TABLE public.medical_bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_bookings;