import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface CompressionData {
  period: string;
  filesProcessed: number;
  averageCompression: number;
  spaceSaved: number;
}

interface CompressionResultsProps {
  data: CompressionData[];
}

export const CompressionResults = ({ data }: CompressionResultsProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Compression Analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All compression results are based on advanced algorithms that maintain visual quality while maximizing file size reduction.
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="averageCompression" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-profit">95%</p>
            <p className="text-sm text-muted-foreground">Average Quality Retained</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">68%</p>
            <p className="text-sm text-muted-foreground">Average Space Saved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">2.3s</p>
            <p className="text-sm text-muted-foreground">Average Processing Time</p>
          </div>
        </div>
      </Card>
    </div>
  );
};