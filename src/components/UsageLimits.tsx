import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Crown, Image, Video, Zap, Lock, Check, Sparkles } from 'lucide-react';

interface UsageLimitsProps {
  imageUsed: number;
  videoUsed: number;
  isSubscribed: boolean;
  isTrialing: boolean;
  trialEndsAt?: string;
  onUpgrade: () => void;
}

const FREE_IMAGE_LIMIT = 3;
const FREE_VIDEO_LIMIT = 1;

export const UsageLimits = ({ 
  imageUsed, 
  videoUsed, 
  isSubscribed, 
  isTrialing,
  trialEndsAt,
  onUpgrade 
}: UsageLimitsProps) => {
  const imageProgress = Math.min((imageUsed / FREE_IMAGE_LIMIT) * 100, 100);
  const videoProgress = Math.min((videoUsed / FREE_VIDEO_LIMIT) * 100, 100);
  const imageRemaining = Math.max(FREE_IMAGE_LIMIT - imageUsed, 0);
  const videoRemaining = Math.max(FREE_VIDEO_LIMIT - videoUsed, 0);
  
  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (isSubscribed && !isTrialing) {
    return (
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                Pro Member
                <Badge className="bg-primary/20 text-primary border-0">Unlimited</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                Unlimited compressions • Priority processing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
        </div>
      </Card>
    );
  }

  if (isTrialing) {
    return (
      <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/20 animate-pulse">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                Pro Trial Active
                <Badge className="bg-amber-500/20 text-amber-700 border-0">
                  {trialDaysRemaining} days left
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                Enjoying unlimited features • Cancel anytime
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onUpgrade}>
            Manage Subscription
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold">Free Plan Usage</span>
        </div>
        <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80" onClick={onUpgrade}>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Image Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <span>Image Compressions</span>
            </div>
            <span className={imageRemaining === 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {imageRemaining === 0 ? (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Limit reached
                </span>
              ) : (
                `${imageRemaining} remaining`
              )}
            </span>
          </div>
          <Progress 
            value={imageProgress} 
            className={`h-2 ${imageRemaining === 0 ? 'bg-destructive/20' : ''}`}
          />
          <p className="text-xs text-muted-foreground">
            {imageUsed} / {FREE_IMAGE_LIMIT} used today
          </p>
        </div>

        {/* Video Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <span>Video Compressions</span>
            </div>
            <span className={videoRemaining === 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {videoRemaining === 0 ? (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Limit reached
                </span>
              ) : (
                `${videoRemaining} remaining`
              )}
            </span>
          </div>
          <Progress 
            value={videoProgress} 
            className={`h-2 ${videoRemaining === 0 ? 'bg-destructive/20' : ''}`}
          />
          <p className="text-xs text-muted-foreground">
            {videoUsed} / {FREE_VIDEO_LIMIT} used today
          </p>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(imageRemaining === 0 || videoRemaining === 0) && (
        <div className="pt-3 border-t">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">Unlock Unlimited Compressions</p>
                <p className="text-sm text-muted-foreground">
                  Start your 3-day free trial • Only $6.95/month after
                </p>
              </div>
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export const FREE_LIMITS = {
  images: FREE_IMAGE_LIMIT,
  videos: FREE_VIDEO_LIMIT
};
