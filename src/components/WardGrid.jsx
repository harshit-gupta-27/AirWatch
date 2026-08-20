import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import WardCard from './WardCard';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw } from 'lucide-react';
import { fetchDashboard, formatFetchedAgo } from '@/services/api';
import { toast } from 'sonner';

const WardGrid = () => {
  const [filter, setFilter] = useState('all');
  const [sortBy] = useState('aqi');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetchDashboard(),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
    retryDelay: 1000,
  });

  const wards = data?.wards || [];

  const filterButtons = [
    { value: 'all', label: 'All Wards' },
    { value: 'good', label: 'Good', color: 'bg-aqi-good' },
    { value: 'moderate', label: 'Moderate', color: 'bg-aqi-moderate' },
    { value: 'unhealthy', label: 'Unhealthy', color: 'bg-aqi-unhealthy' },
    { value: 'critical', label: 'Critical', color: 'bg-aqi-hazardous' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchDashboard({ force: true });
      queryClient.setQueryData(['dashboard'], fresh);
      toast.success('AQI data refreshed');
    } catch (err) {
      console.error('Error refreshing AQI:', err);
      toast.error(err.message || 'Could not refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredWards = wards
    .filter((ward) => {
      if (filter === 'all') return true;
      if (filter === 'good') return ward.level === 'good';
      if (filter === 'moderate') return ward.level === 'moderate';
      if (filter === 'unhealthy') return ['unhealthy-sensitive', 'unhealthy'].includes(ward.level);
      if (filter === 'critical') return ['very-unhealthy', 'hazardous'].includes(ward.level);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'aqi') return b.aqi - a.aqi;
      return a.name.localeCompare(b.name);
    });

  if (isLoading) {
    return (
      <section id="wards" className="py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading real-time AQI data...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error && wards.length === 0) {
    const errorMessage = error?.message || 'Unknown error';
    return (
      <section id="wards" className="py-16 bg-background">
        <div className="container">
          <div className="text-center py-12">
            <p className="text-destructive mb-4 text-lg font-semibold">Could not load AQI data</p>
            <p className="text-sm text-muted-foreground mb-2">{errorMessage}</p>
            <p className="text-xs text-muted-foreground mb-4">
              Make sure the API is running (`npm run server`) and AQICN_TOKEN is set in `.env`.
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="wards" className="py-16 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Ward-Wise Status</h2>
            <p className="text-muted-foreground mt-1">
              Live AQI from the nearest WAQI station, plus pollutant mix from Open-Meteo
              {data?.fetchedAt && (
                <span className="ml-2 text-xs">
                  • fetched {formatFetchedAgo(data.fetchedAt)}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={filter === btn.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(btn.value)}
                  className="text-xs"
                >
                  {btn.color && (
                    <span className={`h-2 w-2 rounded-full ${btn.color} mr-1.5`} />
                  )}
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8 p-4 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">AQI Scale</span>
          </div>
          <div className="h-3 rounded-full gradient-pollution mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 - Good</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>300+</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWards.map((ward, index) => (
            <WardCard key={ward._id || ward.id} ward={ward} index={index} />
          ))}
        </div>

        {filteredWards.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No wards match the selected filter.
          </div>
        )}
      </div>
    </section>
  );
};

export default WardGrid;
