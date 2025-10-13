import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, MapPin, Search, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import '@/assets/leaflet.css';

const customMarkerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const vendorMarkerIcon = L.divIcon({
  className: 'vendor-marker',
  html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
  vendorLocation?: { lat: number; lng: number };
  maxRadius?: number;
  vendorName?: string;
}

export const LocationMap = ({ 
  onLocationSelect, 
  onClose, 
  vendorLocation, 
  maxRadius = 10,
  vendorName = "Vendor"
}: LocationMapProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isValidLocation, setIsValidLocation] = useState(true);
  const [locationAddress, setLocationAddress] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.7172, 85.3240]);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        handleMapClick(lat, lng);
        fetchAddressFromCoords(lat, lng);
      },
    });
    return null;
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await response.json();
      if (data.address) {
        const primaryLocation = data.address.road || data.address.neighbourhood;
        const secondaryLocation = data.address.neighbourhood || data.address.suburb || data.address.city || data.address.town;
        const fullAddress = `${primaryLocation || secondaryLocation || 'Unknown Location'}, ${data.address.city || data.address.town || data.address.state || ''}`;
        setLocationAddress(fullAddress);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setLocationAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  useEffect(() => {
    if (vendorLocation) {
      setMapCenter([vendorLocation.lat, vendorLocation.lng]);
    }
  }, [vendorLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    
    if (vendorLocation) {
      const distance = calculateDistance(lat, lng, vendorLocation.lat, vendorLocation.lng);
      setIsValidLocation(distance <= maxRadius);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && isValidLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng, locationAddress || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchAddress.trim()) {
        handleSearchLocation();
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [searchAddress]);

  const handleSearchLocation = async () => {
    if (!searchAddress.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5&addressdetails=1`);
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCenter([lat, lng]);
    handleMapClick(lat, lng);
    setLocationAddress(result.display_name);
    setSearchResults([]);
    setSearchAddress('');
  };

  const handleUseLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          handleMapClick(latitude, longitude);
          fetchAddressFromCoords(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">Select Delivery Location</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search and Live Location */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search for an address..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectSearchResult(result)}
                      >
                        <p className="text-xs font-medium text-gray-900" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{result.display_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleUseLiveLocation} size="sm" variant="outline">
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Real Map */}
          <div className="h-64 rounded-lg overflow-hidden border">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Vendor location and delivery radius */}
              {vendorLocation && (
                <>
                  <Marker
                    position={[vendorLocation.lat, vendorLocation.lng]}
                    icon={vendorMarkerIcon}
                  />
                  <Circle
                    center={[vendorLocation.lat, vendorLocation.lng]}
                    radius={maxRadius * 1000}
                    pathOptions={{
                      color: '#10b981',
                      fillColor: '#10b981',
                      fillOpacity: 0.1,
                      weight: 2
                    }}
                  />
                </>
              )}
              
              {/* Selected location marker */}
              {selectedLocation && (
                <Marker
                  position={[selectedLocation.lat, selectedLocation.lng]}
                  icon={customMarkerIcon}
                />
              )}
              
              <MapClickHandler />
            </MapContainer>
          </div>

          {selectedLocation && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Selected Location:</p>
              <p className="text-sm text-gray-600">{locationAddress}</p>
              {vendorLocation && (
                <p className={`text-sm mt-2 ${isValidLocation ? 'text-green-600' : 'text-red-600'}`}>
                  Distance from {vendorName}: {calculateDistance(
                    selectedLocation.lat, 
                    selectedLocation.lng, 
                    vendorLocation.lat, 
                    vendorLocation.lng
                  ).toFixed(1)}km
                  {!isValidLocation && ` (exceeds ${maxRadius}km delivery limit)`}
                </p>
              )}
            </div>
          )}
          

        </div>

        <div className="flex gap-2 p-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmLocation} 
            disabled={!selectedLocation || !isValidLocation}
            className="flex-1"
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
};