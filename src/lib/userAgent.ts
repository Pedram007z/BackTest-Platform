/** A short label for a browser's user-agent string: "Chrome · Windows", "Safari · iPhone". */
export function deviceLabel(ua: string): string {
  if (!ua) return '—';
  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Mac OS X|Macintosh/.test(ua)
            ? 'macOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : '';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS\//.test(ua)
            ? 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : /node|curl|bot/i.test(ua)
                ? 'برنامه'
                : 'مرورگر';
  return os ? `${browser} · ${os}` : browser;
}

/** Mobile or desktop, for an icon. */
export const isMobileUa = (ua: string) => /iPhone|iPad|Android|Mobile/.test(ua);
