import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Clock, Loader2, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog } from "@/components/ui/login-dialog";
import { toast } from "sonner";

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedArticles, setDisplayedArticles] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { isAuthenticated } = useAuth();

  const categories = [
    { id: "all", label: "Semua" },
    { id: "liga1", label: "Liga 1" },
    { id: "international", label: "Internasional" },
    { id: "timnas", label: "Timnas" },
    { id: "transfer", label: "Transfer" },
    { id: "opinion", label: "Opini" },
  ];

  useEffect(() => {
    fetchNews();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('news-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'news' },
        () => fetchNews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          profiles:author_id(full_name)
        `)
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching news:', error);
        setArticles([]);
      } else {
        setArticles(data || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === "all" || (article.category && article.category.toLowerCase().includes(selectedCategory));
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const articlesToShow = filteredArticles.slice(0, displayedArticles);
  const hasMoreArticles = filteredArticles.length > displayedArticles;

  const handleLikeArticle = async (articleId: string) => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    
    // Here you can implement the actual like functionality
    toast.success("Artikel disukai!");
  };

  const handleLoadMore = () => {
    setDisplayedArticles(prev => prev + 6);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Berita Sepak Bola</h1>
          <p className="text-muted-foreground text-lg">
            Update terkini seputar dunia sepak bola Indonesia dan internasional
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berita..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Article (First article) */}
        {articlesToShow.length > 0 && (
          <Link to={`/news/${articlesToShow[0].id}`}>
            <Card className="mb-8 group cursor-pointer hover:bg-card/80 transition-colors">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="aspect-video lg:aspect-square bg-muted overflow-hidden rounded-l-lg">
                    <img 
                      src={articlesToShow[0].featured_image || "/placeholder.svg"} 
                      alt={articlesToShow[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{articlesToShow[0].category || 'Berita'}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(articlesToShow[0].published_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {articlesToShow[0].title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {articlesToShow[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Oleh {articlesToShow[0].profiles?.full_name || 'Admin'}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        3 min
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articlesToShow.slice(1).map((article) => (
            <Link key={article.id} to={`/news/${article.id}`}>
              <Card className="group cursor-pointer hover:bg-card/80 transition-colors h-full">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg mb-4 overflow-hidden">
                    <img 
                      src={article.featured_image || "/placeholder.svg"} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{article.category || 'Berita'}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.published_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Oleh {article.profiles?.full_name || 'Admin'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          3 min
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLikeArticle(article.id);
                          }}
                          className="h-6 w-6 p-0 hover:text-red-500"
                        >
                          <Heart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-0">
                  <Skeleton className="aspect-video rounded-t-lg mb-4" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMoreArticles && !isLoading && (
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleLoadMore}
            >
              Muat Lebih Banyak
            </Button>
          </div>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              Tidak ada berita yang ditemukan
            </p>
            <Button onClick={() => {setSearchQuery(""); setSelectedCategory("all"); setDisplayedArticles(7);}}>
              Reset Filter
            </Button>
          </div>
        )}

        <LoginDialog 
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title="Login untuk Menyukai Artikel"
          description="Silakan login terlebih dahulu untuk menyukai artikel."
        />
      </div>
    </div>
  );
}