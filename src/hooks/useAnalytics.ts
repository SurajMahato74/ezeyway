import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page visit on component mount and route changes
    analyticsService.trackPageVisit();
  }, [location.pathname]);

  return {
    trackPageVisit: analyticsService.trackPageVisit.bind(analyticsService),
    trackRouteChange: analyticsService.trackRouteChange.bind(analyticsService),
  };
};