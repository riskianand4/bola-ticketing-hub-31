import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Clock, Users, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TicketsPage() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState([]);

  const filters = [
    { id: "all", label: "Semua" },
    { id: "available", label: "Tersedia" },
    { id: "liga1", label: "Liga 1" },
    { id: "timnas", label: "Timnas" },
    { id: "international", label: "Internasional" },
  ];

  useEffect(() => {
    fetchMatches();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('matches-tickets-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        () => fetchMatches()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          tickets(*)
        `)
        .order('match_date', { ascending: true });

      if (error) {
        console.error('Error fetching matches:', error);
      } else {
        // Kategorikan pertandingan berdasarkan status dan waktu
        const categorizedMatches = (data || []).map(match => {
          const matchDate = new Date(match.match_date);
          const matchEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
          
          let ticketStatus = 'available';
          
          // Jika pertandingan sudah selesai (status finished atau sudah lewat 2 jam)
          if (match.status === 'finished' || now > matchEndTime) {
            ticketStatus = 'expired';
          }
          // Jika pertandingan sedang berlangsung
          else if (match.status === 'live' || (now >= matchDate && now <= matchEndTime)) {
            ticketStatus = 'ongoing';
          }
          // Jika pertandingan belum dimulai dan masih scheduled
          else if (match.status === 'scheduled' && now < matchDate) {
            ticketStatus = 'available';
          }

          return {
            ...match,
            ticketStatus
          };
        });

        // Filter hanya pertandingan yang tiketnya masih tersedia atau sedang berlangsung
        const availableMatches = categorizedMatches.filter(match => 
          match.ticketStatus === 'available' || match.ticketStatus === 'ongoing'
        );
        
        setMatches(availableMatches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const filteredMatches = matches.filter(match => {
    const hasTickets = match.tickets && match.tickets.length > 0;
    const matchesFilter = selectedFilter === "all" || 
                         (selectedFilter === "available" && hasTickets);
    const matchesSearch = match.home_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.away_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.competition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tiket Pertandingan</h1>
          <p className="text-muted-foreground text-lg">
            Dapatkan tiket pertandingan sepak bola favorit Anda dengan mudah dan aman
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pertandingan, tim, atau stadion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.id)}
                className="rounded-full"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMatches.map((match) => (
              <Card key={match.id} className="bg-card border-border overflow-hidden">
                <CardContent className="p-0">
                  {/* Match Header */}
                  <div className="bg-primary/5 p-4 border-b border-border">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {match.competition}
                      </Badge>
                      {/* Status Badge */}
                      {match.ticketStatus === 'expired' ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700">Kadaluarsa</Badge>
                      ) : match.ticketStatus === 'ongoing' ? (
                        <Badge variant="destructive" className="animate-pulse">Sedang Berlangsung</Badge>
                      ) : match.tickets && match.tickets.length > 0 ? (
                        <Badge variant="default" className="bg-success">Tersedia</Badge>
                      ) : (
                        <Badge variant="secondary">Segera</Badge>
                      )}
                    </div>
                    
                    {/* Teams */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{match.home_team.slice(0, 3).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm">{match.home_team}</p>
                          <p className="text-xs text-muted-foreground">Home</p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">VS</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-bold text-sm text-right">{match.away_team}</p>
                          <p className="text-xs text-muted-foreground text-right">Away</p>
                        </div>
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{match.away_team.slice(0, 3).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(match.match_date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(match.match_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{match.venue}</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    {match.tickets && match.tickets.length > 0 && (
                      <div className="bg-muted/30 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Harga tiket</p>
                            <p className="font-bold text-secondary">
                              {formatPrice(Math.min(...match.tickets.map(t => t.price)))} - {formatPrice(Math.max(...match.tickets.map(t => t.price)))}
                            </p>
                          </div>
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      size="lg"
                      disabled={match.ticketStatus === 'expired' || !match.tickets || match.tickets.length === 0}
                      onClick={() => {
                        if (match.tickets && match.tickets.length > 0 && match.ticketStatus !== 'expired') {
                          window.location.href = `/tickets/purchase/${match.id}`;
                        }
                      }}
                    >
                      {match.ticketStatus === 'expired' ? "Tiket Kadaluarsa" : 
                       match.ticketStatus === 'ongoing' ? "Pertandingan Berlangsung" :
                       match.tickets && match.tickets.length > 0 ? "Beli Tiket Sekarang" : "Segera Tersedia"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              Tidak ada pertandingan yang ditemukan
            </p>
            <Button onClick={() => {setSearchQuery(""); setSelectedFilter("all");}}>
              Reset Filter
            </Button>
          </div>
        )}

        {/* Load More */}
        {filteredMatches.length > 0 && (
          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              Lihat Lebih Banyak Pertandingan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}