import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://www.creatorz.hu";

/**
 * Web API hívás. Ha `auth: true`, a bejelentkezett user JWT-jét is elküldi
 * (a védett végpontokhoz). Nyilvános végpontoknál nem kell.
 */
async function authHeaders(auth?: boolean) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string, opts?: { auth?: boolean }): Promise<T> {
  const headers = await authHeaders(opts?.auth);
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  opts?: { auth?: boolean },
): Promise<T> {
  const headers = await authHeaders(opts?.auth);
  headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

export type Conversation = {
  partnerId: string;
  name: string;
  avatarUrl: string | null;
  lastBody: string;
  lastAt: string;
  unread: number;
};

export type ThreadMessage = {
  id: string;
  fromUserId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export function fetchConversations() {
  return apiGet<{ conversations: Conversation[] }>("/api/mobile/messages", { auth: true });
}
export function fetchThread(partnerId: string) {
  return apiGet<{ partner: { id: string; name: string; avatarUrl: string | null }; messages: ThreadMessage[] }>(
    `/api/mobile/messages/${partnerId}`,
    { auth: true },
  );
}
export function sendThreadMessage(partnerId: string, body: string) {
  return apiPost<{ success: boolean }>(`/api/mobile/messages/${partnerId}`, { body }, { auth: true });
}
export function registerPushToken(token: string, platform: string) {
  return apiPost<{ success: boolean }>("/api/mobile/push-token", { token, platform }, { auth: true });
}
export function startConversation(toUsername: string, body: string) {
  return apiPost<{ success: boolean; partnerId: string }>(
    "/api/mobile/messages/start",
    { toUsername, body },
    { auth: true },
  );
}

export type AdListItem = {
  id: string;
  slug: string | null;
  title: string;
  brandName: string;
  coverUrl: string | null;
  categoryLabels: string[];
  contentTypeLabel: string;
  collabLabel: string;
  budgetLabel: string;
  deadline: string;
  applicationCount: number;
  isFeatured: boolean;
};
export type AdDetail = {
  id: string;
  title: string;
  description: string;
  brandName: string;
  coverUrl: string | null;
  categoryLabels: string[];
  targetKindLabels: string[];
  contentTypeLabel: string;
  collabLabel: string;
  usageRightsLabel: string;
  budgetLabel: string;
  deadline: string;
  location: string | null;
  referenceLinks: string[];
  alreadyApplied: boolean;
  invited: boolean;
};

export type AdFilters = { category?: string; contentType?: string };
export function fetchAds(offset = 0, filters: AdFilters = {}) {
  const qs = new URLSearchParams();
  if (offset) qs.set("offset", String(offset));
  if (filters.category) qs.set("category", filters.category);
  if (filters.contentType) qs.set("contentType", filters.contentType);
  return apiGet<{ items: AdListItem[]; hasMore: boolean; nextOffset: number }>(
    `/api/mobile/ads?${qs.toString()}`,
  );
}
export function fetchAd(id: string) {
  return apiGet<AdDetail>(`/api/mobile/ads/${id}`, { auth: true });
}
export function applyToAd(id: string, message: string) {
  return apiPost<{ success: boolean }>(`/api/mobile/ads/${id}/apply`, { message }, { auth: true });
}

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};
export function fetchNotifications() {
  return apiGet<{ items: AppNotification[]; unread: number }>("/api/mobile/notifications", { auth: true });
}
export function markNotificationsRead() {
  return apiPost<{ success: boolean }>("/api/mobile/notifications", {}, { auth: true });
}
export function fetchUnread() {
  return apiGet<{ messages: number; notifications: number }>("/api/mobile/unread", { auth: true });
}

export type MyApplication = {
  id: string;
  status: string;
  createdAt: string;
  adId: string;
  adSlug: string | null;
  adTitle: string;
  adStatus: string;
};
export function fetchMyApplications() {
  return apiGet<{ items: MyApplication[] }>("/api/mobile/my-applications", { auth: true });
}

export type MeProfile = Record<string, string | null> | null;
export function fetchMe() {
  return apiGet<{ role: string; profile: MeProfile }>("/api/mobile/me", { auth: true });
}
export function saveProfile(fields: Record<string, string>) {
  return apiPost<{ success: boolean; error?: string }>("/api/mobile/me", fields, { auth: true });
}

export type CreatorListItem = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  categories: string[];
  tiktokFollowers: number | null;
  instagramFollowers: number | null;
  verified: boolean;
  isFeatured: boolean;
  averageRating: string | null;
  reviewCount: number;
  activity: string | null;
};

export type CreatorsResponse = {
  items: CreatorListItem[];
  hasMore: boolean;
  nextOffset: number;
};

export type CreatorFilters = { category?: string; minTt?: string; verified?: boolean };
export function fetchCreators(search = "", offset = 0, filters: CreatorFilters = {}) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (offset) qs.set("offset", String(offset));
  if (filters.category) qs.set("category", filters.category);
  if (filters.minTt) qs.set("minTt", filters.minTt);
  if (filters.verified) qs.set("verified", "1");
  return apiGet<CreatorsResponse>(`/api/mobile/creators?${qs.toString()}`);
}

export type CreatorDetail = {
  profile: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    city: string | null;
    county: string | null;
    age: number | null;
    gender: string | null;
    categories: string[];
    languages: string[];
    profileKind: "ugc" | "professional";
    professionalRoles: string[];
    specialties: string[];
    websiteUrl: string | null;
    verified: boolean;
    isFeatured: boolean;
    introVideoUrl: string | null;
    instagramUrl: string | null;
    instagramFollowers: number | null;
    tiktokUrl: string | null;
    tiktokFollowers: number | null;
    tiktokLikes: number | null;
    tiktokVideoCount: number | null;
    facebookUrl: string | null;
    facebookFollowers: number | null;
    youtubeUrl: string | null;
    youtubeSubscribers: number | null;
    averageRating: string | null;
    reviewCount: number;
    activity: string | null;
  };
  portfolio: {
    id: string;
    type: "video" | "photo";
    url: string;
    thumbnailUrl: string | null;
    externalUrl: string | null;
    title: string | null;
  }[];
  reviews: {
    id: string;
    overallRating: number;
    text: string;
    createdAt: string;
    brandName: string;
    responseText: string | null;
  }[];
  saved?: boolean;
};

export function fetchCreator(username: string) {
  return apiGet<CreatorDetail>(`/api/mobile/creators/${encodeURIComponent(username)}`, { auth: true });
}
export function toggleSaveCreator(username: string) {
  return apiPost<{ saved: boolean }>(`/api/mobile/creators/${encodeURIComponent(username)}/save`, {}, { auth: true });
}
export function inviteCreator(username: string, adId: string, message: string) {
  return apiPost<{ success: boolean; error?: string }>(
    `/api/mobile/creators/${encodeURIComponent(username)}/invite`,
    { adId, message },
    { auth: true },
  );
}
export function fetchBrandAds() {
  return apiGet<{ items: { id: string; title: string }[] }>("/api/mobile/brand/ads", { auth: true });
}
export type SavedCreator = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  tiktokFollowers: number | null;
  verified: boolean;
  averageRating: string | null;
  reviewCount: number;
};
export function fetchSaved() {
  return apiGet<{ items: SavedCreator[] }>("/api/mobile/saved", { auth: true });
}
