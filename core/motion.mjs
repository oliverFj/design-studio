/** Shared timing for expanding and restoring content. */
export const STANDARD_MOTION = Object.freeze({
  duration: 240,
  easing: 'cubic-bezier(.2,.7,.2,1)',
});

/** Reduced motion shows the final layout immediately; callers own animation cleanup. */
export function animateStandard(element, keyframes, options = {}) {
  if (!element?.animate || element.ownerDocument?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  return element.animate(keyframes, { ...STANDARD_MOTION, ...options });
}
