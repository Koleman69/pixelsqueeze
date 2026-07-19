import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, X, CheckCircle, ImageDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DISMISS_KEY = "pixelsqueeze_popup_dismissed";
const SHOW_DELAY_MS = 15000; // 15 seconds
const DISMISS_DAYS = 7;

const EmailCapturePopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let armed = false;

    const trigger = () => {
      if (armed) return;
      armed = true;
      setOpen(true);
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    };

    // Exit-intent: mouse leaves toward the top of the viewport
    const onMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget || (e as any).toElement) return;
      if (e.clientY <= 0) trigger();
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return;
      timer = setTimeout(trigger, SHOW_DELAY_MS);
      document.addEventListener("mouseout", onMouseOut);
    });

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // Sign up as a new user (they can set password later)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: { source: "email_popup" },
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Check your email for a magic link!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">You're In!</DialogTitle>
              <DialogDescription className="text-center">
                Check your inbox for a magic link to access your free optimizations.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleDismiss} className="w-full">Got It</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <ImageDown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle>Get 5 Free Optimizations</DialogTitle>
                  <DialogDescription>
                    No credit card required. Start compressing instantly.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span>Up to 70% smaller images — no quality loss</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span>AI-generated alt text & SEO filenames</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span>Works for Shopify, real estate, social media</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Sending…" : "Get Free Access"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailCapturePopup;
