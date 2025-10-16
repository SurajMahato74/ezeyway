import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryScroll } from "@/components/CategoryScroll";
import { BannerCarousel } from "@/components/BannerCarousel";
import { TrendingItems } from "@/components/TrendingItems";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAppLoading } from "@/contexts/AppLoadingContext";

const Index = () => {
  const { setHomeDataLoaded } = useAppLoading();
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);

  useEffect(() => {
    if (trendingLoaded && featuredLoaded) {
      setHomeDataLoaded(true);
    }
  }, [trendingLoaded, featuredLoaded, setHomeDataLoaded]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <SearchBar />
      <CategoryScroll />
      <BannerCarousel />
      <TrendingItems onDataLoaded={() => setTrendingLoaded(true)} />
      <FeaturedProducts onDataLoaded={() => setFeaturedLoaded(true)} />
      <BottomNavigation />
    </div>
  );
};

export default Index;
