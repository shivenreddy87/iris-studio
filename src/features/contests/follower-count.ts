/**
 * Follower-count resolution.
 *
 * Eligibility needs a number. We prefer the count reported by the linked
 * social account, fall back to the number stored on the profile, and finally
 * derive a conservative number from the declared follower range.
 */

const SUFFIX: Record<string, number> = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };

/** "10K – 50K" -> { min: 10000, max: 50000 }; "1M+" -> { min: 1000000, max: null }. */
export function parseFollowerRange(range: string | null | undefined): {
  min: number | null;
  max: number | null;
} {
  if (!range) return { min: null, max: null };
  const matches = [...range.matchAll(/(\d+(?:\.\d+)?)\s*([kmb])?/gi)].map((m) => {
    const base = Number(m[1]);
    const mult = m[2] ? SUFFIX[m[2].toLowerCase()] : 1;
    return Math.round(base * (mult ?? 1));
  });
  if (matches.length === 0) return { min: null, max: null };
  const min = matches[0] ?? null;
  const max = matches.length > 1 ? (matches[1] ?? null) : null;
  return { min, max };
}

/**
 * The number the eligibility engine should use. The range lower bound is the
 * safe default: an influencer who declares 10K – 50K clears a 10K minimum.
 */
export function resolveFollowerCount(input: {
  connectedFollowers?: number | null;
  profileFollowers?: number | null;
  followerRange?: string | null;
}): number | null {
  if (input.connectedFollowers && input.connectedFollowers > 0) return input.connectedFollowers;
  if (input.profileFollowers && input.profileFollowers > 0) return input.profileFollowers;
  const { min } = parseFollowerRange(input.followerRange);
  return min && min > 0 ? min : null;
}
