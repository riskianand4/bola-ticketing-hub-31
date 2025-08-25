import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Ticket, Users } from "lucide-react";
import { Link } from "react-router-dom";
import footballFieldBg from "@/assets/football-field-bg.jpg";
interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  badge?: string;
  stats?: {
    label: string;
    value: string;
  }[];
}
const slides: SlideData[] = [{
  id: 1,
  title: "LASKAR RENCONG",
  subtitle: "LANTAK LAJU!",
  description: "Dukung Persiraja Banda Aceh di Stadion Harapan Bangsa. Rasakan atmosfer luar biasa bersama SKULL!",
  ctaText: "Beli Tiket Sekarang",
  ctaLink: "/tickets",
  badge: "Pertandingan Mendatang",
  stats: [{
    label: "Match",
    value: "15 Des"
  }, {
    label: "Kick Off",
    value: "19:30"
  }, {
    label: "Venue",
    value: "Harapan Bangsa"
  }]
}, {
  id: 2,
  title: "PERSIRAJA STORE",
  subtitle: "Official Merchandise",
  description: "Koleksi jersey resmi, aksesoris, dan merchandise eksklusif Persiraja. Tunjukkan dukungan Anda!",
  ctaText: "Belanja Sekarang",
  ctaLink: "/shop",
  badge: "New Collection",
  stats: [{
    label: "Jersey",
    value: "Rp 299K"
  }, {
    label: "Scarf",
    value: "Rp 99K"
  }, {
    label: "Free Shipping",
    value: "500K+"
  }]
}, {
  id: 3,
  title: "SKULL COMMUNITY",
  subtitle: "Suporter Kutaraja Untuk Lantak Laju",
  description: "Bergabung dengan komunitas suporter terbesar Aceh. Bersama kita dukung Persiraja meraih prestasi!",
  ctaText: "Gabung Komunitas",
  ctaLink: "/about",
  badge: "Join Now",
  stats: [{
    label: "Members",
    value: "50K+"
  }, {
    label: "Since",
    value: "1957"
  }, {
    label: "Spirit",
    value: "100%"
  }]
}];
export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlay]);
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };
  const currentSlideData = slides[currentSlide];
  return <section className="relative h-[70vh] lg:h-[80vh] overflow-hidden bg-cover bg-center bg-no-repeat" style={{
    backgroundImage: `url(${footballFieldBg})`
  }} onMouseEnter={() => setIsAutoPlay(false)} onMouseLeave={() => setIsAutoPlay(true)}>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content Container */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Text Content */}
            <div className="text-white space-y-6 animate-fade-in">
              {currentSlideData.badge}
              
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  {currentSlideData.title}
                </h1>
                <h2 className="text-2xl lg:text-3xl font-semibold text-secondary">
                  {currentSlideData.subtitle}
                </h2>
              </div>
              
              <p className="text-lg lg:text-xl text-gray-200 max-w-lg leading-relaxed">
                {currentSlideData.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={currentSlideData.ctaLink}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold">
                    <Ticket className="mr-2 h-5 w-5" />
                    {currentSlideData.ctaText}
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 text-lg font-semibold">
                    <Users className="mr-2 h-5 w-5" />
                    Tentang Kami
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="flex justify-center lg:justify-end">
              
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Arrows */}
      
      
      
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/70"}`} />)}
      </div>
    </section>;
}