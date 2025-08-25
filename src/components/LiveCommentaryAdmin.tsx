import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Target, UserX, MessageSquare, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface MatchEvent {
  id: string;
  match_id: string;
  event_type: string;
  event_time: number;
  player_name: string | null;
  description: string;
  team: string | null;
  created_at: string;
}

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  match_date: string;
  venue: string | null;
  competition: string | null;
}

interface LiveCommentaryAdminProps {
  matchId: string;
}

export const LiveCommentaryAdmin = ({ matchId }: LiveCommentaryAdminProps) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [formData, setFormData] = useState({
    event_type: 'comment',
    event_time: '',
    player_name: '',
    description: '',
    team: ''
  });

  const eventTypes = [
    { value: 'goal', label: 'Goal ⚽', icon: Target },
    { value: 'card', label: 'Kartu 🟨', icon: MessageSquare },
    { value: 'substitution', label: 'Pergantian 🔄', icon: UserX },
    { value: 'kickoff', label: 'Kick Off', icon: Play },
    { value: 'halftime', label: 'Half Time', icon: Play },
    { value: 'fulltime', label: 'Full Time', icon: Play },
    { value: 'comment', label: 'Komentar 💬', icon: MessageSquare }
  ];

  const fetchMatchAndEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch match details
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;
      setMatch(matchData);

      // Fetch match events
      const { data: eventsData, error: eventsError } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', matchId)
        .order('event_time', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error: any) {
      console.error('Error fetching match data:', error);
      toast.error('Gagal memuat data pertandingan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchAndEvents();
  }, [matchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        match_id: matchId,
        event_type: formData.event_type,
        event_time: parseInt(formData.event_time),
        player_name: formData.player_name || null,
        description: formData.description,
        team: formData.team === 'none' ? null : formData.team
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('match_events')
          .update(eventData)
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        toast.success('Event berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('match_events')
          .insert([eventData]);
        
        if (error) throw error;
        toast.success('Event berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      fetchMatchAndEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error('Gagal menyimpan event');
    }
  };

  const handleEdit = (event: MatchEvent) => {
    setEditingEvent(event);
    setFormData({
      event_type: event.event_type,
      event_time: event.event_time.toString(),
      player_name: event.player_name || '',
      description: event.description,
      team: event.team || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus event ini?')) return;
    
    try {
      const { error } = await supabase
        .from('match_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Event berhasil dihapus');
      fetchMatchAndEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error('Gagal menghapus event');
    }
  };

  const resetForm = () => {
    setFormData({
      event_type: 'comment',
      event_time: '',
      player_name: '',
      description: '',
      team: ''
    });
  };

  const getEventIcon = (eventType: string) => {
    const eventTypeObj = eventTypes.find(type => type.value === eventType);
    if (eventTypeObj) {
      const IconComponent = eventTypeObj.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <MessageSquare className="h-4 w-4" />;
  };

  const quickAddGoal = (team: 'home' | 'away') => {
    if (!match) return;
    
    setFormData({
      event_type: 'goal',
      event_time: '45',
      player_name: '',
      description: `GOAL untuk ${team === 'home' ? match.home_team : match.away_team}!`,
      team: team
    });
    setIsDialogOpen(true);
  };

  const isMatchActive = () => {
    return match?.status === 'live' || match?.status === 'in_progress';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Pertandingan tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">{match.home_team} vs {match.away_team}</h3>
            <Badge variant={match.status === 'live' ? 'destructive' : 'outline'}>
              {match.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(match.match_date), 'dd MMM yyyy, HH:mm', { locale: id })}
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => quickAddGoal('home')}
              className="text-green-600"
              disabled={!isMatchActive()}
            >
              ⚽ Goal {match.home_team}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => quickAddGoal('away')}
              className="text-green-600"
              disabled={!isMatchActive()}
            >
              ⚽ Goal {match.away_team}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Kelola Komentar Langsung</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { resetForm(); setEditingEvent(null); }} disabled={!isMatchActive()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvent ? 'Edit Event' : 'Tambah Event'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="event_type">Jenis Event</Label>
                    <Select 
                      value={formData.event_type} 
                      onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="event_time">Menit</Label>
                    <Input
                      id="event_time"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      placeholder="45"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="team">Tim</Label>
                    <Select 
                      value={formData.team} 
                      onValueChange={(value) => setFormData({ ...formData, team: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tim (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak ada tim</SelectItem>
                        <SelectItem value="home">{match.home_team}</SelectItem>
                        <SelectItem value="away">{match.away_team}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="player_name">Nama Pemain (Opsional)</Label>
                    <Input
                      id="player_name"
                      value={formData.player_name}
                      onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                      placeholder="Nama pemain"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Deskripsi event..."
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {editingEvent ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada event untuk pertandingan ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.event_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{event.event_time}'</span>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                        {event.team && (
                          <Badge variant="outline" className="text-xs">
                            {event.team === 'home' ? match.home_team : match.away_team}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{event.description}</p>
                      {event.player_name && (
                        <p className="text-xs text-muted-foreground">
                          Pemain: {event.player_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};