import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  Home, 
  Building2, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, signOut } = useSupabaseAuth();
  const { toast } = useToast();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Fetch unread notifications count
  useEffect(() => {
    if (user) {
      // Fetch from Supabase
      // Implementation would go here
    }
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const navigationItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Properties", href: "/properties", icon: Building2 },
    { name: "Tenants", href: "/tenants", icon: Users },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Reports", href: "/reports", icon: BarChart3 }
  ];
  
  const settingsItems = [
    { name: "Account Settings", href: "/settings", icon: Settings },
    { name: "Notifications", href: "/notifications", icon: Bell }
  ];
  
  const sidebarClasses = cn(
    "flex flex-col w-64 bg-white border-r border-gray-200 h-full transition-all duration-300",
    isMobileOpen 
      ? "absolute inset-0 z-40 md:relative md:inset-auto" 
      : "hidden md:flex"
  );
  
  // Initial letter for avatar fallback
  const getInitials = () => {
    if (!user?.user_metadata?.first_name || !user?.user_metadata?.last_name) return "U";
    return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`;
  };
  
  return (
    <aside id="sidebar" className={sidebarClasses}>
      {/* Close button for mobile */}
      {isMobileOpen && (
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="ml-2 text-xl font-semibold text-primary">RentEZ</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Main
          </p>
          <ul>
            {navigationItems.map(item => (
              <li key={item.name} className="mb-2">
                <Link href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === item.href 
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Settings
          </p>
          <ul>
            {settingsItems.map(item => (
              <li key={item.name} className="mb-2">
                <Link href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === item.href 
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                    {item.name === "Notifications" && unreadNotifications > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {unreadNotifications}
                      </span>
                    )}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.user_metadata?.user_type}
            </p>
          </div>
          <Button
            variant="ghost"
            className="ml-auto p-2 h-auto"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
