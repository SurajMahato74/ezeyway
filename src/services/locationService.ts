class LocationService {
  private location: { latitude: number; longitude: number } | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((location: { latitude: number; longitude: number } | null) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const timestamp = localStorage.getItem('userLocationTimestamp');
        if (timestamp && Date.now() - parseInt(timestamp) < 10 * 60 * 1000) { // 10 minutes
          this.location = parsed;
        }
      } catch (e) {
        console.error('Error loading location from storage:', e);
      }
    }
  }

  private saveToStorage() {
    if (this.location) {
      localStorage.setItem('userLocation', JSON.stringify(this.location));
      localStorage.setItem('userLocationTimestamp', Date.now().toString());
    }
  }

  private updateLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.saveToStorage();
          this.notifyListeners();
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 180000 }
      );
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.location));
  }

  startTracking() {
    this.updateLocation();
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.updateLocation();
      }, 3 * 60 * 1000); // 3 minutes
    }
  }

  stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getLocation() {
    return this.location;
  }

  subscribe(listener: (location: { latitude: number; longitude: number } | null) => void) {
    this.listeners.push(listener);
    listener(this.location); // Immediately call with current location
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const locationService = new LocationService();