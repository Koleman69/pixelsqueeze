import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, CreditCard, Download, User, Mail, Calendar, Shield, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const { user, signOut } = useAuth();
  const { subscription, checkSubscription } = useImageCompression();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
            compressngo
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/blog" className="text-foreground/80 hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link to="/company" className="text-foreground/80 hover:text-foreground transition-colors">
              Company
            </Link>
            <Link to="/account" className="text-foreground hover:text-foreground transition-colors font-medium">
              Account
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold mb-2 text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your account and subscription</p>

          <div className="grid gap-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Subscription Status
                </CardTitle>
                <CardDescription>Current plan and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                    <p className="text-2xl font-bold">
                      {subscription.subscribed ? 'Pro' : 'Free'}
                    </p>
                  </div>
                  <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                    {subscription.subscribed ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {subscription.subscribed && subscription.subscription_end && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Subscription Renews</p>
                    <p className="font-medium">
                      {new Date(subscription.subscription_end).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}

                {!subscription.subscribed && (
                  <div className="p-4 border border-dashed border-primary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Upgrade to Pro to unlock unlimited compressions and AI features
                    </p>
                    <Button 
                      onClick={() => navigate('/')} 
                      variant="default"
                      className="w-full"
                    >
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing & Subscription Management */}
            {subscription.subscribed && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Billing & Subscription Management
                  </CardTitle>
                  <CardDescription>
                    Manage your subscription, payment methods, and download invoices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                      <Download className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Access Stripe Customer Portal</p>
                        <p className="text-sm text-muted-foreground">
                          View billing history, download invoices, update payment methods, and manage your subscription
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleManageSubscription}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Opening Portal...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Manage Subscription & Billing
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 border border-dashed border-destructive/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Need to cancel? You can cancel your subscription anytime through the Stripe portal above.
                      Your access will continue until the end of your billing period.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} compressngo LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Account;
