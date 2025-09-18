import { TradingSignal } from "@/components/TradingSignal";
import { PortfolioCard } from "@/components/PortfolioCard";
import { BacktestResults } from "@/components/BacktestResults";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bell, Shield, TrendingUp, Zap, BarChart3, Target } from "lucide-react";
import heroImage from "@/assets/crypto-hero.jpg";

const mockSignals = [
  {
    coin: "Bitcoin",
    symbol: "BTC",
    currentPrice: 43250.75,
    predictedChange: 12.5,
    probability: 92,
    signal: "buy" as const,
    timeframe: "4-6 hours"
  },
  {
    coin: "Ethereum",
    symbol: "ETH",
    currentPrice: 2580.40,
    predictedChange: -8.2,
    probability: 89,
    signal: "sell" as const,
    timeframe: "2-3 hours"
  },
  {
    coin: "Solana",
    symbol: "SOL",
    currentPrice: 98.15,
    predictedChange: 15.8,
    probability: 94,
    signal: "buy" as const,
    timeframe: "3-5 hours"
  }
];

const backtestData = [
  {
    period: "Last 12 Months",
    totalTrades: 1247,
    successfulTrades: 1152,
    totalReturn: 2847.3,
    averageReturn: 12.4,
    winRate: 92.4
  },
  {
    period: "Last 6 Months", 
    totalTrades: 623,
    successfulTrades: 581,
    totalReturn: 1456.7,
    averageReturn: 13.1,
    winRate: 93.3
  },
  {
    period: "Last 3 Months",
    totalTrades: 312,
    successfulTrades: 289,
    totalReturn: 743.2,
    averageReturn: 11.8,
    winRate: 92.6
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2 border-primary text-primary">
            <Zap className="w-4 h-4 mr-2" />
            90%+ Success Rate Guaranteed
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
            Turn $100 into $10,000
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-powered crypto trading assistant with 90%+ accuracy. 
            Backtested signals, real-time alerts, and systematic growth strategy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-8 py-3">
              <Target className="w-5 h-5 mr-2" />
              Start Trading Challenge
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-3">
              View Backtesting Results
            </Button>
          </div>
        </div>
      </section>

      {/* Portfolio Overview */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Portfolio Challenge Progress</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <PortfolioCard
              title="Current Balance"
              value="$347.85"
              change={24.7}
              icon="balance"
              subtitle="Day 8 of 30"
            />
            <PortfolioCard
              title="Total Profit"
              value="+$247.85"
              change={247.85}
              icon="profit"
              subtitle="247% gain"
            />
            <PortfolioCard
              title="Goal Progress"
              value="3.5%"
              change={0}
              icon="target"
              subtitle="$9,652.15 to go"
            />
            <PortfolioCard
              title="Days Remaining"
              value="22"
              change={0}
              icon="days"
              subtitle="Until challenge ends"
            />
          </div>
        </div>
      </section>

      {/* Live Trading Signals */}
      <section className="py-16 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Live Trading Signals</h2>
              <p className="text-muted-foreground">AI-analyzed opportunities with 90%+ success probability</p>
            </div>
            <Badge variant="outline" className="border-profit text-profit px-4 py-2">
              <Bell className="w-4 h-4 mr-2" />
              3 Active Alerts
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockSignals.map((signal, index) => (
              <TradingSignal key={index} {...signal} />
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Features */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Our Strategy Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-profit rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-profit-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rigorous Backtesting</h3>
              <p className="text-muted-foreground">
                Every signal is validated against 1-2 years of historical data before deployment.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">90%+ Accuracy</h3>
              <p className="text-muted-foreground">
                Advanced AI algorithms identify high-probability trading opportunities with exceptional precision.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Risk Management</h3>
              <p className="text-muted-foreground">
                Color-coded signals and clear exit strategies protect your capital while maximizing returns.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Backtesting Section */}
      <section className="py-16 px-6 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Proven Track Record</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our algorithm has been rigorously tested against historical market data to ensure 
              consistent performance and reliability.
            </p>
          </div>
          
          <BacktestResults data={backtestData} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Trading?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the exclusive challenge and turn $100 into $10,000 in 30 days with AI-powered precision.
          </p>
          
          <Button size="lg" className="bg-gradient-profit text-profit-foreground shadow-profit hover:opacity-90 px-8 py-4 text-lg">
            <TrendingUp className="w-6 h-6 mr-2" />
            Begin $100 Challenge
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            * Based on historical backtesting. Past performance does not guarantee future results.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;