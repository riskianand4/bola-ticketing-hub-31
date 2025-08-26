import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';

interface Bundle {
  id: string;
  name: string;
  description: string;
  original_price: number;
  bundle_price: number;
  discount_percentage: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  bundle_items: BundleItem[];
}

interface BundleItem {
  id: string;
  item_type: 'merchandise' | 'ticket';
  item_id: string;
  quantity: number;
}

interface Merchandise {
  id: string;
  name: string;
  price: number;
}

interface Ticket {
  id: string;
  ticket_type: string;
  price: number;
}

export function BundleDealsManagement() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useRoles();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    valid_until: '',
    items: [] as { type: 'merchandise' | 'ticket'; id: string; quantity: number }[]
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [bundlesRes, merchandiseRes, ticketsRes] = await Promise.all([
        supabase
          .from('product_bundles')
          .select('*')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('merchandise')
          .select('id, name, price')
          .eq('is_available', true),
        
        supabase
          .from('tickets')
          .select('id, ticket_type, price')
      ]);

      if (bundlesRes.error) throw bundlesRes.error;
      if (merchandiseRes.error) throw merchandiseRes.error;
      if (ticketsRes.error) throw ticketsRes.error;

      // Fetch bundle items separately
      const bundlesWithItems = await Promise.all(
        (bundlesRes.data || []).map(async (bundle) => {
          const { data: bundleItems } = await supabase
            .from('bundle_items')
            .select('id, item_type, item_id, quantity')
            .eq('bundle_id', bundle.id);
          
          return {
            ...bundle,
            bundle_items: (bundleItems || []).map(item => ({
              id: item.id,
              item_type: item.item_type as 'merchandise' | 'ticket',
              item_id: item.item_id,
              quantity: item.quantity
            }))
          };
        })
      );

      setBundles(bundlesWithItems);
      setMerchandise(merchandiseRes.data || []);
      setTickets(ticketsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data bundle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItemToBundle = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { type: 'merchandise', id: '', quantity: 1 }]
    }));
  };

  const removeItemFromBundle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateBundleItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculatePrices = () => {
    let totalOriginalPrice = 0;
    
    formData.items.forEach(item => {
      if (item.id) {
        if (item.type === 'merchandise') {
          const merch = merchandise.find(m => m.id === item.id);
          if (merch) totalOriginalPrice += merch.price * item.quantity;
        } else {
          const ticket = tickets.find(t => t.id === item.id);
          if (ticket) totalOriginalPrice += ticket.price * item.quantity;
        }
      }
    });

    return totalOriginalPrice;
  };

  const createBundle = async (bundlePrice: number) => {
    try {
      const originalPrice = calculatePrices();
      
      if (originalPrice === 0) {
        toast({
          title: "Error",
          description: "Pilih minimal satu item untuk bundle",
          variant: "destructive",
        });
        return;
      }

      if (bundlePrice >= originalPrice) {
        toast({
          title: "Error",
          description: "Harga bundle harus lebih kecil dari harga asli",
          variant: "destructive",
        });
        return;
      }

      // Create bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('product_bundles')
        .insert({
          name: formData.name,
          description: formData.description,
          original_price: originalPrice,
          bundle_price: bundlePrice,
          valid_until: formData.valid_until || null
        })
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Create bundle items
      const bundleItems = formData.items.map(item => ({
        bundle_id: bundle.id,
        item_type: item.type,
        item_id: item.id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('bundle_items')
        .insert(bundleItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Berhasil",
        description: "Bundle berhasil dibuat",
      });

      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        valid_until: '',
        items: []
      });
      fetchData();
    } catch (error) {
      console.error('Error creating bundle:', error);
      toast({
        title: "Error",
        description: "Gagal membuat bundle",
        variant: "destructive",
      });
    }
  };

  const toggleBundleStatus = async (bundleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('product_bundles')
        .update({ is_active: !isActive })
        .eq('id', bundleId);

      if (error) throw error;

      setBundles(bundles.map(bundle => 
        bundle.id === bundleId ? { ...bundle, is_active: !isActive } : bundle
      ));

      toast({
        title: "Berhasil",
        description: `Bundle ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
    } catch (error) {
      console.error('Error toggling bundle:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status bundle",
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

  if (!isAdmin) {
    return <div className="text-center py-8">Akses ditolak</div>;
  }

  if (loading) {
    return <div className="text-center py-8">Memuat data bundle...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bundle Deals Management</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Bundle Baru
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Bundle Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Bundle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masukkan nama bundle"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Masukkan deskripsi bundle"
              />
            </div>

            <div>
              <Label htmlFor="valid_until">Berlaku Hingga (Opsional)</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Items dalam Bundle</Label>
                <Button variant="outline" size="sm" onClick={addItemToBundle}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end mb-2">
                  <div className="flex-1">
                    <Select
                      value={item.type}
                      onValueChange={(value) => updateBundleItem(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                        <SelectItem value="ticket">Tiket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-2">
                    <Select
                      value={item.id}
                      onValueChange={(value) => updateBundleItem(index, 'id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih item" />
                      </SelectTrigger>
                      <SelectContent>
                        {item.type === 'merchandise' 
                          ? merchandise.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} - {formatPrice(m.price)}
                              </SelectItem>
                            ))
                          : tickets.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.ticket_type} - {formatPrice(t.price)}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateBundleItem(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-20"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItemFromBundle(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {formData.items.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Harga Asli: {formatPrice(calculatePrices())}
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="bundle_price">Harga Bundle</Label>
                    <Input
                      id="bundle_price"
                      type="number"
                      placeholder="Masukkan harga bundle"
                      onChange={(e) => {
                        const bundlePrice = parseFloat(e.target.value);
                        if (bundlePrice > 0) {
                          // Calculate and show discount percentage
                          const originalPrice = calculatePrices();
                          const discount = ((originalPrice - bundlePrice) / originalPrice * 100).toFixed(1);
                          console.log(`Diskon: ${discount}%`);
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={(e) => {
                      const input = document.getElementById('bundle_price') as HTMLInputElement;
                      const bundlePrice = parseFloat(input.value);
                      createBundle(bundlePrice);
                    }}
                    disabled={formData.items.length === 0 || !formData.name}
                  >
                    Buat Bundle
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {bundles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Belum ada bundle deals</p>
            </CardContent>
          </Card>
        ) : (
          bundles.map((bundle) => (
            <Card key={bundle.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{bundle.name}</h3>
                    {bundle.description && (
                      <p className="text-muted-foreground">{bundle.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={bundle.is_active ? "default" : "secondary"}>
                      {bundle.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <Badge variant="destructive">
                      {bundle.discount_percentage}% OFF
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Harga Asli</p>
                    <p className="text-lg line-through">{formatPrice(bundle.original_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Harga Bundle</p>
                    <p className="text-lg font-semibold text-primary">{formatPrice(bundle.bundle_price)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Items dalam Bundle:</p>
                  <div className="space-y-1">
                    {bundle.bundle_items?.map((item) => {
                      const itemData = item.item_type === 'merchandise' 
                        ? merchandise.find(m => m.id === item.item_id)
                        : tickets.find(t => t.id === item.item_id);
                      const itemName = item.item_type === 'merchandise' 
                        ? (itemData as Merchandise)?.name 
                        : (itemData as Ticket)?.ticket_type;
                      
                      return (
                        <div key={item.id} className="text-sm text-muted-foreground">
                          {item.quantity}x {itemName || 'Item tidak ditemukan'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {bundle.valid_until && (
                      <span>Berlaku hingga: {new Date(bundle.valid_until).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toggleBundleStatus(bundle.id, bundle.is_active)}
                  >
                    {bundle.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}