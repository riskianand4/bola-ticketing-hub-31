import { Palette, Sun, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'football': return Zap;
      case 'anichin': return Moon;
      default: return Palette;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'default': return 'Persiraja';
      case 'anichin': return 'Anichin';
      case 'light': return 'Light';
      case 'football': return 'Football';
      default: return 'Theme';
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ThemeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {getThemeLabel()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem 
          onClick={() => setTheme('default')}
          className={theme === 'default' ? 'bg-accent' : ''}
        >
          <Palette className="h-4 w-4 mr-2" />
          Persiraja Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="h-4 w-4 mr-2" />
          Light Theme
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('football')}
          className={theme === 'football' ? 'bg-accent' : ''}
        >
          <Zap className="h-4 w-4 mr-2" />
          Football Modern
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('anichin')}
          className={theme === 'anichin' ? 'bg-accent' : ''}
        >
          <Moon className="h-4 w-4 mr-2" />
          Anichin Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}