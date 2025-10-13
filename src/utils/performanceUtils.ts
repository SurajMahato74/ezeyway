// Performance utilities to prevent violations and improve user experience

/**
 * Debounce function to limit the rate of function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function execution to once per specified time
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Async wrapper to prevent blocking the main thread
 */
export function asyncWrapper<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(func(...args));
      }, 0);
    });
  };
}

/**
 * Performance-optimized click handler
 */
export function createOptimizedClickHandler<T extends (...args: any[]) => any>(
  handler: T,
  options: { debounce?: number; throttle?: number; async?: boolean } = {}
): (...args: Parameters<T>) => void | Promise<ReturnType<T>> {
  let optimizedHandler = handler;

  if (options.async) {
    optimizedHandler = asyncWrapper(optimizedHandler) as T;
  }

  if (options.debounce) {
    return debounce(optimizedHandler, options.debounce);
  }

  if (options.throttle) {
    return throttle(optimizedHandler, options.throttle);
  }

  return optimizedHandler;
}

/**
 * Prevent layout thrashing by batching DOM reads and writes
 */
export class DOMBatcher {
  private readTasks: (() => void)[] = [];
  private writeTasks: (() => void)[] = [];
  private scheduled = false;

  read(task: () => void) {
    this.readTasks.push(task);
    this.schedule();
  }

  write(task: () => void) {
    this.writeTasks.push(task);
    this.schedule();
  }

  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      // Execute all reads first
      while (this.readTasks.length) {
        const task = this.readTasks.shift();
        task?.();
      }

      // Then execute all writes
      while (this.writeTasks.length) {
        const task = this.writeTasks.shift();
        task?.();
      }

      this.scheduled = false;
    });
  }
}

export const domBatcher = new DOMBatcher();