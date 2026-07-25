import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const Company = () => {
  return (
    <>
      <Helmet>
        <title>About PixelSqueeze — AI Image Compression Company</title>
        <meta name="description" content="Pixelsqueeze LLC — founded 2025, San Antonio, TX. Contact us about professional AI-powered image compression and enhancement." />
        <meta property="og:title" content="About PixelSqueeze — AI Image Compression Company" />
        <meta property="og:description" content="Pixelsqueeze LLC — founded 2025, San Antonio, TX. Contact us about professional AI-powered image compression and enhancement." />
        <meta property="og:url" content="https://pixelsqueeze.app/company" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://pixelsqueeze.app/company" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Pixelsqueeze LLC",
          url: "https://pixelsqueeze.app",
          email: "inquiry@pixelsqueeze.app",
          foundingDate: "2025",
          address: {
            "@type": "PostalAddress",
            streetAddress: "12803 West Ave",
            addressLocality: "San Antonio",
            addressRegion: "TX",
            postalCode: "78216",
            addressCountry: "US",
          },
          areaServed: "Worldwide",
          description: "Professional AI-powered image compression and photo enhancement services.",
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
              Pixelsqueeze
            </Link>
            <div className="flex gap-6">
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/blog" className="text-foreground/80 hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link to="/company" className="text-foreground hover:text-foreground transition-colors font-medium">
                Company
              </Link>
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              About Pixelsqueeze LLC
            </h1>
            
            <p className="text-lg text-muted-foreground mb-12">
              Professional image compression services for businesses and individuals who demand quality.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Contact Us
                  </CardTitle>
                  <CardDescription>Get in touch with our team</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">All inquiries can be sent to:</p>
                  <a 
                    href="mailto:inquiry@pixelsqueeze.app" 
                    className="text-primary hover:underline font-medium text-lg"
                  >
                    inquiry@pixelsqueeze.app
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Our Location
                  </CardTitle>
                  <CardDescription>Serving clients worldwide</CardDescription>
                </CardHeader>
                <CardContent>
                  <address className="not-italic text-foreground">
                    <strong className="block mb-2">Pixelsqueeze LLC</strong>
                    12803 West Ave<br />
                    San Antonio, TX 78216<br />
                    United States
                  </address>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Founded
                  </CardTitle>
                  <CardDescription>Building the future of image compression</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-lg font-medium">2025</p>
                  <p className="text-muted-foreground mt-2">
                    Established to provide cutting-edge image compression solutions with AI-powered enhancements.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Our Mission</CardTitle>
                  <CardDescription>Quality meets efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">
                    To deliver professional-grade image compression that maintains visual excellence while dramatically reducing file sizes.
                  </p>
                </CardContent>
              </Card>
            </div>

            <section className="bg-muted/50 rounded-lg p-8 mb-12">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Why Choose Pixelsqueeze?</h2>
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>AI-powered image transformation and enhancement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Professional-grade compression without quality loss</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>DPI control for print and digital optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Bulk processing and custom sizing options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Fast, secure, and reliable service</span>
                </li>
              </ul>
            </section>

            <div className="text-center">
              <Link to="/">
                <Button size="lg" className="text-lg px-8">
                  Try Pixelsqueeze Now
                </Button>
              </Link>
            </div>
          </article>
        </main>

        <footer className="border-t border-border/40 mt-16">
          <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
            <div className="flex justify-center gap-6 mb-4">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} Pixelsqueeze LLC. All rights reserved.</p>
            <p className="mt-2">San Antonio, TX</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Company;
