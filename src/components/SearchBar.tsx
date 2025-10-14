import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { locationService } from "@/services/locationService";
import { authService } from "@/services/authService";

import { API_BASE } from '@/config/api';

// Google Maps precision Haversine formula with higher precision
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Convert to numbers with full precision
  const lat1Num = parseFloat(lat1);
  const lon1Num = parseFloat(lon1);
  const lat2Num = parseFloat(lat2);
  const lon2Num = parseFloat(lon2);

  const R = 6371000; // Earth's radius in meters for higher precision
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2Num - lat1Num);
  const dLon = toRad(lon2Num - lon1Num);
  const lat1Rad = toRad(lat1Num);
  const lat2Rad = toRad(lat2Num);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) / 1000; // Convert back to km
};

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      performSearch(searchQuery.trim());
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const performSearch = async (query) => {
    setLoading(true);
    try {
      const token = await authService.getToken();
      const headers = token ? { Authorization: `Token ${token}` } : {};

      const currentLocation = locationService.getLocation();

      const params = new URLSearchParams({
        search: query,
        page_size: '5' // Limit results for dropdown
      });

      if (currentLocation) {
        params.append('latitude', currentLocation.latitude.toString());
        params.append('longitude', currentLocation.longitude.toString());
      }

      const productsResponse = await fetch(`${API_BASE}search/products/?${params}`, { headers });
      const productsData = await productsResponse.json();

      const processedProducts = processProducts(productsData.results || []);
      setSearchResults(processedProducts);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processProducts = (products) => {
    const currentLocation = locationService.getLocation();

    return products.map(product => {
      const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

      let distance = "N/A";
      if (currentLocation && product.vendor_latitude && product.vendor_longitude) {
        distance = `${calculateDistance(
          currentLocation.latitude, currentLocation.longitude,
          product.vendor_latitude, product.vendor_longitude
        ).toFixed(1)} km`;
      }

      return {
        id: product.id,
        name: product.name,
        vendor: product.vendor_name || "Unknown Vendor",
        price: `₹${product.price}`,
        image: primaryImage?.image_url || "/placeholder-product.jpg",
        distance,
        category: product.category
      };
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
    setShowDropdown(false);
    setSearchQuery("");
  };

  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  return (
    <div className="px-3 py-2 bg-background relative">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, vendors..."
            value={searchQuery}
            onChange={handleInputChange}
            className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border/50 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth"
          />
        </div>
      </form>

      {/* Search Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-3 right-3 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{product.vendor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-primary">{product.price}</span>
                      <span className="text-xs text-muted-foreground">{product.distance}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-3 border-t border-border">
                <button
                  onClick={handleViewAllResults}
                  className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            </>
          ) : searchQuery.trim().length > 1 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}