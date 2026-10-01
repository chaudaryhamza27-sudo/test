// Small, dependency-free User-Agent summary for the admin login list. Good
// enough to tell devices apart; not meant to be exhaustive.
export function describeUserAgent(ua = "") {
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\/|Opera/.test(ua) ? "Opera" :
    /SamsungBrowser\//.test(ua) ? "Samsung Internet" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\/|CriOS\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" :
    "Unknown";

  const os =
    /Windows NT/.test(ua) ? "Windows" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad|iPod/.test(ua) ? "iOS" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" :
    "Unknown";

  const device =
    /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? "Tablet" :
    /Mobi|iPhone|Android/.test(ua) ? "Mobile" :
    ua ? "Desktop" :
    "Unknown";

  return { browser, os, device };
}
