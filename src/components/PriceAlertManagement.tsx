import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PriceAlert {
  id: string;
  merchandise_id: string;
  target_price: number;
  current_price: number;
  is_active: boolean;
  merchandise: {
    name: string;
    price: number;
    image_url: string;
  };
}

export function PriceAlertManagement() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPriceAlerts();
    }
  }, [user]);

  const fetchPriceAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch merchandise data separately
      const alertsWithMerchandise = await Promise.all(
        (data || []).map(async (alert) => {
          const { data: merchandise } = await supabase
            .from('merchandise')
            .select('name, price, image_url')
            .eq('id', alert.merchandise_id)
            .single();
          
          return {
            ...alert,
            merchandise: merchandise || { name: 'Unknown', price: 0, image_url: null }
          };
        })
      );

      setAlerts(alertsWithMerchandise);
    } catch (error) {
      console.error('Error fetching price alerts:', error);
      toast({
        title: "Error",
        description: "Gagal memuat price alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({ is_active: !isActive })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_active: !isActive } : alert
      ));

      toast({
        title: "Berhasil",
        description: `Price alert ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status alert",
        variant: "destructive",
      });
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(alert => alert.id !== alertId));

      toast({
        title: "Berhasil",
        description: "Price alert berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus price alert",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return <div className="text-center py-8">Memuat price alerts...</div>;
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Belum ada price alert</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tambahkan price alert di halaman produk untuk mendapat notifikasi ketika harga turun
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Price Alerts</h2>
      {alerts.map((alert) => (
        <Card key={alert.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img
                src={alert.merchandise.image_url || '/placeholder.svg'}
                alt={alert.merchandise.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-medium">{alert.merchandise.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Harga sekarang: {formatPrice(alert.merchandise.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Target: {formatPrice(alert.target_price)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={alert.is_active ? "default" : "secondary"}>
                    {alert.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                  {alert.merchandise.price <= alert.target_price && (
                    <Badge variant="destructive">Target Tercapai!</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAlert(alert.id, alert.is_active)}
                >
                  {alert.is_active ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteAlert(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}