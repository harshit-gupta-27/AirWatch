import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Users, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { getAQILabel, getAQIColor, getTextAQIColor } from '@/data/pollutionData';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusConfig = {
  'pending': { icon: Clock, color: 'text-aqi-moderate', bgColor: 'bg-aqi-moderate/10', label: 'Pending' },
  'in-progress': { icon: AlertCircle, color: 'text-aqi-unhealthy', bgColor: 'bg-aqi-unhealthy/10', label: 'In Progress' },
  'resolved': { icon: CheckCircle, color: 'text-aqi-good', bgColor: 'bg-aqi-good/10', label: 'Resolved' },
};

const WardCard = ({ ward, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const levelColor = getAQIColor(ward.level);
  const textColor = getTextAQIColor(ward.level);

  const TrendIcon = ward.trend === 'improving' 
    ? TrendingDown 
    : ward.trend === 'worsening' 
      ? TrendingUp 
      : Minus;

  const trendColor = ward.trend === 'improving'
    ? 'text-aqi-good'
    : ward.trend === 'worsening'
      ? 'text-destructive'
      : 'text-muted-foreground';

  const pendingComplaints = (ward.complaints || []).filter(c => c.status !== 'resolved').length;

  return (
    <>
      <Card 
        className="group overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border-border/50 animate-fade-in-up cursor-pointer hover:-translate-y-1"
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${levelColor}`} />
              <h3 className="font-semibold text-foreground text-sm leading-tight">{ward.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {pendingComplaints > 0 && (
                <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                  {pendingComplaints} issues
                </Badge>
              )}
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* AQI Display */}
          <div className="flex items-end gap-3">
            <span className={`text-4xl font-bold ${textColor}`}>{ward.aqi}</span>
            <span className="text-sm text-muted-foreground mb-1">AQI</span>
          </div>

          <Badge 
            variant="secondary" 
            className={`${levelColor} border-0 text-xs font-medium`}
          >
            {getAQILabel(ward.level)}
          </Badge>

          {/* Details */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Population
              </span>
              <span className="font-medium text-foreground">{(ward.population / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Main Pollutant</span>
              <span className="font-medium text-foreground">{ward.mainPollutant}</span>
            </div>
          </div>

          {/* Sources */}
          <div className="flex flex-wrap gap-1">
            {(ward.sources || []).slice(0, 3).map((source) => (
              <span 
                key={source} 
                className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {source}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${levelColor}`} />
              <DialogTitle className="text-xl font-bold">{ward.name}</DialogTitle>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-end gap-2">
                <span className={`text-5xl font-bold ${textColor}`}>{ward.aqi}</span>
                <span className="text-muted-foreground mb-2">AQI</span>
              </div>
              <Badge 
                variant="secondary" 
                className={`${levelColor} border-0 text-sm font-medium`}
              >
                {getAQILabel(ward.level)}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-180px)]">
            <div className="p-6 space-y-6">
              {/* Ward Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{(ward.population / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Population</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-lg font-bold text-foreground">{ward.mainPollutant}</p>
                  <p className="text-xs text-muted-foreground">Main Pollutant</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center flex flex-col items-center justify-center">
                  <TrendIcon className={`h-6 w-6 ${trendColor}`} />
                  <p className="text-xs text-muted-foreground capitalize">{ward.trend}</p>
                </div>
              </div>

              {/* Sources */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Pollution Sources (this fetch)</h4>
                <div className="space-y-2">
                  {(ward.sourceBreakdown || []).length > 0
                    ? ward.sourceBreakdown.map((source) => (
                      <div key={source.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{source.name}</span>
                        <span className="font-medium text-foreground">{source.percentage}%</span>
                      </div>
                    ))
                    : (ward.sources || []).map((source) => (
                      <Badge key={source} variant="outline" className="text-sm mr-2">
                        {source}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Complaints Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">Reported Complaints</h4>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
                    {(ward.complaints || []).length} total
                  </span>
                </div>
                
                {(ward.complaints || []).length === 0 ? (
                  <div className="py-8 text-center rounded-xl bg-secondary/30 border border-dashed border-border">
                    <CheckCircle className="h-8 w-8 text-aqi-good mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No complaints reported</p>
                    <p className="text-xs text-muted-foreground mt-1">This area is doing great!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(ward.complaints || []).map((complaint) => {
                      const StatusIcon = statusConfig[complaint.status]?.icon || Clock;
                      const status = statusConfig[complaint.status] || statusConfig.pending;
                      return (
                        <div 
                          key={complaint.id || complaint._id}
                          className={cn(
                            "p-4 rounded-xl border border-border/50 space-y-3 transition-colors",
                            status.bgColor
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <StatusIcon className={cn("h-4 w-4 shrink-0", status.color)} />
                            <span className="font-medium text-sm text-foreground">{complaint.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{complaint.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                            <span className="flex items-center gap-1">
                              📍 {complaint.location}
                            </span>
                            <span>{complaint.date ? new Date(complaint.date).toLocaleDateString() : ''}</span>
                          </div>
                          {complaint.reportedBy && (
                            <p className="text-xs text-muted-foreground">
                              Reported by: <span className="font-medium">{complaint.reportedBy}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WardCard;
