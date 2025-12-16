import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Minimize2 } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy - Pixelsqueeze</title>
        <meta name="description" content="Privacy Policy for Pixelsqueeze image and video compression service." />
      </Helmet>

      {/* Header */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Minimize2 className="w-6 h-6 text-primary mr-2" />
            <span className="text-xl font-bold">Pixelsqueeze</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="section-title mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Pixelsqueeze. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our 
              image and video compression service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information you provide directly to us:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Account information (email address, name) when you register</li>
              <li>Payment information when you subscribe to our Pro plan</li>
              <li>Images and videos you upload for compression (processed and deleted after compression)</li>
              <li>Usage data and analytics to improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide and maintain our compression service</li>
              <li>Process your subscription and payments</li>
              <li>Send you important service updates</li>
              <li>Improve and optimize our platform</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate security measures to protect your personal information. Your uploaded files 
              are processed securely and are not stored permanently on our servers. Compressed files are available 
              for download only during your session and are automatically deleted afterward.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use trusted third-party services to operate our platform, including Stripe for payment processing 
              and Supabase for authentication and data storage. These services have their own privacy policies 
              governing the use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Cancel your subscription at any time</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. We do not use tracking cookies 
              for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy, please contact us through our{" "}
              <Link to="/company" className="text-primary hover:underline">Company page</Link>.
            </p>
          </section>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pixelsqueeze. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
