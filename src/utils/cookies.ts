// Utility functions for managing story view cookies
// NOTA: Este sistema foi substituído pelo sistema de banco de dados
// Mantido apenas para compatibilidade e testes

export const STORY_VIEWED_PREFIX = 'story_viewed_';

/**
 * Check if a story has been viewed by this user
 */
export const hasViewedStory = (storyId: string): boolean => {
  if (typeof document === 'undefined') return false;
  
  const cookieName = `${STORY_VIEWED_PREFIX}${storyId}`;
  const result = document.cookie
    .split(';')
    .some(cookie => cookie.trim().startsWith(`${cookieName}=`));
  
  return result;
};

/**
 * Mark a story as viewed by this user
 */
export const markStoryAsViewed = (storyId: string): void => {
  if (typeof document === 'undefined') return;
  
  const cookieName = `${STORY_VIEWED_PREFIX}${storyId}`;
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30); // Cookie expires in 30 days
  
  document.cookie = `${cookieName}=true; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
};

/**
 * Clear all story view cookies (for testing purposes)
 */
export const clearAllStoryViews = (): void => {
  if (typeof document === 'undefined') return;
  
  document.cookie.split(';').forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    if (cookieName.startsWith(STORY_VIEWED_PREFIX)) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
};

/**
 * Get the number of stories viewed by this user
 */
export const getViewedStoriesCount = (): number => {
  if (typeof document === 'undefined') return 0;
  
  const count = document.cookie
    .split(';')
    .filter(cookie => cookie.trim().startsWith(STORY_VIEWED_PREFIX))
    .length;
    
  return count;
};

/**
 * Debug function to list all story cookies
 */
export const debugStoryCookies = (): void => {
  if (typeof document === 'undefined') return;
  
  const storyCookies = document.cookie
    .split(';')
    .filter(cookie => cookie.trim().startsWith(STORY_VIEWED_PREFIX))
    .map(cookie => cookie.trim());
    
  console.log(`[DEBUG] All story cookies:`, storyCookies);
}; 