/**
 * Debounce function to limit execution frequency
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function debounced(...args: Parameters<T>) {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return function throttled(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = 
    typeof window !== "undefined" && window.requestIdleCallback
        ? window.requestIdleCallback
        : (callback: IdleRequestCallback) => {
            const start = Date.now();
            return setTimeout(() => {
                callback({
                    didTimeout: false,
                    timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
                });
            }, 1);
        };

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback =
    typeof window !== "undefined" && window.cancelIdleCallback
        ? window.cancelIdleCallback
        : clearTimeout;

/**
 * Batch updates for better performance
 */
export class BatchProcessor<T> {
    private items: T[] = [];
    private processing = false;
    private processor: (items: T[]) => void;
    private delay: number;
    private timeout: NodeJS.Timeout | null = null;

    constructor(processor: (items: T[]) => void, delay = 16) {
        this.processor = processor;
        this.delay = delay;
    }

    add(item: T) {
        this.items.push(item);
        this.scheduleProcess();
    }

    private scheduleProcess() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
            this.process();
        }, this.delay);
    }

    private process() {
        if (this.processing || this.items.length === 0) {
            return;
        }

        this.processing = true;
        const batch = this.items.splice(0, this.items.length);

        requestIdleCallback(() => {
            this.processor(batch);
            this.processing = false;

            if (this.items.length > 0) {
                this.scheduleProcess();
            }
        });
    }

    flush() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.process();
    }
}