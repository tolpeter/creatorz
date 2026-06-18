import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://creatorz.hu";

/**
 * Web API hívás. Ha `auth: true`, a bejelentkezett user JWT-jét is elküldi
 * (a védett végpontokhoz). Nyilvános végpontoknál nem kell.
 */
export async function apiGet<T>(
  path: string,
  opts?: { auth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return (await res.json()) as T;
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

export function fetchCreators(search = "", offset = 0) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (offset) qs.set("offset", String(offset));
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
};

export function fetchCreator(username: string) {
  return apiGet<CreatorDetail>(`/api/mobile/creators/${encodeURIComponent(username)}`);
}
