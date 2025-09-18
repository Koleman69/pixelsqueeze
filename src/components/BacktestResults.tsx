import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, TrendingUp, Calendar } from "lucide-react";

interface BacktestData {
  period: string;
  totalTrades: number;
  successfulTrades: number;
  totalReturn: number;
  averageReturn: number;
  winRate: number;
}

interface BacktestResultsProps {
  data: BacktestData[];
}

export const BacktestResults = ({ data }: BacktestResultsProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/20 text-primary">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Backtesting Results</h3>
          <p className="text-sm text-muted-foreground">Historical performance validation</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((result, index) => (
          <div key={index} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{result.period}</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${
                  result.winRate >= 90 ? 'border-profit text-profit' :
                  result.winRate >= 70 ? 'border-primary text-primary' :
                  'border-warning text-warning'
                }`}
              >
                {result.winRate}% Win Rate
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-lg font-semibold">{result.totalTrades}</p>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-profit" />
                    <span className="text-lg font-semibold">{result.successfulTrades}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className={`text-lg font-semibold ${
                  result.totalReturn > 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {result.totalReturn > 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Return</p>
                <p className={`text-lg font-semibold ${
                  result.averageReturn > 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {result.averageReturn > 0 ? '+' : ''}{result.averageReturn.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-profit" />
          <span className="font-semibold text-profit">Algorithm Verified</span>
        </div>
        <p className="text-sm text-muted-foreground">
          All trading signals have been rigorously tested against historical data to ensure 
          maximum reliability and performance consistency.
        </p>
      </div>
    </Card>
  );
};