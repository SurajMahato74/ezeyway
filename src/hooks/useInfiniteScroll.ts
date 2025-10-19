import { useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200
}: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!hasMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, threshold]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: `${threshold}px` }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    // Fallback to scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, isLoading, onLoadMore, handleScroll, threshold]);

  return { sentinelRef };
};