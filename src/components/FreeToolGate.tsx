import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Mail, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const FREE_TOOL_LIMIT = 4;

interface ToolQuotaContextValue {
  email: string | null;
  used: number;
  remaining: number;
  unlimited: boolean;
  consume: (amount?: number) => Promise<boolean>;
}

const ToolQuotaContext = createContext<ToolQuotaContextValue | null>(null);

export const useToolQuota = () => useContext(ToolQuotaContext);

const EMAIL_KEY = "pixelsqueeze_free_email";
const emailRe = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

interface Props {
  toolId: string;
  isSubscribed?: boolean;
  children: React.ReactNode;
}

export const FreeToolGate: React.FC<Props> = ({ toolId, isSubscribed, children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmailState] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState("");
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const unlimited = !!isSubscribed;

  // Determine email
  useEffect(() => {
    if (user?.email) {
      setEmailState(user.email);
    } else {
      const stored = localStorage.getItem(EMAIL_KEY);
      if (stored && emailRe.test(stored)) setEmailState(stored);
      else setEmailState(null);
    }
  }, [user]);

  // Load usage
  useEffect(() => {
    let active = true;
    (async () => {
      if (unlimited || !email) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.rpc("get_free_tool_usage", {
        _email: email,
        _tool_id: toolId,
      });
      if (active) {
        if (!error && typeof data === "number") setUsed(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [email, toolId, unlimited]);

  const consume = useCallback(
    async (amount = 1) => {
      if (unlimited) return true;
      if (!email) return false;
      const remaining = FREE_TOOL_LIMIT - used;
      if (amount > remaining) {
        toast({
          title: "Free limit reached",
          description: `You have ${Math.max(remaining, 0)} free credit(s) left for this tool. Upgrade for unlimited access.`,
          variant: "destructive",
        });
        return false;
      }
      const { data, error } = await supabase.rpc("consume_free_tool_usage", {
        _email: email,
        _tool_id: toolId,
        _amount: amount,
      });
      if (error) {
        toast({ title: "Could not update usage", description: error.message, variant: "destructive" });
        return false;
      }
      if (typeof data === "number") setUsed(data);
      return true;
    },
    [email, toolId, unlimited, used, toast]
  );

  const handleSaveEmail = async () => {
    const clean = inputEmail.trim().toLowerCase();
    if (!emailRe.test(clean)) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setSaving(true);
    localStorage.setItem(EMAIL_KEY, clean);
    setEmailState(clean);
    setSaving(false);
  };

  // Email capture gate for guests
  if (!unlimited && !email) {
    return (
      <Card className="p-8 max-w-xl mx-auto glass-card text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Try it free — no account needed</h2>
          <p className="text-muted-foreground">
            Enter your email to unlock <span className="font-semibold text-foreground">{FREE_TOOL_LIMIT} free credits</span> on every tool.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="you@example.com"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveEmail()}
            aria-label="Your email address"
          />
          <Button onClick={handleSaveEmail} disabled={saving} className="glow-btn">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" />Unlock</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          One-time deal per email. No spam. <Link to="/auth" className="underline">Sign in</Link> if you already have an account.
        </p>
      </Card>
    );
  }

  const remaining = unlimited ? Infinity : Math.max(0, FREE_TOOL_LIMIT - used);
  const exhausted = !unlimited && remaining <= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (exhausted) {
    return (
      <Card className="p-8 max-w-xl mx-auto glass-card text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <Crown className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">You've used all {FREE_TOOL_LIMIT} free credits for this tool</h2>
          <p className="text-muted-foreground">
            Upgrade to Pro for unlimited access to every tool on PixelSqueeze.
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button asChild size="lg" className="glow-btn">
            <Link to="/pricing"><Crown className="w-4 h-4 mr-2" />Upgrade to Pro</Link>
          </Button>
          {!user && (
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <ToolQuotaContext.Provider value={{ email, used, remaining: remaining as number, unlimited, consume }}>
      {!unlimited && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border/50 bg-card/60 backdrop-blur px-4 py-2">
          <div className="text-sm text-muted-foreground">
            Free trial: <span className="font-semibold text-foreground">{remaining as number}</span> of {FREE_TOOL_LIMIT} credits left for this tool
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            <Link to="/pricing" className="flex items-center gap-1"><Crown className="w-3 h-3" />Upgrade</Link>
          </Badge>
        </div>
      )}
      {children}
    </ToolQuotaContext.Provider>
  );
};
