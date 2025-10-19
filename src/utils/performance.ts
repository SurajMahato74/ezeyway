// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.metrics.set(label, performance.now());
  }

  endTimer(label: string): number {
    const startTime = this.metrics.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    this.metrics.delete(label);
    return duration;
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    return fn().finally(() => {
      this.endTimer(label);
    });
  }

  measureSync<T>(label: string, fn: () => T): T {
    this.startTimer(label);
    try {
      return fn();
    } finally {
      this.endTimer(label);
    }
  }

  logMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('🧠 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }

  logRenderMetrics(): void {
    // Log Core Web Vitals
    if ('getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
      });

      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0] as PerformanceNavigationTiming;
        console.log('🚀 Navigation Timing:', {
          domContentLoaded: `${(nav.domContentLoadedEventEnd - nav.navigationStart).toFixed(2)}ms`,
          loadComplete: `${(nav.loadEventEnd - nav.navigationStart).toFixed(2)}ms`,
          firstByte: `${(nav.responseStart - nav.navigationStart).toFixed(2)}ms`
        });
      }
    }
  }
}

// Debounce utility for search optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Image preloader for better UX
export class ImagePreloader {
  private cache = new Set<string>();

  preload(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      if (this.cache.has(url)) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.cache.add(url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    });

    return Promise.all(promises);
  }

  isPreloaded(url: string): boolean {
    return this.cache.has(url);
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export const imagePreloader = new ImagePreloader();