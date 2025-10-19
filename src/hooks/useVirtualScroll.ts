import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

export const useVirtualScroll = ({
  itemHeight,
  containerHeight,
  items,
  overscan = 5
}: UseVirtualScrollOptions) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      index: visibleRange.startIndex + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};