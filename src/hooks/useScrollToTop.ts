import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to automatically scroll to top when route changes
 * Usage: Add `useScrollToTop()` to any page component
 */
export const useScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);
};

/**
 * Utility function to scroll to top immediately
 * Usage: Call `scrollToTop()` when needed
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Utility function to scroll to top instantly (no animation)
 * Usage: Call `scrollToTopInstant()` when needed
 */
export const scrollToTopInstant = () => {
  window.scrollTo(0, 0);
};
