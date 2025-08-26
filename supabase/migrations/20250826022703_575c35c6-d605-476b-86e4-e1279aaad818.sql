-- Create price alerts table
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchandise_id UUID NOT NULL,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for price alerts
CREATE POLICY "Users can view their own price alerts" 
ON public.price_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts" 
ON public.price_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts" 
ON public.price_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts" 
ON public.price_alerts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create product bundles table
CREATE TABLE public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  original_price NUMERIC NOT NULL,
  bundle_price NUMERIC NOT NULL,
  discount_percentage NUMERIC GENERATED ALWAYS AS (
    ROUND(((original_price - bundle_price) / original_price * 100)::numeric, 2)
  ) STORED,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for bundles
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

-- RLS policies for bundles
CREATE POLICY "Anyone can view active bundles" 
ON public.product_bundles 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until >= now()));

CREATE POLICY "Admins can manage bundles" 
ON public.product_bundles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create bundle items junction table
CREATE TABLE public.bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('merchandise', 'ticket')),
  item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for bundle items
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for bundle items
CREATE POLICY "Anyone can view bundle items for active bundles" 
ON public.bundle_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.product_bundles 
  WHERE id = bundle_items.bundle_id 
  AND is_active = true 
  AND valid_from <= now() 
  AND (valid_until IS NULL OR valid_until >= now())
));

CREATE POLICY "Admins can manage bundle items" 
ON public.bundle_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_merchandise_id ON public.price_alerts(merchandise_id);
CREATE INDEX idx_bundle_items_bundle_id ON public.bundle_items(bundle_id);
CREATE INDEX idx_product_bundles_active ON public.product_bundles(is_active, valid_from, valid_until);

-- Create trigger for updated_at
CREATE TRIGGER update_price_alerts_updated_at
BEFORE UPDATE ON public.price_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_bundles_updated_at
BEFORE UPDATE ON public.product_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check price alerts
CREATE OR REPLACE FUNCTION public.check_price_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  alert_record RECORD;
BEGIN
  -- Check all active price alerts
  FOR alert_record IN 
    SELECT pa.*, m.price as current_merchandise_price, m.name as merchandise_name
    FROM public.price_alerts pa
    JOIN public.merchandise m ON pa.merchandise_id = m.id
    WHERE pa.is_active = true 
    AND m.price <= pa.target_price
    AND m.price < pa.current_price
  LOOP
    -- Send notification
    PERFORM public.send_push_notification(
      alert_record.user_id,
      'Harga Turun!',
      'Harga ' || alert_record.merchandise_name || ' sudah turun menjadi Rp ' || alert_record.current_merchandise_price,
      'merchandise_alert'::notification_type,
      jsonb_build_object('merchandise_id', alert_record.merchandise_id, 'new_price', alert_record.current_merchandise_price)
    );
    
    -- Update current price
    UPDATE public.price_alerts 
    SET current_price = alert_record.current_merchandise_price,
        updated_at = now()
    WHERE id = alert_record.id;
  END LOOP;
END;
$$;