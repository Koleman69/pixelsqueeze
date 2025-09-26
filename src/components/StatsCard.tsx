import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: ReactNode;
  subtitle?: string;
}

export const StatsCard = ({ title, value, change, icon, subtitle }: StatsCardProps) => {
  const isPositive = change && !change.startsWith('-');
  
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold group-hover:text-primary transition-colors">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
              {change}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
    </Card>
  );
};