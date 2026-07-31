import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Check,
  X,
  Zap,
  Palette,
  Rocket,
  Building2,
  Code2,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { startCheckout } from "@/lib/checkout";

const tiers = [
  {
    name: "Free",
    price: 0,
    period: "",
    tagline: "Try it out",
    description: "Manual tools for occasional use",
    icon: Zap,
    cta: "Get Started Free",
    highlight: false,
    features: [
      { text: "25 images/day", included: true },
      { text: "Manual upload only", included: true },
      { text: "Basic compression", included: true },
      { text: "JPEG & PNG output", included: true },
      { text: "Platform presets", included: false },
      { text: "SEO filename generator", included: false },
      { text: "Batch processing", included: false },
      { text: "Website scanner", included: false },
      { text: "Automation & sync", included: false },
    ],
  },
  {
    name: "Creator",
    price: 9,
    period: "/mo",
    tagline: "Save time",
    description: "For bloggers, Etsy sellers & small biz",
    icon: Palette,
    cta: "Start 3-Day Free Trial",
    highlight: false,
    features: [
      { text: "Unlimited manual uploads", included: true },
      { text: "Platform presets (IG, Etsy, eBay, email)", included: true },
      { text: "SEO filename + alt text generator", included: true },
      { text: "Batch rename", included: true },
      { text: "WebP & AVIF conversion", included: true },
      { text: "Remove metadata", included: true },
      { text: "30-day storage history", included: true },
      { text: "Website scanner", included: false },
      { text: "Automation & sync", included: false },
    ],
  },
  {
    name: "Pro",
    price: 19,
    period: "/mo",
    tagline: "Improve performance",
    description: "For websites, marketers & freelancers",
    icon: Rocket,
    cta: "Start 3-Day Free Trial",
    highlight: true,
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Website speed scanner & report", included: true },
      { text: "Bulk processing (500 at once)", included: true },
      { text: "Drag & drop folder upload", included: true },
      { text: "Performance score report", included: true },
      { text: "No watermark on exports", included: true },
      { text: "Before/after comparison exports", included: true },
      { text: "Priority processing", included: true },
      { text: "Automation & sync", included: false },
    ],
  },
  {
    name: "Business",
    price: 39,
    period: "/mo",
    tagline: "Remove the work",
    description: "For agencies, hotels & Shopify stores",
    icon: Building2,
    cta: "Start 3-Day Free Trial",
    highlight: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Auto-optimize watch folder", included: true },
      { text: "Shopify / Drive / Dropbox sync", included: true },
      { text: "Auto-replace images", included: true },
      { text: "Scheduled optimization", included: true },
      { text: "Shareable speed badge", included: true },
      { text: "Team access (3 users)", included: true },
      { text: "Dedicated support", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    name: "API",
    price: 99,
    period: "/mo",
    tagline: "Infrastructure",
    description: "For SaaS platforms & marketplaces",
    icon: Code2,
    cta: "Contact Sales",
    highlight: false,
    features: [
      { text: "Everything in Business", included: true },
      { text: "Full REST API access", included: true },
      { text: "10,000+ monthly auto optimizations", included: true },
      { text: "Webhook processing", included: true },
      { text: "White label mode", included: true },
      { text: "Custom integrations", included: true },
      { text: "Unlimited team members", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Dedicated account manager", included: true },
    ],
  },
];

const SavingsEstimator = () => {
  const [imageCount, setImageCount] = useState([150]);

  const avgSizeKB = 850;
  const compressionRatio = 0.72;
  const savedPerImage = avgSizeKB * compressionRatio;
  const totalSavedKB = savedPerImage * imageCount[0];
  const totalSavedMB = (totalSavedKB / 1024).toFixed(1);

  // Performance estimates
  const loadTimeReduction = Math.min((imageCount[0] * 0.012), 4.2).toFixed(1);
  const conversionLift = (parseFloat(loadTimeReduction) * 7).toFixed(0);
  const annualRevenueLift = (parseFloat(conversionLift) * 120).toFixed(0);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <TrendingUp className="w-3 h-3 mr-1" />
            ROI Calculator
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            See Your Savings in Seconds
          </h2>
          <p className="text-muted-foreground text-lg">
            Drag the slider to estimate your website's performance improvement
          </p>
        </div>

        <Card className="p-6 md:p-10 border-primary/10 bg-gradient-to-br from-card to-secondary/30">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-foreground">
                Images on your website
              </label>
              <span className="text-2xl font-bold text-primary">{imageCount[0]}</span>
            </div>
            <Slider
              value={imageCount}
              onValueChange={setImageCount}
              max={1000}
              min={10}
              step={10}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span>
              <span>1,000</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard
              icon={<Zap className="w-5 h-5 text-primary" />}
              label="Data Saved"
              value={`${totalSavedMB} MB`}
              sublabel="smaller page weight"
            />
            <ResultCard
              icon={<Clock className="w-5 h-5" style={{ color: "hsl(var(--profit-green))" }} />}
              label="Load Time Saved"
              value={`${loadTimeReduction}s`}
              sublabel="faster page load"
            />
            <ResultCard
              icon={<TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--warning-yellow))" }} />}
              label="Conversion Lift"
              value={`+${conversionLift}%`}
              sublabel="estimated improvement"
            />
            <ResultCard
              icon={<DollarSign className="w-5 h-5" style={{ color: "hsl(var(--profit-green))" }} />}
              label="Annual Revenue Impact"
              value={`$${Number(annualRevenueLift).toLocaleString()}`}
              sublabel="estimated gain"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Based on avg 850KB images, 72% compression, and industry conversion benchmarks (Google/Akamai studies).
          </p>
        </Card>
      </div>
    </section>
  );
};

