import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TradingSignalProps {
  coin: string;
  symbol: string;
  currentPrice: number;
  predictedChange: number;
  probability: number;
  signal: "buy" | "hold" | "sell";
  timeframe: string;
}

export const TradingSignal = ({ 
  coin, 
  symbol, 
  currentPrice, 
  predictedChange, 
  probability, 
  signal, 
  timeframe 
}: TradingSignalProps) => {
  const getSignalColor = () => {
    switch (signal) {
      case "buy": return "profit";
      case "sell": return "loss";
      default: return "warning";
    }
  };

  const getSignalIcon = () => {
    switch (signal) {
      case "buy": return <TrendingUp className="w-4 h-4" />;
      case "sell": return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const signalColor = getSignalColor();

  return (
    <Card className="p-6 border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
            {symbol.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{coin}</h3>
            <p className="text-sm text-muted-foreground">{symbol}</p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={`px-3 py-1 font-semibold ${
            signalColor === 'profit' ? 'border-profit text-profit' :
            signalColor === 'loss' ? 'border-loss text-loss' :
            'border-warning text-warning'
          }`}
        >
          {getSignalIcon()}
          <span className="ml-1 uppercase">{signal}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Price</p>
          <p className="text-lg font-semibold">${currentPrice.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Predicted Change</p>
          <p className={`text-lg font-semibold ${
            predictedChange > 0 ? 'text-profit' : 'text-loss'
          }`}>
            {predictedChange > 0 ? '+' : ''}{predictedChange.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Success Probability</span>
          <span className="font-semibold">{probability}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              probability >= 90 ? 'bg-gradient-profit' : 
              probability >= 70 ? 'bg-gradient-primary' : 
              'bg-gradient-loss'
            }`}
            style={{ width: `${probability}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Timeframe: {timeframe}</span>
        <Button 
          size="sm" 
          variant={signal === 'buy' ? 'default' : 'outline'}
          className={signal === 'buy' ? 'bg-gradient-profit hover:opacity-90' : ''}
        >
          {signal === 'buy' ? 'Execute Trade' : 'Monitor'}
        </Button>
      </div>
    </Card>
  );
};