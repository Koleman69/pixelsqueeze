import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, Share2, Twitter, Facebook, Linkedin, Mail } from "lucide-react";
import { toast } from "sonner";

interface ReferralCardProps {
  userId?: string;
}

const ReferralCard = ({ userId }: ReferralCardProps) => {
  const [copied, setCopied] = useState(false);
  
  // Generate referral link based on user ID or a random code
  const referralCode = userId?.slice(0, 8) || "PIXEL2024";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=Check out Pixelsqueeze - the best AI image compression tool!&url=${encodeURIComponent(referralLink)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    email: `mailto:?subject=Try Pixelsqueeze - AI Image Compression&body=I've been using Pixelsqueeze to compress images without losing quality. Check it out: ${referralLink}`,
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pixelsqueeze - AI Image Compression",
          text: "Compress images without losing quality. Try Pixelsqueeze!",
          url: referralLink,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Invite Friends</CardTitle>
            <CardDescription>Share Pixelsqueeze and earn rewards</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Your rewards</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-xs text-muted-foreground">Free compressions per referral</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">20%</p>
              <p className="text-xs text-muted-foreground">Off Pro subscription</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Your referral link</p>
          <div className="flex gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="text-sm bg-muted"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Share via</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(shareLinks.twitter, "_blank")}
              className="hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]"
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(shareLinks.facebook, "_blank")}
              className="hover:bg-[#4267B2]/10 hover:text-[#4267B2] hover:border-[#4267B2]"
            >
              <Facebook className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(shareLinks.linkedin, "_blank")}
              className="hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]"
            >
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(shareLinks.email, "_blank")}
            >
              <Mail className="w-4 h-4" />
            </Button>
            {navigator.share && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