const ResultCard = ({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) => (
  <div className="bg-background rounded-xl p-4 text-center border border-border/60">
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{sublabel}</p>
  </div>
);

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSelectPlan = async (tierName: string) => {
    if (tierName === "Free") {
      navigate("/auth");
      return;
    }
    if (tierName === "API") {
      window.location.href = "mailto:hello@pixelsqueeze.com?subject=API%20%2F%20Enterprise%20Inquiry";
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    setLoadingTier(tierName);
    try {
      await startCheckout();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing — PixelSqueeze AI Photo Enhancer"
        description="Simple plans that pay for themselves. Start free with 4 photos per tool, upgrade for unlimited AI enhancement, batch processing, and cloud storage."
        path="/pricing"
      />
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
            Pixelsqueeze
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/blog" className="text-foreground/80 hover:text-foreground transition-colors hidden sm:inline">
              Blog
            </Link>
            <Link to="/company" className="text-foreground/80 hover:text-foreground transition-colors hidden sm:inline">
              Company
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-8 text-center">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Globe className="w-3 h-3 mr-1" />
            Trusted by 10,000+ websites
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
            Pricing That Pays for Itself
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Free tools for everyone. Paid plans that deliver measurable speed, SEO, and conversion improvements.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3 max-w-7xl mx-auto items-stretch">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isLoading = loadingTier === tier.name;

              return (
                <Card
                  key={tier.name}
                  className={`relative flex flex-col p-5 transition-all duration-200 ${
                    tier.highlight
                      ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02] lg:scale-105"
                      : "border-border/60 hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  {tier.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">
                      Most Popular
                    </Badge>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${tier.highlight ? "bg-primary/15" : "bg-secondary"}`}>
                        <Icon className={`w-5 h-5 ${tier.highlight ? "text-primary" : "text-foreground"}`} />
                      </div>
                      <div>
                        <h2 className="font-bold text-foreground">{tier.name}</h2>
                        <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold text-foreground">
                        ${tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-sm text-muted-foreground">{tier.period}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(tier.name)}
                    disabled={isLoading}
                    className={`w-full mb-4 ${
                      tier.highlight
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : ""
                    }`}
                    variant={tier.highlight ? "default" : "outline"}
                    size="sm"
                  >
                    {isLoading ? "Loading..." : tier.cta}
                    {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>

                  <ul className="space-y-2 flex-1">
                    {tier.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2 text-xs">
                        {f.included ? (
                          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(var(--profit-green))" }} />
                        ) : (
                          <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Savings Estimator */}
      <SavingsEstimator />

      {/* Social proof */}
      <section className="py-12 border-t border-border/40">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Why Speed = Revenue
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div>
              <p className="text-3xl font-bold text-primary">53%</p>
              <p className="text-sm text-muted-foreground mt-1">
                of visitors leave if a page takes &gt;3s to load
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: "hsl(var(--profit-green))" }}>+14%</p>
              <p className="text-sm text-muted-foreground mt-1">
                conversion increase per 1.8s load time reduction
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: "hsl(var(--warning-yellow))" }}>70%</p>
              <p className="text-sm text-muted-foreground mt-1">
                of page weight is typically images
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ-like bottom CTA */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Not sure which plan?
          </h2>
          <p className="text-muted-foreground mb-6">
            Start free. Upgrade when you need automation, scanning, or team access. All paid plans include a 3-day free trial.
          </p>
          <Button size="lg" onClick={() => handleSelectPlan("Free")}>
            Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Pixelsqueeze LLC. All rights reserved.</p>
          <div className="flex gap-4 justify-center mt-3">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/company" className="hover:text-foreground transition-colors">Company</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
