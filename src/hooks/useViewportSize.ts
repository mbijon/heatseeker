import { useEffect, useState } from 'react';

type ViewportSize = {
  width: number;
  height: number;
};

const DEFAULT_SIZE: ViewportSize = { width: 0, height: 0 };

/**
 * Tracks the current viewport dimensions so layout math can react to resize events.
 */
export default function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SIZE;
    }

    return { width: window.innerWidth, height: window.innerHeight };
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
