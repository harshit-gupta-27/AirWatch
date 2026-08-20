import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, TrendingDown, Users, MapPin } from 'lucide-react';
import { getAQILevel, getAQILabel, getAQIColor } from '@/data/pollutionData';
import { fetchDashboard, formatFetchedAgo } from '@/services/api';

const HeroSection = () => {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetchDashboard(),
    refetchInterval: 60000,
  });

  const wards = data?.wards || [];

  const cityStats = wards.length > 0 ? {
    averageAQI: Math.round(wards.reduce((sum, w) => sum + w.aqi, 0) / wards.length),
    totalPopulation: wards.reduce((sum, w) => sum + w.population, 0),
    wardsAtRisk: wards.filter(w => w.aqi > 100).length,
    wardsImproving: wards.filter(w => w.trend === 'improving').length,
  } : {
    averageAQI: 0,
    totalPopulation: 0,
    wardsAtRisk: 0,
    wardsImproving: 0,
  };

  const cityLevel = getAQILevel(cityStats.averageAQI);
  const levelColor = getAQIColor(cityLevel);
  const fetchedAgo = formatFetchedAgo(data?.fetchedAt);

  return (
    <section id="overview" className="gradient-hero animate-gradient-shift py-16 md:py-24">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground"></span>
              </span>
              Live from WAQI + Open-Meteo{fetchedAgo ? ` • fetched ${fetchedAgo}` : ''}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Ward-Wise Pollution
              <br />
              <span className="text-primary-foreground/80">Action Dashboard</span>
            </h1>

            <p className="text-lg text-primary-foreground/80 max-w-xl">
              Check current AQI by ward, see which areas are worst, and open a
              ward for complaints and pollutant details.
            </p>

            <div className="flex flex-wrap gap-4">
              <a 
                href="#wards" 
                className="inline-flex items-center justify-center rounded-lg bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-lg hover:bg-primary-foreground/90 transition-all hover:scale-105"
              >
                <MapPin className="mr-2 h-4 w-4" />
                View All Wards
              </a>
              <a 
                href="#actions" 
                className="inline-flex items-center justify-center rounded-lg bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/20 transition-all border border-primary-foreground/20"
              >
                See Recommendations
              </a>
            </div>
          </div>

          {/* Right Stats */}
          <div className="grid grid-cols-2 gap-4" style={{ animationDelay: '0.2s' }}>
            {/* City AQI Card */}
            <div className="col-span-2 rounded-2xl bg-primary-foreground/10 backdrop-blur-md p-6 border border-primary-foreground/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/70">City Average AQI</p>
                  <p className="text-5xl font-bold text-primary-foreground mt-2">{cityStats.averageAQI || '--'}</p>
                  {cityStats.averageAQI > 0 && (
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${levelColor}`}>
                      {getAQILabel(cityLevel)}
                    </span>
                  )}
                </div>
                <div className="h-20 w-20 rounded-full bg-primary-foreground/10 flex items-center justify-center animate-pulse-glow">
                  <div className={`h-14 w-14 rounded-full ${levelColor} flex items-center justify-center`}>
                    <span className="text-lg font-bold">AQI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wards at Risk */}
            <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-md p-5 border border-primary-foreground/20">
              <AlertTriangle className="h-8 w-8 text-accent mb-3" />
              <p className="text-3xl font-bold text-primary-foreground">{cityStats.wardsAtRisk}</p>
              <p className="text-sm text-primary-foreground/70">Wards at Risk</p>
            </div>

            {/* Improving */}
            <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-md p-5 border border-primary-foreground/20">
              <TrendingDown className="h-8 w-8 text-aqi-good mb-3" />
              <p className="text-3xl font-bold text-primary-foreground">{cityStats.wardsImproving}</p>
              <p className="text-sm text-primary-foreground/70">Wards Improving</p>
            </div>

            {/* Population Affected */}
            <div className="col-span-2 rounded-2xl bg-primary-foreground/10 backdrop-blur-md p-5 border border-primary-foreground/20">
              <div className="flex items-center justify-between">
                <div>
                  <Users className="h-6 w-6 text-primary-foreground/70 mb-2" />
                  <p className="text-2xl font-bold text-primary-foreground">
                    {cityStats.totalPopulation > 0 ? `${(cityStats.totalPopulation / 1000).toFixed(0)}K` : '--'}
                  </p>
                  <p className="text-sm text-primary-foreground/70">Total Population Monitored</p>
                </div>
                <div className="h-1 flex-1 mx-6 rounded-full gradient-pollution opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
