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

const Index = () => {
  const { setHomeDataLoaded } = useAppLoading();
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);
  const [latestLoaded, setLatestLoaded] = useState(false);

  useEffect(() => {
    if (trendingLoaded && featuredLoaded && latestLoaded) {
      setHomeDataLoaded(true);
    }
  }, [trendingLoaded, featuredLoaded, latestLoaded, setHomeDataLoaded]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <SearchBar />
      <CategoryScroll />
      <BannerCarousel />
      <TrendingItems onDataLoaded={() => setTrendingLoaded(true)} />
      <FeaturedProducts onDataLoaded={() => setFeaturedLoaded(true)} />
      <LatestProducts onDataLoaded={() => setLatestLoaded(true)} />
      <Footer />
      <FloatingChat />
      <BottomNavigation />
    </div>
  );
};

export default Index;
