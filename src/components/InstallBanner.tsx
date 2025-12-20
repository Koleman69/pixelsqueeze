import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Link } from "react-router-dom";

const InstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    
    // Check if previously dismissed (stored in localStorage)
    const wasDismissed = localStorage.getItem("installBannerDismissed");
    
    // Only show on mobile devices that haven't installed
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && !isInstalled && !wasDismissed) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Remember dismissal for 7 days
    localStorage.setItem("installBannerDismissed", Date.now().toString());
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-lg mx-auto">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-primary-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install Pixelsqueeze</p>
          <p className="text-xs text-muted-foreground truncate">
            Add to home screen for quick access
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/install">
            <Button size="sm" className="bg-gradient-primary">
              Install
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
