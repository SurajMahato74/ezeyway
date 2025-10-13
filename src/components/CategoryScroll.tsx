import { motion, Reorder } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/config/api';

// Icon mapping for categories
const categoryIcons = {
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

export function CategoryScroll() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch real categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_BASE + "categories/");
        const data = await response.json();
        if (response.ok && data.categories) {
          const formattedCategories = data.categories.map((cat, index) => ({
            id: cat.id || index + 1,
            name: cat.name,
            icon: categoryIcons[cat.name] || "📦" // Default icon if not found
          }));
          setCategories(formattedCategories);
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
            <div className="text-2xl mb-1">{category.icon}</div>
            <div className="text-xs font-semibold whitespace-nowrap">{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}