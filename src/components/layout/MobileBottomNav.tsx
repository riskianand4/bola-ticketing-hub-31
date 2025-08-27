import { Home, Newspaper, Ticket, Users, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
interface MobileBottomNavProps {
  currentPath: string;
}
const navItems = [{
  icon: Home,
  label: "Home",
  path: "/"
}, {
  icon: Newspaper,
  label: "News",
  path: "/news"
}, {
  icon: Ticket,
  label: "Tickets",
  path: "/tickets"
}, {
  icon: Users,
  label: "My Club",
  path: "/my-club"
}, {
  icon: ShoppingBag,
  label: "More",
  path: "/more"
}];

export function MobileBottomNav({
  currentPath
}: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-14 flex items-center justify-around px-1 z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 px-2 py-2 h-12 min-w-0 flex-1 rounded-lg transition-colors",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}