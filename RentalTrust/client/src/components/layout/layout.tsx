import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Navigation */}
      <MobileNav setIsMobileOpen={setIsMobileOpen} />
      
      {/* Sidebar Navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6 pb-20 md:pb-6">
        {(title || description) && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                {title && <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>}
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
              </div>
            </div>
          </div>
        )}
        
        {children}
        
        {/* Add padding for mobile bottom nav */}
        <div className="h-16 md:hidden"></div>
      </main>
    </div>
  );
}
