import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import persirajaLogo from '@/assets/persiraja-logo.png';

export function ChatBot() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/assistant')}
      className="fixed bottom-6 md:bottom-6 bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-white border-2 border-primary/20 hover:border-primary/40"
      size="icon"
      title="Asisten Persiraja"
    >
      <img 
        src={persirajaLogo} 
        alt="Asisten Persiraja" 
        className="h-8 w-8 object-contain"
      />
    </Button>
  );
}