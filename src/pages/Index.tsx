import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryScroll } from "@/components/CategoryScroll";
import { BannerCarousel } from "@/components/BannerCarousel";
import { TrendingItems } from "@/components/TrendingItems";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { LatestProducts } from "@/components/LatestProducts";
import { BottomNavigation } from "@/components/BottomNavigation";

import { Footer } from "@/components/Footer";
import { FloatingChat } from "@/components/FloatingChat";
import { useAppLoading } from "@/contexts/AppLoadingContext";
import { CapacitorUtils } from "@/utils/capacitorUtils";

const Index = () => {
  const { setHomeDataLoaded } = useAppLoading();
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);
  const [latestLoaded, setLatestLoaded] = useState(false);

  console.log('Index component rendered');

  useEffect(() => {
    console.log('useEffect triggered - checking loading states:', { trendingLoaded, featuredLoaded, latestLoaded });
    if (trendingLoaded && featuredLoaded && latestLoaded) {
      console.log('All components loaded, setting home data as loaded');
      setHomeDataLoaded(true);
    } else {
      console.log('Not all components loaded yet');
    }
  }, [trendingLoaded, featuredLoaded, latestLoaded, setHomeDataLoaded]);

  // Debug logging
  useEffect(() => {
    console.log('Index page - Loading states:', { trendingLoaded, featuredLoaded, latestLoaded });
  }, [trendingLoaded, featuredLoaded, latestLoaded]);

  console.log('Index component about to return JSX');
  return (
    <>
      {/* Temporarily removed Helmet to fix the error */}

      <div className="min-h-screen bg-background pb-24">
        <Header />
        <SearchBar />
        <CategoryScroll />
        <BannerCarousel />
        <TrendingItems onDataLoaded={() => {
          console.log('TrendingItems onDataLoaded callback called');
          setTrendingLoaded(true);
        }} />
        <FeaturedProducts onDataLoaded={() => {
          console.log('FeaturedProducts onDataLoaded callback called');
          setFeaturedLoaded(true);
        }} />
        <LatestProducts onDataLoaded={() => {
          console.log('LatestProducts onDataLoaded callback called');
          setLatestLoaded(true);
        }} />
        {!CapacitorUtils.isNative() && <Footer />}
        <FloatingChat />
        <BottomNavigation />
      </div>
    </>
  );
};

export default Index;
