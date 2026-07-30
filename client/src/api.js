// In dev, VITE_API_URL is unset, so BASE is just "/api" and Vite's dev
// proxy (see vite.config.js) forwards it to the local server.
// In production (Vercel), set VITE_API_URL to your deployed Render URL,
// e.g. https://partner-console-api.onrender.com
const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

async function req(path, opts) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getPartners: () => req("/partners"),
  setPartnerStatus: (id, status) =>
    req(`/partners/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getLatestFeed: (partnerId) => req(`/feeds/${partnerId}/latest`),
  validateFeed: (partnerId, filename, xml, checkUrls = false) =>
    req("/feeds/validate", {
      method: "POST",
      body: JSON.stringify({ partnerId, filename, xml, checkUrls }),
    }),
  getFailingFields: (days = 7) => req(`/analytics/failing-fields?days=${days}`),
  getRecentEvents: (limit = 20) => req(`/events/recent?limit=${limit}`),
};
