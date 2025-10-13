import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryScroll } from "@/components/CategoryScroll";
import { BannerCarousel } from "@/components/BannerCarousel";
import { TrendingItems } from "@/components/TrendingItems";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { BottomNavigation } from "@/components/BottomNavigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <SearchBar />
      <CategoryScroll />
      <BannerCarousel />
      <TrendingItems />
      <FeaturedProducts />
      <BottomNavigation />
    </div>
  );
};

export default Index;
