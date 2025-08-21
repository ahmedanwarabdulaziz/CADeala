// App Configuration
export const appConfig = {
  // Base URL for the application
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 
           process.env.VERCEL_URL || 
           (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  
  // Ensure HTTPS for production URLs
  getAppUrl: () => {
    let url = appConfig.baseUrl;
    
    // Ensure HTTPS for production (not localhost)
    if (url && !url.startsWith('http://localhost') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    return url;
  },
  
  // Generate signup URL
  getSignupUrl: (businessReferenceCode: string, rankName: string) => {
    const baseUrl = appConfig.getAppUrl();
    return `${baseUrl}/signup?business=${businessReferenceCode}&rank=${encodeURIComponent(rankName)}`;
  }
};
