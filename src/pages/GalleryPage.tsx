import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Image, Video, Calendar, Eye, Download } from "lucide-react";

const photos = [
  {
    id: 1,
    title: "Persiraja vs PSM Makassar",
    date: "15 Maret 2024",
    category: "Match",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop",
    description: "Pertandingan seru melawan PSM Makassar di Stadion Harapan Bangsa"
  },
  {
    id: 2,
    title: "Latihan Tim",
    date: "10 Maret 2024",
    category: "Training",
    image: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800&h=600&fit=crop",
    description: "Sesi latihan intensif persiapan menghadapi lawan berikutnya"
  },
  {
    id: 3,
    title: "Suporter SKULL",
    date: "8 Maret 2024",
    category: "Fans",
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&h=600&fit=crop",
    description: "Dukungan luar biasa dari SKULL di stadion kandang"
  },
  {
    id: 4,
    title: "Selebrasi Goal",
    date: "5 Maret 2024",
    category: "Match",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop",
    description: "Selebrasi gol spektakuler Rizky Pellu"
  },
  {
    id: 5,
    title: "Team Meeting",
    date: "1 Maret 2024",
    category: "Behind Scenes",
    image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=600&fit=crop",
    description: "Diskusi taktik dan strategi dengan pelatih"
  },
  {
    id: 6,
    title: "Warming Up",
    date: "28 Februari 2024",
    category: "Training",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    description: "Pemanasan sebelum pertandingan penting"
  }
];

const videos = [
  {
    id: 1,
    title: "Highlight Persiraja vs Sriwijaya FC",
    date: "20 Maret 2024",
    duration: "5:30",
    thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=450&fit=crop",
    description: "Highlight pertandingan menawan melawan Sriwijaya FC"
  },
  {
    id: 2,
    title: "Training Session - Tactical Drill",
    date: "18 Maret 2024",
    duration: "3:45",
    thumbnail: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800&h=450&fit=crop",
    description: "Sesi latihan taktik dan koordinasi tim"
  },
  {
    id: 3,
    title: "Behind the Scenes - Match Day",
    date: "15 Maret 2024",
    duration: "8:20",
    thumbnail: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=450&fit=crop",
    description: "Dokumenter di balik layar hari pertandingan"
  },
  {
    id: 4,
    title: "Fan Chants - SKULL Army",
    date: "12 Maret 2024",
    duration: "2:15",
    thumbnail: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&h=450&fit=crop",
    description: "Kompilasi yel-yel dan dukungan dari SKULL"
  }
];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("photos");
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background pt-4 md:pt-8">
      <div className="container mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 mobile-title">Galeri Persiraja</h1>
          <p className="text-sm md:text-lg text-muted-foreground mobile-compact max-w-2xl mx-auto">
            Koleksi foto dan video terbaik dari perjalanan Persiraja
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 max-w-md mx-auto">
            <TabsTrigger value="photos" className="text-xs md:text-sm">
              <Image className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Foto
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-xs md:text-sm">
              <Video className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Video
            </TabsTrigger>
          </TabsList>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {photos.map((photo) => (
                <Dialog key={photo.id}>
                  <DialogTrigger asChild>
                    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative">
                          <img 
                            src={photo.image} 
                            alt={photo.title}
                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye className="w-6 md:w-8 h-6 md:h-8 text-white" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 md:p-3">
                            <h3 className="text-white font-medium text-xs md:text-sm mb-1 mobile-compact">
                              {photo.title}
                            </h3>
                            <p className="text-white/80 text-xs flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {photo.date}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-4xl w-[95vw] p-0">
                    <div className="relative">
                      <img 
                        src={photo.image} 
                        alt={photo.title}
                        className="w-full max-h-[70vh] object-contain"
                      />
                      <div className="p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">{photo.title}</h3>
                        <p className="text-sm md:text-base text-muted-foreground mb-3">{photo.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            {photo.date}
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 md:p-4 group-hover:scale-110 transition-transform">
                          <Video className="w-6 md:w-8 h-6 md:h-8 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-2 mobile-compact">
                        {video.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {video.date}
                        </div>
                        <Button size="sm" variant="outline" className="text-xs mobile-button">
                          Tonton
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}