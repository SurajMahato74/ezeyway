import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import bannerGrocery from "@/assets/banner-grocery.jpg";
import bannerElectronics from "@/assets/banner-electronics.jpg";
import bannerFood from "@/assets/banner-food.jpg";

// Fallback banners if no sliders are available from API
const fallbackBanners = [
  {
    id: 1,
    image: bannerGrocery,
    title: "Fresh Groceries",
    subtitle: "Same day delivery",
  },
  {
    id: 2,
    image: bannerElectronics,
    title: "Electronics & Gadgets",
    subtitle: "Best prices guaranteed",
  },
  {
    id: 3,
    image: bannerFood,
    title: "Traditional Food",
    subtitle: "Authentic Nepali cuisine",
  },
];

export function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [sliders, setSliders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Use API sliders if available, otherwise fallback to static banners
  const banners = sliders.length > 0 ? sliders.map(slider => ({
    id: slider.id,
    image: slider.image_url,
    title: slider.title,
    subtitle: slider.description || '',
    link_url: slider.link_url
  })) : fallbackBanners;
  
  const extendedBanners = banners.length > 0 ? [
    banners[banners.length - 1], // Last slide at beginning
    ...banners,
    banners[0] // First slide at end
  ] : [];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const diff = startX - currentX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide < banners.length) {
        setCurrentSlide(prev => prev + 1);
      } else if (diff < 0 && currentSlide > 1) {
        setCurrentSlide(prev => prev - 1);
      }
    }

    setIsDragging(false);
    setCurrentX(0);
  };
  
  const handleBannerClick = (banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank');
    }
  };
  
  // Auto-change slides
  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => prev + 1);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);
  
  // Handle infinite loop
  useEffect(() => {
    if (banners.length > 0) {
      if (currentSlide === extendedBanners.length - 1) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentSlide(1);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 500);
      } else if (currentSlide === 0) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentSlide(banners.length);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 500);
      }
    }
  }, [currentSlide, banners.length]);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const { API_BASE } = await import('@/config/api');
        const response = await fetch(API_BASE + 'sliders/?user_type=customer');
        const data = await response.json();
        
        if (response.ok && data && data.sliders) {
          setSliders(data.sliders);
          setCurrentSlide(1);
        } else {
          setSliders([]);
        }
      } catch (error) {
        console.error('Error fetching sliders:', error);
        setSliders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSliders();
  }, []);

  const getTransformValue = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      if (isDragging) {
        const diff = currentX - startX;
        const maxOffset = 100;
        const offset = (diff / (carouselRef.current?.offsetWidth || 1)) * 100;
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
        return `translateX(calc(-${currentSlide * 100}% + ${clampedOffset}px))`;
      }
      return `translateX(-${currentSlide * 100}%)`;
    } else {
      // Desktop: center main slide with 25% offset to show side previews
      return `translateX(calc(-${currentSlide * 50}% + 25%))`;
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="relative overflow-hidden rounded-2xl shadow-brand h-48 bg-gray-100 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading banners...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="relative md:overflow-visible overflow-hidden md:px-8">
        <div
          ref={carouselRef}
          className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{ transform: getTransformValue() }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {(extendedBanners.length > 0 ? extendedBanners : banners).map((banner, index) => {
            const isMobile = window.innerWidth < 768;
            const isCenter = !isMobile && index === currentSlide;
            return (
              <div 
                key={`${banner.id}-${index}`} 
                className={`flex-shrink-0 relative cursor-pointer transition-all duration-300 ${
                  isMobile ? 'w-full rounded-2xl shadow-brand overflow-hidden' : 
                  `${isCenter ? 'scale-100 opacity-100 z-10' : 'scale-75 opacity-60 z-0'} rounded-lg overflow-hidden`
                }`}
                style={!isMobile ? { width: '50%' } : {}}
                onClick={() => handleBannerClick(banner)}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-48 md:h-auto md:max-h-64 object-cover md:object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* Dots indicator */}
        {banners.length > 1 && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index + 1)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === ((currentSlide - 1 + banners.length) % banners.length) ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}