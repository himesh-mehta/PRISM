/**
 * Neon Data API Client (REST)
 * 
 * This client interacts with the Neon Data API (PostgREST-compatible).
 * It uses the URL provided by the user to perform CRUD operations on the database.
 */

const NEON_API_URL = import.meta.env.VITE_NEON_API_URL || "https://ep-solitary-feather-anmxw16r.apirest.c-6.us-east-1.aws.neon.tech/neondb/rest/v1";
const NEON_API_KEY = import.meta.env.VITE_NEON_API_KEY || "";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function neonFetch(path: string, options: FetchOptions = {}) {
  const url = new URL(`${NEON_API_URL}${path}`);
  
  if (options.params) {
    Object.keys(options.params).forEach(key => url.searchParams.append(key, options.params![key]));
  }

  const headers = new Headers(options.headers);
  if (NEON_API_KEY) {
    headers.set("Authorization", `Bearer ${NEON_API_KEY}`);
  }
  headers.set("Content-Type", "application/json");
  headers.set("Prefer", "return=representation");

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Neon Data API Error: ${error.message || response.statusText}`);
  }

  return response.json();
}

export const neonClient = {
  /**
   * Select data from a table
   */
  from: (table: string) => ({
    select: async (query = "*") => {
      return neonFetch(`/${table}`, {
        method: "GET",
        params: { select: query },
      });
    },
    
    insert: async (data: any | any[]) => {
      return neonFetch(`/${table}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (data: any, match: Record<string, string>) => {
      return neonFetch(`/${table}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        params: match,
      });
    },

    delete: async (match: Record<string, string>) => {
      return neonFetch(`/${table}`, {
        method: "DELETE",
        params: match,
      });
    }
  })
};
