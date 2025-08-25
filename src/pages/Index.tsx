import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Clock, Users, TrendingUp, Play, Star, Ticket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroSlider } from "@/components/HeroSlider";
import { supabase } from "@/integrations/supabase/client";
export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  
  const categories = ["All", "Team News", "Match Reports", "Transfer News", "Youth"];

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true });

        if (error) throw error;

        // Get current time
        const now = new Date();
        
        // Filter and sort matches to get the 3 closest ones (live or upcoming)
        const relevantMatches = data
          .filter(match => {
            const matchDate = new Date(match.match_date);
            // Include live matches, upcoming matches, or recently finished ones (within 2 hours)
            return match.status === 'live' || 
                   matchDate >= now || 
                   (match.status === 'finished' && (now.getTime() - matchDate.getTime()) < 2 * 60 * 60 * 1000);
          })
          .sort((a, b) => {
            // Prioritize live matches, then by closest date
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (b.status === 'live' && a.status !== 'live') return 1;
            return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
          })
          .slice(0, 3);

        setMatches(relevantMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select(`
            *,
            profiles:author_id(full_name)
          `)
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setNews(data || []);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchMatches();
    fetchNews();
  }, []);

  // Filter upcoming matches that have tickets available
  const upcomingMatches = matches.filter(match => {
    const matchDate = new Date(match.match_date);
    const now = new Date();
    return match.status === 'scheduled' && matchDate > now;
  });

  const trendingTopics = ["Transfer Window", "Liga 1 Indonesia", "Laskar Rencong", "Stadion Harapan Bangsa", "SKULL Supporters"];
  const filteredNews = news;
  return <div className="min-h-screen bg-background">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Live Scores Section */}
      <section className="py-6 md:py-12 bg-card/50">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-0.5 md:w-1 h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-lg md:text-3xl font-bold mobile-title">Skor Langsung</h2>
              <Badge variant="destructive" className="animate-pulse text-xs">LIVE</Badge>
            </div>
            <Button variant="outline" size="sm" className="mobile-button">
              Lihat Semua
              <ArrowRight className="ml-1 md:ml-2 h-3 md:h-4 w-3 md:w-4" />
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {matches.map((match, index) => <Card key={match.id || index} className="group hover:shadow-lg transition-all duration-300 border-l-2 md:border-l-4 border-l-green-500 mobile-card">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 space-y-2 md:space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm md:text-lg mobile-title">{match.home_team}</span>
                          <span className="text-xl md:text-3xl font-bold text-primary">{match.home_score || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm md:text-lg mobile-title">{match.away_team}</span>
                          <span className="text-xl md:text-3xl font-bold text-primary">{match.away_score || 0}</span>
                        </div>
                      </div>
                      <div className="ml-3 md:ml-6 text-center">
                        <Badge variant={match.status === "live" ? "destructive" : "secondary"} className={`text-xs ${match.status === "live" ? "animate-pulse" : ""}`}>
                          {match.status === "live" ? "LIVE" : match.status?.toUpperCase() || "UPCOMING"}
                        </Badge>
                        <div className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2 mobile-subtitle">
                          {match.status === "live" ? "Live" : new Date(match.match_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          )}
        </div>
      </section>

      {/* News Section */}
      <section className="py-6 md:py-16 px-3 md:px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-10">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-0.5 md:w-1 h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-lg md:text-3xl font-bold mobile-title">Berita Terbaru</h2>
            </div>
            <Link to="/news">
              <Button variant="outline" size="sm" className="mobile-button">
                Lihat Semua
                <ArrowRight className="ml-1 md:ml-2 h-3 md:h-4 w-3 md:w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Category Filter */}
          <div className="mb-4 md:mb-10">
            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full bg-background border border-border">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  {categories.map(category => <SelectItem key={category} value={category} className="text-foreground hover:bg-accent">
                      {category}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Desktop Buttons */}
            <div className="hidden md:flex gap-3">
              {categories.map(category => <Button key={category} variant={selectedCategory === category ? "default" : "outline"} onClick={() => setSelectedCategory(category)} className="rounded-full px-6 py-2 text-sm transition-all duration-200 hover:scale-105 whitespace-nowrap">
                  {category}
                </Button>)}
            </div>
          </div>

          {/* Featured News Grid */}
          {newsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {filteredNews.map(article => <Card key={article.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 mobile-card">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img src={article.featured_image || '/placeholder.svg'} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <Badge className="absolute top-2 md:top-4 left-2 md:left-4 bg-primary/90 backdrop-blur-sm text-xs">
                      Berita
                    </Badge>
                  </div>
                  <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors duration-200 text-sm md:text-base mobile-title">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-muted-foreground text-xs md:text-sm mobile-compact">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 p-3 md:p-6">
                    <div className="flex justify-between items-center text-xs md:text-sm text-muted-foreground mobile-subtitle">
                      <span className="font-medium">{article.profiles?.full_name || 'Admin'}</span>
                      <span>{new Date(article.published_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Belum ada berita tersedia</p>
          )}
        </div>
      </section>

      {/* Upcoming Matches */}
      <section className="py-6 md:py-16 bg-muted/30 px-3 md:px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-10">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-0.5 md:w-1 h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-lg md:text-3xl font-bold mobile-title">Pertandingan Mendatang</h2>
            </div>
            <Link to="/tickets">
              <Button variant="outline" size="sm" className="mobile-button">
                Lihat Semua
                <ArrowRight className="ml-1 md:ml-2 h-3 md:h-4 w-3 md:w-4" />
              </Button>
            </Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada pertandingan mendatang</h3>
              <p className="text-muted-foreground">
                Pertandingan baru akan segera ditambahkan
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-8">
              {upcomingMatches.map(match => <Card key={match.id} className="group p-4 md:p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mobile-card">
                  <div className="flex justify-between items-center mb-3 md:mb-6">
                    <Badge variant="outline" className="text-xs md:text-sm px-2 md:px-3 py-1">{match.competition || 'Liga 1'}</Badge>
                    <Badge className="bg-green-500 animate-pulse text-xs">Tiket Tersedia</Badge>
                  </div>
                  
                  {/* Match Teams with Logos */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 mb-2 flex items-center justify-center">
                        {match.home_team_logo ? (
                          <img 
                            src={match.home_team_logo} 
                            alt={match.home_team}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {match.home_team.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-sm md:text-base text-center">{match.home_team}</span>
                    </div>
                    
                    <div className="px-4">
                      <span className="text-2xl md:text-3xl font-bold text-muted-foreground">VS</span>
                    </div>
                    
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 mb-2 flex items-center justify-center">
                        {match.away_team_logo ? (
                          <img 
                            src={match.away_team_logo} 
                            alt={match.away_team}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {match.away_team.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-sm md:text-base text-center">{match.away_team}</span>
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(match.match_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(match.match_date).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </span>
                    </div>
                    {match.venue && (
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{match.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Buy Ticket Button */}
                  <Link to={`/tickets/purchase/${match.id}`}>
                    <Button className="w-full py-3 md:py-6 text-sm md:text-lg font-semibold hover:scale-105 transition-all duration-200 mobile-button">
                      <Ticket className="mr-2 md:mr-3 h-4 md:h-5 w-4 md:w-5" />
                      Beli Tiket
                    </Button>
                  </Link>
                </Card>)}
            </div>
          )}
        </div>
      </section>

      {/* Community Section */}
      <section className="py-8 md:py-16 bg-card border-y border-border">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <h3 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 mobile-title text-foreground">Dukung Persiraja!</h3>
          <p className="text-sm md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto mobile-compact text-muted-foreground">
            Bergabunglah dengan SKULL (Suporter Kutaraja Untuk Lantak Laju) - Komunitas suporter terbesar Aceh
          </p>
          <Button size="lg" variant="default" className="px-4 md:px-8 py-3 md:py-4 text-sm md:text-lg font-semibold mobile-button" onClick={() => {
          window.open('https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20bergabung%20dengan%20komunitas%20SKULL%20Persiraja', '_blank');
        }}>
            <Users className="mr-2 md:mr-3 h-4 md:h-6 w-4 md:w-6" />
            Gabung Komunitas
          </Button>
        </div>
      </section>

      {/* Trending Topics */}
      
    </div>;
}