import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Share, Plus, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Already Installed!</CardTitle>
            <CardDescription>
              Pixelsqueeze is installed on your device. Open it from your home screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Install Pixelsqueeze</h1>
        </div>

        {/* App Preview */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Pixelsqueeze</CardTitle>
            <CardDescription>
              Professional image compression in your pocket. Install for the best experience.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Install Instructions */}
        {isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share className="w-5 h-5" />
                Install on iPhone/iPad
              </CardTitle>
              <CardDescription>Follow these steps to add to your home screen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground">
                    Find the <Share className="w-4 h-4 inline" /> icon at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground">
                    Look for the <Plus className="w-4 h-4 inline" /> Add to Home Screen option
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Tap "Add" to confirm</p>
                  <p className="text-sm text-muted-foreground">
                    Pixelsqueeze will appear on your home screen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Install Now
              </CardTitle>
              <CardDescription>One tap to install Pixelsqueeze on your device</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Install Pixelsqueeze
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Install from Browser Menu
              </CardTitle>
              <CardDescription>Use your browser's install option</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Open browser menu</p>
                  <p className="text-sm text-muted-foreground">
                    Tap the three dots (⋮) in your browser
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Tap "Install app" or "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground">
                    This adds Pixelsqueeze to your device
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Works Offline</p>
                  <p className="text-sm text-muted-foreground">Compress anytime</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Fast Access</p>
                  <p className="text-sm text-muted-foreground">One tap from home screen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Install;
