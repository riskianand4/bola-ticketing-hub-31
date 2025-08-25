
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  HelpCircle, 
  Shield, 
  Star, 
  Share2, 
  Download,
  Bell,
  Globe,
  CreditCard,
  Users,
  Images
} from "lucide-react";
import { toast } from "sonner";

export default function MorePage() {
  const menuItems = [
    {
      icon: Images,
      title: "Galeri",
      description: "Lihat foto dan video Persiraja",
      action: "gallery"
    },
    {
      icon: Settings,
      title: "Pengaturan",
      description: "Kelola akun dan preferensi Anda",
      action: "settings"
    },
    {
      icon: Bell,
      title: "Notifikasi",
      description: "Atur notifikasi dan pengingat",
      action: "notifications"
    },
    {
      icon: CreditCard,
      title: "Metode Pembayaran",
      description: "Kelola kartu dan metode pembayaran",
      action: "payment"
    },
    {
      icon: Users,
      title: "Refer Friends",
      description: "Ajak teman dan dapatkan reward",
      action: "referral"
    },
    {
      icon: Download,
      title: "Download App",
      description: "Unduh aplikasi mobile untuk pengalaman lebih baik",
      action: "download"
    },
    {
      icon: Star,
      title: "Beri Rating",
      description: "Bantu kami dengan memberikan rating di Play Store",
      action: "rating"
    },
    {
      icon: Share2,
      title: "Bagikan App",
      description: "Bagikan ke teman dan keluarga",
      action: "share"
    },
    {
      icon: HelpCircle,
      title: "Bantuan & FAQ",
      description: "Temukan jawaban untuk pertanyaan Anda",
      action: "help"
    },
    {
      icon: Shield,
      title: "Kebijakan Privasi",
      description: "Pelajari bagaimana kami melindungi data Anda",
      action: "privacy"
    },
    {
      icon: Globe,
      title: "Tentang Kami",
      description: "Pelajari lebih lanjut tentang aplikasi ini",
      action: "about"
    }
  ];

  const handleMenuClick = (action: string) => {
    console.log(`Clicked: ${action}`);
    if (action === "about") {
      window.location.href = "/about";
    } else if (action === "gallery") {
      window.location.href = "/gallery";
    } else {
      toast.info(`${action} clicked`, {
        description: "Fitur akan segera tersedia"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Lainnya</h1>
          <p className="text-muted-foreground text-lg">
            Pengaturan, bantuan, dan fitur tambahan
          </p>
        </div>

        {/* App Info Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">⚽</div>
              <div>
                <h2 className="text-2xl font-bold">Persiraja</h2>
                <p className="text-muted-foreground">
                  Platform resmi untuk berita dan pembelian tiket Persiraja
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Versi 1.0.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleMenuClick(item.action)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Unduh Aplikasi Mobile
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Share2 className="h-4 w-4 mr-2" />
              Bagikan ke Teman
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="h-4 w-4 mr-2" />
              Hubungi Customer Service
            </Button>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Persiraja Banda Aceh. All rights reserved.</p>
          <p className="mt-1">
            Made with ❤️ for Persiraja Fans - Lantak Laju!
          </p>
        </div>
      </div>
    </div>
  );
}
