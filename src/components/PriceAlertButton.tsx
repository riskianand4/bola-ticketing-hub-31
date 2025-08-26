import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PriceAlertButtonProps {
  merchandiseId: string;
  currentPrice: number;
  merchandiseName: string;
}

export function PriceAlertButton({ merchandiseId, currentPrice, merchandiseName }: PriceAlertButtonProps) {
  const [targetPrice, setTargetPrice] = useState('');
  const [hasAlert, setHasAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkExistingAlert();
    }
  }, [user, merchandiseId]);

  const checkExistingAlert = async () => {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('merchandise_id', merchandiseId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setHasAlert(!!data);
    } catch (error) {
      console.error('Error checking existing alert:', error);
    }
  };

  const createPriceAlert = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk membuat price alert",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Masukkan harga target yang valid",
        variant: "destructive",
      });
      return;
    }

    if (price >= currentPrice) {
      toast({
        title: "Error", 
        description: "Harga target harus lebih kecil dari harga saat ini",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          merchandise_id: merchandiseId,
          target_price: price,
          current_price: currentPrice,
          is_active: true
        });

      if (error) throw error;

      setHasAlert(true);
      setOpen(false);
      setTargetPrice('');
      
      toast({
        title: "Berhasil",
        description: "Price alert berhasil dibuat! Anda akan mendapat notifikasi ketika harga turun.",
      });
    } catch (error) {
      console.error('Error creating price alert:', error);
      toast({
        title: "Error",
        description: "Gagal membuat price alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removePriceAlert = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('user_id', user?.id)
        .eq('merchandise_id', merchandiseId);

      if (error) throw error;

      setHasAlert(false);
      toast({
        title: "Berhasil",
        description: "Price alert berhasil dihapus",
      });
    } catch (error) {
      console.error('Error removing price alert:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus price alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (hasAlert) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={removePriceAlert}
        disabled={loading}
        className="border-orange-200 text-orange-600 hover:bg-orange-50"
      >
        <BellRing className="h-4 w-4 mr-2" />
        Alert Aktif
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Price Alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Price Alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Produk: {merchandiseName}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Harga saat ini: {formatPrice(currentPrice)}
            </p>
          </div>
          
          <div>
            <Label htmlFor="target-price">Harga Target</Label>
            <Input
              id="target-price"
              type="number"
              placeholder="Masukkan harga target"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Anda akan mendapat notifikasi ketika harga turun ke atau di bawah target ini
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={createPriceAlert}
              disabled={loading || !targetPrice}
              className="flex-1"
            >
              {loading ? 'Membuat...' : 'Buat Alert'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}