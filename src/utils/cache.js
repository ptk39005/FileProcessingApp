export const clearExpiredCache = () => {
  const cacheKeys = ['mergeFilesData']; // Add more cache keys as needed
  const expiration = 30 * 60 * 1000; // 30 minutes

  cacheKeys.forEach(key => {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp >= expiration) {
        localStorage.removeItem(key);
      }
    }
  });
}; 