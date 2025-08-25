import React from "react";
import { BarChart3, Newspaper, Ticket, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AdminMobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainNavItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "news", label: "Berita", icon: Newspaper },
  { id: "tickets", label: "Tiket", icon: Ticket },
  { id: "matches", label: "Pertandingan", icon: Calendar },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export function AdminMobileBottomNav({ activeTab, onTabChange }: AdminMobileBottomNavProps) {
  const navigate = useNavigate();

  const handleTabClick = (tabId: string) => {
    if (tabId === "more") {
      navigate("/admin/more");
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-14 flex items-center justify-around px-1 z-50 md:hidden">
      {mainNavItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        
        return (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col items-center justify-center space-y-0.5 px-1 py-1 h-12 min-w-0 flex-1",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabClick(item.id)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </Button>
        );
      })}
    </nav>
  );
}