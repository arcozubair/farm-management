import { useState, useEffect } from 'react';

const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 600,
    isTablet: windowSize.width >= 600 && windowSize.width < 960,
    isDesktop: windowSize.width >= 960,
    width: windowSize.width,
    height: windowSize.height,
  };
};

export default useResponsive; 