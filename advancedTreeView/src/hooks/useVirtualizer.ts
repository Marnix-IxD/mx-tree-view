import { useCallback, useEffect, useRef, useState } from "react";

interface VirtualizerOptions {
    count: number;
    getScrollElement: () => HTMLElement | null;
    estimateSize: (index: number) => number;
    overscan?: number;
    enabled?: boolean;
}

interface VirtualItem {
    key: string | number;
    index: number;
    start: number;
    size: number;
}

export function useVirtualizer(options: VirtualizerOptions) {
    const {
        count,
        getScrollElement,
        estimateSize,
        overscan = 5,
        enabled = true
    } = options;

    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const scrollElementRef = useRef<HTMLElement | null>(null);
    const measurementsRef = useRef<Map<number, number>>(new Map());

    // Calculate item positions
    const getItemPosition = useCallback((index: number): { start: number; size: number } => {
        let start = 0;
        
        for (let i = 0; i < index; i++) {
            const measuredSize = measurementsRef.current.get(i);
            start += measuredSize || estimateSize(i);
        }

        const size = measurementsRef.current.get(index) || estimateSize(index);
        
        return { start, size };
    }, [estimateSize]);

    // Get total size
    const getTotalSize = useCallback((): number => {
        let total = 0;
        
        for (let i = 0; i < count; i++) {
            const measuredSize = measurementsRef.current.get(i);
            total += measuredSize || estimateSize(i);
        }
        
        return total;
    }, [count, estimateSize]);

    // Get virtual items
    const getVirtualItems = useCallback((): VirtualItem[] => {
        if (!enabled || !containerHeight) {
            // Return all items if virtualization is disabled
            return Array.from({ length: count }, (_, i) => {
                const { start, size } = getItemPosition(i);
                return {
                    key: i,
                    index: i,
                    start,
                    size
                };
            });
        }

        const items: VirtualItem[] = [];
        let accumulatedHeight = 0;
        let startIndex = -1;
        let endIndex = -1;

        // Find start index
        for (let i = 0; i < count; i++) {
            const { size } = getItemPosition(i);
            
            if (accumulatedHeight + size >= scrollTop && startIndex === -1) {
                startIndex = Math.max(0, i - overscan);
            }
            
            accumulatedHeight += size;
            
            if (accumulatedHeight >= scrollTop + containerHeight && endIndex === -1) {
                endIndex = Math.min(count - 1, i + overscan);
                break;
            }
        }

        // If we haven't found an end index, use the last item
        if (endIndex === -1) {
            endIndex = count - 1;
        }

        // Create virtual items
        for (let i = startIndex; i <= endIndex; i++) {
            const { start, size } = getItemPosition(i);
            items.push({
                key: i,
                index: i,
                start,
                size
            });
        }

        return items;
    }, [enabled, count, containerHeight, scrollTop, overscan, getItemPosition]);

    // Measure item
    const measureItem = useCallback((index: number, size: number) => {
        const previousSize = measurementsRef.current.get(index);
        
        if (previousSize !== size) {
            measurementsRef.current.set(index, size);
            
            // Trigger re-render if needed
            const scrollElement = getScrollElement();
            if (scrollElement) {
                handleScroll();
            }
        }
    }, [getScrollElement]);

    // Handle scroll
    const handleScroll = useCallback(() => {
        const scrollElement = getScrollElement();
        if (!scrollElement) return;

        setScrollTop(scrollElement.scrollTop);
    }, [getScrollElement]);

    // Handle resize
    const handleResize = useCallback(() => {
        const scrollElement = getScrollElement();
        if (!scrollElement) return;

        setContainerHeight(scrollElement.clientHeight);
    }, [getScrollElement]);

    // Setup scroll and resize listeners
    useEffect(() => {
        const scrollElement = getScrollElement();
        if (!scrollElement || !enabled) return;

        scrollElementRef.current = scrollElement;
        
        // Initial measurements
        setScrollTop(scrollElement.scrollTop);
        setContainerHeight(scrollElement.clientHeight);

        // Add listeners
        scrollElement.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);

        // ResizeObserver for container size changes
        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(scrollElement);
        }

        return () => {
            scrollElement.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
            resizeObserver?.disconnect();
        };
    }, [getScrollElement, enabled, handleScroll, handleResize]);

    // Scroll to index
    const scrollToIndex = useCallback((index: number, align: "start" | "center" | "end" = "start") => {
        const scrollElement = getScrollElement();
        if (!scrollElement) return;

        const { start, size } = getItemPosition(index);
        let scrollPosition = start;

        if (align === "center") {
            scrollPosition = start - (containerHeight - size) / 2;
        } else if (align === "end") {
            scrollPosition = start - containerHeight + size;
        }

        scrollElement.scrollTop = Math.max(0, scrollPosition);
    }, [getScrollElement, getItemPosition, containerHeight]);

    // Scroll to offset
    const scrollToOffset = useCallback((offset: number) => {
        const scrollElement = getScrollElement();
        if (!scrollElement) return;

        scrollElement.scrollTop = offset;
    }, [getScrollElement]);

    return {
        getVirtualItems,
        getTotalSize,
        scrollToIndex,
        scrollToOffset,
        measureItem
    };
}