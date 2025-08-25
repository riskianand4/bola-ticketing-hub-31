import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { XenditPaymentButton } from "@/components/XenditPaymentButton";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const shippingCost = 15000;
  const tax = Math.round(getTotalPrice() * 0.1);
  const finalTotal = getTotalPrice() + shippingCost + tax;

  const handlePaymentSuccess = () => {
    toast.success("Checkout berhasil!", {
      description: "Pesanan Anda sedang diproses"
    });
    clearCart();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-4">Keranjang Kosong</h1>
            <p className="text-muted-foreground mb-8">
              Belum ada produk di keranjang Anda. Yuk mulai belanja!
            </p>
            <Link to="/shop">
              <Button size="lg">
                Mulai Belanja
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/shop">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Keranjang Belanja</h1>
            <p className="text-muted-foreground">
              {items.length} produk di keranjang Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg bg-muted"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{item.name}</h3>
                      <p className="text-primary font-bold text-lg">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Clear Cart Button */}
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Kosongkan Keranjang
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kode Promo</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Masukkan kode promo"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button variant="outline" size="sm">
                      Gunakan
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>

                {/* Free Shipping Badge */}
                {getTotalPrice() >= 500000 && (
                  <Badge className="w-full justify-center bg-green-500">
                    ✓ Gratis Ongkir untuk pembelian di atas 500rb
                  </Badge>
                )}

                {/* Checkout Button */}
                {user ? (
                  <XenditPaymentButton
                    amount={finalTotal}
                    description="Pembelian Merchandise Persiraja"
                    customerInfo={{
                      name: user.user_metadata?.full_name || user.email || "Customer",
                      email: user.email || "",
                      phone: user.user_metadata?.phone || "081234567890"
                    }}
                    orderData={{
                      type: 'merchandise',
                      items: items,
                      shipping_address: "Alamat pengiriman akan dikonfirmasi"
                    }}
                    onSuccess={handlePaymentSuccess}
                    className="w-full"
                  >
                    Checkout Sekarang
                  </XenditPaymentButton>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => toast.error("Silakan login terlebih dahulu")}
                  >
                    Checkout Sekarang
                  </Button>
                )}

                {/* Security Info */}
                <p className="text-xs text-muted-foreground text-center">
                  🔒 Transaksi aman dan terpercaya
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}