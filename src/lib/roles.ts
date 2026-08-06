/**
 * Role vocabulary for the contest platform.
 *
 * The auth layer stores the historical role keys (`brand`, `creator`, `admin`).
 * The product vocabulary is Business / Influencer / Admin. This module is the
 * single translation point between the two, so introducing real role gating or
 * migrating the stored keys later touches only this file.
 */

export type StoredRole = "brand" | "creator" | "admin";

export type PlatformRole = "business" | "influencer" | "admin";

const STORED_TO_PLATFORM: Record<StoredRole, PlatformRole> = {
  brand: "business",
  creator: "influencer",
  admin: "admin",
};

export const ROLE_LABELS: Record<PlatformRole, string> = {
  business: "Business",
  influencer: "Influencer",
  admin: "Admin",
};

export function toPlatformRole(role: string | null | undefined): PlatformRole | null {
  if (!role) return null;
  return STORED_TO_PLATFORM[role as StoredRole] ?? null;
}

export function roleLabel(role: string | null | undefined): string {
  const platform = toPlatformRole(role);
  return platform ? ROLE_LABELS[platform] : "Workspace";
}

export function hasRole(role: string | null | undefined, ...allowed: PlatformRole[]): boolean {
  const platform = toPlatformRole(role);
  return platform !== null && allowed.includes(platform);
}
