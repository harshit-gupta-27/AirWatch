import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Building,
  Megaphone,
  Shield,
  CheckCircle2,
} from 'lucide-react';

const categoryIcons = {
  policy: AlertTriangle,
  infrastructure: Building,
  awareness: Megaphone,
  enforcement: Shield,
};

const priorityColors = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-accent text-accent-foreground',
  low: 'bg-secondary text-secondary-foreground',
};

const Recommendations = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetchDashboard(),
    refetchInterval: 60000,
  });

  const recommendations = data?.recommendations || [];
  const highPriorityRecs = recommendations.filter((r) => r.priority === 'high');
  const otherRecs = recommendations.filter((r) => r.priority !== 'high');

  return (
    <section id="actions" className="py-16 bg-background">
      <div className="container">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground">Action Recommendations</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Built from this fetch’s AQI, main pollutant, source mix, and wind — not a saved list.
          </p>
        </div>

        {isLoading && (
          <p className="text-muted-foreground">Writing actions from the latest readings…</p>
        )}
        {error && (
          <p className="text-destructive">{error.message}</p>
        )}

        {highPriorityRecs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">High Priority Actions</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highPriorityRecs.map((rec, index) => {
                const Icon = categoryIcons[rec.category] || AlertTriangle;
                return (
                  <Card
                    key={rec.id}
                    className="border-destructive/30 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                          <Icon className="h-5 w-5 text-destructive" />
                        </div>
                        <Badge className={priorityColors[rec.priority]}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <CardTitle className="text-base mt-3">{rec.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription className="text-sm">
                        {rec.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1">
                        {(rec.targetWards || []).map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {otherRecs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Additional Recommendations</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {otherRecs.map((rec, index) => {
                const Icon = categoryIcons[rec.category] || Shield;
                return (
                  <div
                    key={rec.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-foreground text-sm">{rec.title}</h4>
                        <Badge variant="outline" className="shrink-0 text-xs capitalize">
                          {rec.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(rec.targetWards || []).map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
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

export default Recommendations;
