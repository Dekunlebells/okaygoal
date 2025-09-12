import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollingDelay?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
}

export const useVirtualization = <T>(
  items: T[],
  options: VirtualizationOptions
) => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate virtual items
  const virtualItems: VirtualItem[] = useMemo(() => {
    const items = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
      });
    }
    return items;
  }, [visibleRange, itemHeight]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return virtualItems.map(virtualItem => ({
      ...virtualItem,
      item: items[virtualItem.index],
    }));
  }, [virtualItems, items]);

  // Total height calculation
  const totalHeight = items.length * itemHeight;

  // Scroll handler
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    setIsScrolling(true);
  }, []);

  // Scrolling state management
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);

    return () => clearTimeout(timer);
  }, [scrollTop, scrollingDelay]);

  // Scroll to index
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    const maxScrollTop = totalHeight - containerHeight;
    let targetScrollTop = index * itemHeight;

    if (align === 'center') {
      targetScrollTop = Math.max(0, targetScrollTop - containerHeight / 2 + itemHeight / 2);
    } else if (align === 'end') {
      targetScrollTop = Math.max(0, targetScrollTop - containerHeight + itemHeight);
    }

    targetScrollTop = Math.max(0, Math.min(maxScrollTop, targetScrollTop));
    setScrollTop(targetScrollTop);
  }, [itemHeight, containerHeight, totalHeight]);

  return {
    virtualItems,
    visibleItems,
    totalHeight,
    scrollTop,
    isScrolling,
    handleScroll,
    scrollToIndex,
    visibleRange,
  };
};

// Hook for virtualized grid (2D virtualization)
interface GridVirtualizationOptions {
  rowHeight: number;
  columnWidth: number;
  containerWidth: number;
  containerHeight: number;
  columnsCount: number;
  overscanRows?: number;
  overscanColumns?: number;
}

export const useGridVirtualization = <T>(
  items: T[],
  options: GridVirtualizationOptions
) => {
  const {
    rowHeight,
    columnWidth,
    containerWidth,
    containerHeight,
    columnsCount,
    overscanRows = 2,
    overscanColumns = 2,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const rowsCount = Math.ceil(items.length / columnsCount);

  // Calculate visible range for rows
  const visibleRowRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(
      startRow + Math.ceil(containerHeight / rowHeight),
      rowsCount - 1
    );

    return {
      start: Math.max(0, startRow - overscanRows),
      end: Math.min(rowsCount - 1, endRow + overscanRows),
    };
  }, [scrollTop, rowHeight, containerHeight, rowsCount, overscanRows]);

  // Calculate visible range for columns
  const visibleColumnRange = useMemo(() => {
    const startColumn = Math.floor(scrollLeft / columnWidth);
    const endColumn = Math.min(
      startColumn + Math.ceil(containerWidth / columnWidth),
      columnsCount - 1
    );

    return {
      start: Math.max(0, startColumn - overscanColumns),
      end: Math.min(columnsCount - 1, endColumn + overscanColumns),
    };
  }, [scrollLeft, columnWidth, containerWidth, columnsCount, overscanColumns]);

  // Calculate virtual items
  const virtualItems = useMemo(() => {
    const items = [];
    for (let row = visibleRowRange.start; row <= visibleRowRange.end; row++) {
      for (let col = visibleColumnRange.start; col <= visibleColumnRange.end; col++) {
        const index = row * columnsCount + col;
        if (index < items.length) {
          items.push({
            index,
            row,
            column: col,
            top: row * rowHeight,
            left: col * columnWidth,
            width: columnWidth,
            height: rowHeight,
          });
        }
      }
    }
    return items;
  }, [visibleRowRange, visibleColumnRange, columnsCount, rowHeight, columnWidth]);

  const totalHeight = rowsCount * rowHeight;
  const totalWidth = columnsCount * columnWidth;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollLeft } = event.currentTarget;
    setScrollTop(scrollTop);
    setScrollLeft(scrollLeft);
  }, []);

  return {
    virtualItems,
    totalHeight,
    totalWidth,
    scrollTop,
    scrollLeft,
    handleScroll,
    visibleRowRange,
    visibleColumnRange,
  };
};

// Hook for infinite scrolling with virtualization
interface InfiniteScrollOptions<T> extends VirtualizationOptions {
  loadMore: (page: number) => Promise<T[]>;
  hasNextPage: boolean;
  isLoading: boolean;
  threshold?: number;
}

export const useInfiniteVirtualization = <T>(
  items: T[],
  options: InfiniteScrollOptions<T>
) => {
  const { loadMore, hasNextPage, isLoading, threshold = 5, ...virtualOptions } = options;
  const [page, setPage] = useState(1);

  const virtualization = useVirtualization(items, virtualOptions);

  // Check if we need to load more items
  useEffect(() => {
    const { visibleRange } = virtualization;
    const shouldLoadMore = 
      hasNextPage &&
      !isLoading &&
      items.length > 0 &&
      visibleRange.end > items.length - threshold;

    if (shouldLoadMore) {
      const nextPage = page + 1;
      loadMore(nextPage).then(() => {
        setPage(nextPage);
      });
    }
  }, [virtualization.visibleRange, hasNextPage, isLoading, items.length, threshold, page, loadMore]);

  return virtualization;
};