/**
 * Helper pembersih URL untuk memastikan link situs dan link undangan selalu bersih,
 * tanpa karakter markdown seperti kurung siku [url](url) yang tidak sengaja terbawa.
 */

export function sanitizeSiteUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();

  // Jika berbentuk markdown link: [text](https://example.com)
  const mdMatch = url.match(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
  if (mdMatch) {
    url = mdMatch[1];
  } else {
    // Ambil pola URL http/https murni
    const urlMatch = url.match(/https?:\/\/[^\s\[\]\(\)"']+/);
    if (urlMatch) {
      url = urlMatch[0];
    }
  }

  return url.replace(/\/$/, "");
}

/**
 * Membersihkan URL undangan lengkap agar tidak mengandung kurung siku / format markdown link.
 * Contoh input:
 * "[https://domain.com](https://domain.com)/invite/xyz" -> "https://domain.com/invite/xyz"
 * "[https://domain.com/invite/xyz](https://domain.com/invite/xyz)" -> "https://domain.com/invite/xyz"
 */
export function sanitizeInviteUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();

  // Kasus 1: [https://domain.com](https://domain.com)/invite/token
  const mdWithTrailing = url.match(/^\[.*?\]\((https?:\/\/[^\s\)]+)\)(.*)$/);
  if (mdWithTrailing) {
    const base = mdWithTrailing[1].replace(/\/$/, "");
    const rest = mdWithTrailing[2].trim();
    url = `${base}${rest.startsWith("/") ? "" : "/"}${rest}`;
  } else {
    // Kasus 2: [https://domain.com/invite/token](https://domain.com/invite/token)
    const mdFull = url.match(/^\[.*?\]\((https?:\/\/[^\s\)]+)\)$/);
    if (mdFull) {
      url = mdFull[1];
    } else {
      // Kasus 3: [https://domain.com]/invite/token
      const bracketOnly = url.match(/^\[(https?:\/\/[^\]]+)\](.*)$/);
      if (bracketOnly) {
        const base = bracketOnly[1].replace(/\/$/, "");
        const rest = bracketOnly[2].trim();
        url = `${base}${rest.startsWith("/") ? "" : "/"}${rest}`;
      }
    }
  }

  // Bersihkan karakter [ atau ] yang tersisa
  url = url.replace(/[\[\]]/g, "").trim();

  return url;
}
