/**
 * DOM manipulation utilities with type safety
 */

/**
 * Type-safe query selector that throws if element not found
 */
export function getElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

/**
 * Type-safe query selector that returns null if not found
 */
export function findElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Type-safe query selector for multiple elements
 */
export function getElements<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document
): NodeListOf<T> {
  return parent.querySelectorAll<T>(selector);
}

/**
 * Creates an element with type safety
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: {
    className?: string;
    id?: string;
    textContent?: string;
    innerHTML?: string;
    attributes?: Record<string, string>;
    dataset?: Record<string, string>;
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options) {
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.textContent) element.textContent = options.textContent;
    if (options.innerHTML) element.innerHTML = options.innerHTML;

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.dataset) {
      Object.entries(options.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }
  }

  return element;
}

/**
 * Adds event listener with proper typing
 */
export function addEventListenerTyped<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void {
  element.addEventListener(type, listener, options);
}

/**
 * Removes event listener with proper typing
 */
export function removeEventListenerTyped<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | EventListenerOptions
): void {
  element.removeEventListener(type, listener, options);
}

/**
 * Type-safe dataset operations
 */
export function getDataset(element: HTMLElement, key: string): string | undefined {
  return element.dataset[key];
}

export function setDataset(element: HTMLElement, key: string, value: string): void {
  element.dataset[key] = value;
}

/**
 * Toggle class with return value
 */
export function toggleClass(element: HTMLElement, className: string): boolean {
  return element.classList.toggle(className);
}

/**
 * Safe class operations
 */
export function addClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.add(...classNames);
}

export function removeClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.remove(...classNames);
}

export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Position utilities
 */
export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getElementPosition(element: HTMLElement): ElementPosition {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
}

/**
 * Animation utilities
 */
export function fadeIn(element: HTMLElement, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    element.style.opacity = '0';
    element.style.display = 'block';

    const start = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      element.style.opacity = progress.toString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

export function fadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const startOpacity = parseFloat(getComputedStyle(element).opacity);

    function animate(currentTime: number) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      element.style.opacity = (startOpacity * (1 - progress)).toString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

/**
 * Debounce utility for event handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = undefined;
      func(...args);
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}

/**
 * Throttle utility for event handlers
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
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
