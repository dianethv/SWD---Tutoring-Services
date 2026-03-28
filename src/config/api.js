const fallbackApiUrl = 'http://localhost:5001/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL || fallbackApiUrl;
