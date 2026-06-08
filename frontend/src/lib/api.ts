export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function saveAuthSession(token: string, user: unknown) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getCurrentEventId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("currentEventId");
}

export function setCurrentEventId(eventId: string) {
  localStorage.setItem("currentEventId", eventId);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function ensureCurrentEventId() {
  const existing = getCurrentEventId();
  if (existing) return existing;

  const events = await apiFetch<Array<{ _id: string }>>("/events");
  const firstEventId = events[0]?._id;
  if (firstEventId) setCurrentEventId(firstEventId);
  return firstEventId || null;
}
