const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/erpreview";

export function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, init);
}
