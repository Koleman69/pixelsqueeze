import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const relatedLinks = [
  { to: "/", label: "Home" },
  { to: "/tools/photo-optimizer", label: "Photo Optimizer" },
  { to: "/tools/ai-image-upscaler", label: "AI Upscaler" },
  { to: "/tools/website-image-compression", label: "Website Compression" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Page Not Found — PixelSqueeze"
        description="The page you're looking for doesn't exist. Explore PixelSqueeze tools for image optimization, AI upscaling, and website speed."
        path={location.pathname}
        noindex
      />
      <main id="main-content" className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full text-center">
          <p className="text-sm font-semibold text-primary mb-2">404</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Page not found</h1>
          <h2 className="text-lg text-muted-foreground mb-8">
            The page at <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">{location.pathname}</code> doesn't exist or has moved.
          </h2>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <Link to="/"><Button><Home className="w-4 h-4 mr-2" />Go home</Button></Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />Go back
            </Button>
          </div>
          <section aria-labelledby="popular">
            <h3 id="popular" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Popular pages</h3>
            <ul className="flex flex-wrap gap-2 justify-center">
              {relatedLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="inline-block px-3 py-1.5 rounded-full border border-border/60 text-sm hover:border-primary hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
};

export default NotFound;
