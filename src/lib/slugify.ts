/**
 * Generate a URL-friendly slug from a player name.
 * 
 * Input formats:
 * - "HITOSATO,Shigeki" → "shigeki-hitosato"
 * - "KIM,Sang Wook" → "sang-wook-kim"
 * - "Matt Dalton" → "matt-dalton"
 * 
 * @param rawName - The raw player name (typically "LASTNAME,Firstname")
 * @returns URL-safe slug
 */
export function generatePlayerSlug(rawName: string): string {
  if (!rawName) return '';
  
  // Check if it's "LASTNAME,Firstname" format
  if (rawName.includes(',')) {
    const parts = rawName.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const [lastName, firstName] = parts;
      // "HITOSATO,Shigeki" → "shigeki-hitosato"
      return `${firstName}-${lastName}`
        .toLowerCase()
        .replace(/\s+/g, '-')      // Replace spaces with dashes
        .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except dashes
        .replace(/-+/g, '-')        // Collapse multiple dashes
        .replace(/^-|-$/g, '');     // Trim leading/trailing dashes
    }
  }
  
  // Fallback: just slugify the whole name
  return rawName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get the player page URL from a player object.
 * Prefers slug, falls back to ID.
 */
export function getPlayerUrl(player: { id: number; slug?: string | null }): string {
  return player.slug ? `/player/${player.slug}` : `/player/${player.id}`;
}
