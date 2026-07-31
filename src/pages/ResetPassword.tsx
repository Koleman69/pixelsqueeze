import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Minimize2 } from "lucide-react";
import { z } from "zod";
import SEO from "@/components/SEO";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the recovery link (hash or ?code=) and emits PASSWORD_RECOVERY / SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Invalid password", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please re-enter your new password.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ title: "Could not update password", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated", description: "You can now use your new password." });
    navigate("/dashboard");
  };

  return (
    <>
      <SEO
        title="Reset your password — PixelSqueeze"
        description="Set a new password for your PixelSqueeze account."
        path="/reset-password"
        noindex
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Minimize2 className="w-8 h-8 text-primary mr-2" strokeWidth={2.5} />
            <span className="text-3xl font-bold font-brand text-primary">Pixelsqueeze</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Set a new password</CardTitle>
              <CardDescription>
                {ready
                  ? "Choose a new password for your account."
                  : "Open this page from the password reset link in your email."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || !ready}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm new password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading || !ready}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !ready}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
                {!ready && (
                  <Button type="button" variant="link" className="w-full" onClick={() => navigate("/auth")}>
                    Request a new reset link
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
