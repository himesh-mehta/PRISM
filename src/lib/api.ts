/**
 * API base URL utility.
 *
 * In development:   Vite's proxy handles /api/* → localhost:4000
 * In production:    Set VITE_API_BASE to your deployed backend URL
 *                   e.g. https://prism-backend.railway.app
 *
 * /api-posture and /api-exercise always point to localhost (camera services).
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

/** Builds a full URL for backend API calls. */
export const apiUrl = (path: string) => `${API_BASE}${path}`;
