export interface Profile {
  _id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  college?: string;
  interests: string[];
}
export interface Match {
  id: string;
  createdAt: string;
  profile: Pick<Profile, '_id' | 'name' | 'age' | 'photo' | 'city' | 'college'>;
  conversationStarter: { interest: string | null; text: string };
}
export interface Preferences {
  paused: boolean;
  city: string;
  interests: string[];
}
export interface PreferenceOptions {
  cities: string[];
  interests: string[];
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${base}${path}`, {
      ...options,
      // Reads stay fresh; writes can reuse the browser's cached CORS preflight.
      cache: options?.body ? 'default' : 'no-store',
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
      signal: AbortSignal.timeout(12000),
    });
    const body = await response.json();
    if (!response.ok)
      throw new ApiError(
        body.error?.message || 'Something went wrong. Please try again.',
        response.status,
        body.error?.code,
      );
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Couldn’t reach Coy. Check your connection and try again.', 0);
  }
}
export const api = {
  preferences: () =>
    request<{ preferences: Preferences; options: PreferenceOptions }>('/preferences'),
  savePreferences: (preferences: Preferences) =>
    request<{ preferences: Preferences }>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
  feed: () => request<{ profiles: Profile[] }>('/feed'),
  matches: () => request<{ matches: Match[] }>('/matches'),
  swipe: (profileId: string, direction: 'like' | 'pass') =>
    request<{ matched: boolean; match?: Match }>('/swipe', {
      method: 'POST',
      body: JSON.stringify({ profileId, direction }),
    }),
};
