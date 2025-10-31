import { motion, Reorder } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/config/api';

// Fallback icon mapping for categories without images
const fallbackCategoryIcons = {
  "Electronics": "📱",
  "Fashion": "👕",
  "Food": "🍕",
  "Home": "🏠",
  "Books": "📚",
  "Sports": "⚽",
  "Beauty": "💄",
  "Toys": "🧸",
  "Jewelry": "💍",
  "Furniture": "🪑",
  "Automotive": "🚗",
  "Health": "💊",
  "Pet Supplies": "🐕",
  "Stationery": "✏️",
  "Garden": "🌳",
  "Kids": "👶",
  "Appliances": "🔌",
  "Hardware": "🔧",
  "Crafts": "🎨",
  "Travel": "🧳",
  "Grocery": "🛒",
  "Vegetables": "🥬",
  "Fruits": "🍎",
  "Dairy": "🥛",
  "Meat": "🥩",
  "Bakery": "🍞",
  "Beverages": "🥤",
  "Snacks": "🍿",
  "Organic": "🌱"
};

interface Category {
  id: number;
  name: string;
  icon: string;
  hasImage: boolean;
}

export function CategoryScroll() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Derive API host from API_BASE (remove trailing /api or /api/)
  const API_HOST = API_BASE.replace(/\/api\/?$/i, '');

  // Fetch real categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_BASE + "categories/");
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (data.categories) {
          const formattedCategories = data.categories.map((cat, index) => {
            const rawIcon = cat.icon || cat.icon_url || '';
            // If icon is a relative path (starts with '/'), prefix with API host
            const iconFull = rawIcon && rawIcon.startsWith('/') ? `${API_HOST}${rawIcon}` : rawIcon;
            return {
              id: cat.id || index + 1,
              name: cat.name,
              icon: iconFull || fallbackCategoryIcons[cat.name] || "📦",
              hasImage: !!rawIcon // Track if category originally had an image
            };
          });
          setCategories(formattedCategories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to empty array on error
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="px-2 py-2 bg-gray-50">
        <div className="flex gap-3 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-16">
              <div className="w-full p-1 rounded-xl bg-gray-200 animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="px-2 py-2 bg-gray-50">
        <div className="text-center text-gray-500 text-sm py-4">
          No categories available
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 bg-gray-50">
      <div 
        className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            className="flex-none px-3 py-1 rounded-xl font-medium text-center transition-all duration-200 bg-white text-gray-800 hover:bg-gray-100 active:scale-95 focus:outline-none min-w-16 touch-manipulation"
            onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
          >
            <div className="mb-1 flex items-center justify-center h-8">
              {category.hasImage ? (
                <img 
                  src={category.icon} 
                  alt={category.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    const img = e.target as HTMLImageElement;
                    if (img) {
                      img.style.display = 'none';
                      const next = img.nextSibling as HTMLElement | null;
                      if (next) next.style.display = 'block';
                    }
                  }}
                />
              ) : (
                <div className="text-2xl">{category.icon}</div>
              )}
              {category.hasImage && (
                <div className="text-2xl" style={{ display: 'none' }}>
                  {fallbackCategoryIcons[category.name] || "📦"}
                </div>
              )}
            </div>
            <div className="text-xs font-semibold whitespace-nowrap">{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}