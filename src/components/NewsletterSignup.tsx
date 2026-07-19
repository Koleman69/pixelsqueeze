import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  source?: string;
  variant?: "card" | "inline";
}

export const NewsletterSignup = ({ source = "blog", variant = "card" }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email, source },
      });
      if (error) throw error;
      setDone(true);
      setEmail("");
      toast({ title: "You're in!", description: "Fresh SEO articles every Tuesday & Friday." });
    } catch (err) {
      toast({ title: "Signup failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        variant === "card"
          ? "relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-8 md:p-10"
          : "rounded-2xl border border-border bg-card p-6"
      }
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold mb-1">Get the PixelSqueeze Newsletter</h3>
          <p className="text-sm text-muted-foreground">
            Two AI-tested image, SEO & content marketing tactics delivered weekly. No spam, unsubscribe anytime.
          </p>
        </div>
      </div>

      {done ? (
        <div className="flex items-center gap-2 text-primary font-medium">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          Subscribed. Check your inbox soon.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor={`newsletter-${source}`} className="sr-only">Email address</label>
          <Input
            id={`newsletter-${source}`}
            type="email"
            required
            placeholder="you@work-email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe free"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default NewsletterSignup;
