import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Calendar } from "lucide-react";

interface PortfolioCardProps {
  title: string;
  value: string;
  change: number;
  icon: "balance" | "profit" | "target" | "days";
  subtitle?: string;
}

export const PortfolioCard = ({ title, value, change, icon, subtitle }: PortfolioCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case "balance": return <DollarSign className="w-5 h-5" />;
      case "profit": return <TrendingUp className="w-5 h-5" />;
      case "target": return <Target className="w-5 h-5" />;
      case "days": return <Calendar className="w-5 h-5" />;
    }
  };

  const isPositive = change >= 0;

  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/50">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${
          icon === 'profit' ? 'bg-profit/20 text-profit' :
          icon === 'target' ? 'bg-primary/20 text-primary' :
          'bg-secondary text-foreground'
        }`}>
          {getIcon()}
        </div>
        {change !== 0 && (
          <div className={`flex items-center text-sm font-semibold ${
            isPositive ? 'text-profit' : 'text-loss'
          }`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};