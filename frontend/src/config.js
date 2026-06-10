// API configuration for Aariniya Wellness Platform
// Fallback to local server during development, or use environment variable in production (Vercel)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
