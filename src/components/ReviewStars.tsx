import { Star } from "lucide-react";

interface ReviewStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showEmpty?: boolean;
}

export function ReviewStars({ rating, size = "sm", showEmpty = true }: ReviewStarsProps) {
  if (!rating && !showEmpty) return null;
  
  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  const starSize = starSizes[size];
  const fullStars = Math.floor(rating || 0);
  const halfStar = (rating || 0) % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-0.5">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star 
          key={`full-${i}`} 
          className={`${starSize} fill-yellow-400 text-yellow-400`} 
        />
      ))}
      
      {/* Half star */}
      {halfStar && (
        <div className="relative">
          <Star 
            className={`${starSize} text-gray-200`}
          />
          <Star 
            className={`${starSize} absolute left-0 top-0 fill-yellow-400 text-yellow-400`}
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          />
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star 
          key={`empty-${i}`} 
          className={`${starSize} text-gray-200`} 
        />
      ))}
    </div>
  );
}