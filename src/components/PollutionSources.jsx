import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { fetchDashboard } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Factory, Car, Construction, Flame, ChefHat, MoreHorizontal } from 'lucide-react';

const sourceIcons = {
  'Vehicular Emissions': Car,
  Industrial: Factory,
  'Construction Dust': Construction,
  'Waste Burning': Flame,
  'Domestic Cooking': ChefHat,
  Other: MoreHorizontal,
};

const PollutionSources = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetchDashboard(),
    refetchInterval: 60000,
  });

  const pollutionSources = data?.sourceDistribution || [];

  return (
    <section id="sources" className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Pollution Sources</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {data?.sourceNote || 'Estimated from the latest pollutant readings for Delhi wards.'}
          </p>
        </div>

        {isLoading && (
          <p className="text-center text-muted-foreground">Loading live source mix…</p>
        )}
        {error && (
          <p className="text-center text-destructive">{error.message}</p>
        )}

        {pollutionSources.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Source Distribution</CardTitle>
                <CardDescription>Share inferred from today's PM2.5, PM10, NO2, SO2, CO, O3 and dust</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pollutionSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="percentage"
                        nameKey="name"
                        label={({ percentage }) => `${percentage}%`}
                        labelLine={false}
                      >
                        {pollutionSources.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Contribution']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-sm text-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {pollutionSources.map((source, index) => {
                const Icon = sourceIcons[source.name] || MoreHorizontal;
                return (
                  <div
                    key={source.name}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: source.color + '20' }}
                    >
                      <Icon className="h-6 w-6" style={{ color: source.color }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{source.name}</h4>
                      <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${source.percentage}%`,
                            backgroundColor: source.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-foreground">{source.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PollutionSources;
