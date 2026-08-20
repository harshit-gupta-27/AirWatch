import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import WardGrid from '@/components/WardGrid';
import PollutionSources from '@/components/PollutionSources';
import Recommendations from '@/components/Recommendations';
import Footer from '@/components/Footer';
import AirQualityChatbot from '@/components/AirQualityChatbot';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <WardGrid />
        <PollutionSources />
        <Recommendations />
      </main>
      <Footer />
      <AirQualityChatbot />
    </div>
  );
};

export default Index;

