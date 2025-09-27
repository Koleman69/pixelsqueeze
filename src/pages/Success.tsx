import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown } from 'lucide-react';

export const Success = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Welcome to Pixel Squeeze Pro!</h1>
        
        <p className="text-muted-foreground mb-6">
          Your subscription has been activated successfully. You now have access to:
        </p>
        
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <span>Unlimited image compression</span>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <span>Custom DPI settings up to 300</span>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <span>Large image sizes up to 4096px</span>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <span>Bulk download functionality</span>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <span>Premium quality up to 100%</span>
          </div>
        </div>
        
        <Badge className="bg-gradient-primary mb-6">
          <Crown className="w-4 h-4 mr-2" />
          Pro User
        </Badge>
        
        <Button 
          className="w-full bg-gradient-primary" 
          onClick={() => window.location.href = '/'}
        >
          Start Compressing Images
        </Button>
      </Card>
    </div>
  );
};

export default Success;