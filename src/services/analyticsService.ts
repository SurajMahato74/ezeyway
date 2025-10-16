import { API_CONFIG } from '@/config/api';

class AnalyticsService {
  private hasTrackedCurrentPage = false;

  async trackPageVisit(pageUrl?: string, pageTitle?: string) {
    try {
      // Avoid duplicate tracking for the same page
      if (this.hasTrackedCurrentPage) return;
      
      const currentUrl = pageUrl || window.location.href;
      const currentTitle = pageTitle || document.title;
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/analytics/track/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({
          page_url: currentUrl,
          page_title: currentTitle,
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics tracked:', data);
        this.hasTrackedCurrentPage = true;
        
        // Reset tracking flag when page changes
        setTimeout(() => {
          this.hasTrackedCurrentPage = false;
        }, 1000);
        
        return data;
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  // Track page visit on route change
  trackRouteChange(newPath: string) {
    this.hasTrackedCurrentPage = false;
    this.trackPageVisit(window.location.origin + newPath);
  }
}

export const analyticsService = new AnalyticsService();