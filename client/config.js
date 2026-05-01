/**
 * API Configuration
 *
 * Service map:
 * - admin: Railway admin/auth/courses backend
 * - legacyCommunity: legacy community + tutor backend
 * - community: course-thread community backend
 * - tracking: nibras tracking/projects backend
 * - competitions: competitions backend
 *
 * Override priority per service:
 * 1. Query parameter
 *    - admin: ?api=URL or ?adminApi=URL
 *    - legacyCommunity: ?legacyApi=URL
 *    - community: ?communityApi=URL or ?discussionsApi=URL
 *    - tracking: ?trackingApi=URL or ?trackApi=URL
 *    - competitions: ?competitionsApi=URL or ?compApi=URL
 * 2. localStorage
 *    - admin: nibras_admin_api_url or nibras_api_url (legacy key)
 *    - legacyCommunity: nibras_legacy_api_url
 *    - community: nibras_community_api_url
 *    - tracking: nibras_tracking_api_url
 *    - competitions: nibras_competitions_api_url
 *    - googleClientId: nibras_google_client_id
 * 3. Defaults below
 */
(function () {
  const DEFAULT_MONOLITH_API = 'https://nibras-backend.up.railway.app/api';
  const DEFAULT_ADMIN_API = DEFAULT_MONOLITH_API;
  const DEFAULT_LEGACY_API = DEFAULT_MONOLITH_API;
  const DEFAULT_COMMUNITY_API = DEFAULT_MONOLITH_API;
  const DEFAULT_TRACKING_API = DEFAULT_MONOLITH_API;
  const DEFAULT_COMPETITIONS_API = DEFAULT_MONOLITH_API;
  const DEFAULT_GOOGLE_CLIENT_ID = 'your_google_oauth_client_id';

  const params = new URLSearchParams(window.location.search);

  const normalizeUrl = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.replace(/\/+$/, '') : null;
  };

  const ensureApiBaseUrl = (value) => {
    const normalized = normalizeUrl(value);
    if (!normalized) return null;

    try {
      const parsed = new URL(normalized);
      let pathname = parsed.pathname.replace(/\/+$/, '');
      if (!pathname || pathname === '/') {
        pathname = '/api';
      } else if (!/^\/api(?:\/|$)/i.test(pathname)) {
        pathname = `${pathname}/api`;
      }
      parsed.pathname = pathname;
      return parsed.toString().replace(/\/+$/, '');
    } catch (_) {
      if (/\/api(?:\/|$)/i.test(normalized)) return normalized;
      return `${normalized}/api`;
    }
  };

  const readFirst = (...values) => {
    for (let i = 0; i < values.length; i += 1) {
      const normalized = normalizeUrl(values[i]);
      if (normalized) return normalized;
    }
    return null;
  };

  const adminApi = ensureApiBaseUrl(readFirst(
    params.get('api'),
    params.get('adminApi'),
    localStorage.getItem('nibras_admin_api_url'),
    localStorage.getItem('nibras_api_url'),
    window.NIBRAS_API_URL,
    window.NIBRAS_BACKEND_URL,
    DEFAULT_ADMIN_API
  )) || DEFAULT_ADMIN_API;

  const legacyCommunityApi = ensureApiBaseUrl(readFirst(
    params.get('legacyApi'),
    localStorage.getItem('nibras_legacy_api_url'),
    DEFAULT_LEGACY_API
  )) || DEFAULT_LEGACY_API;

  const communityApi = ensureApiBaseUrl(readFirst(
    params.get('communityApi'),
    params.get('discussionsApi'),
    localStorage.getItem('nibras_community_api_url'),
    DEFAULT_COMMUNITY_API
  )) || DEFAULT_COMMUNITY_API;

  const trackingApi = ensureApiBaseUrl(readFirst(
    params.get('trackingApi'),
    params.get('trackApi'),
    localStorage.getItem('nibras_tracking_api_url'),
    DEFAULT_TRACKING_API
  )) || DEFAULT_TRACKING_API;

  const competitionsApi = ensureApiBaseUrl(readFirst(
    params.get('competitionsApi'),
    params.get('compApi'),
    localStorage.getItem('nibras_competitions_api_url'),
    DEFAULT_COMPETITIONS_API
  )) || DEFAULT_COMPETITIONS_API;

  const services = Object.freeze({
    admin: adminApi,
    legacyCommunity: legacyCommunityApi,
    community: communityApi,
    tracking: trackingApi,
    competitions: competitionsApi,
  });
  const googleClientId = String(
    params.get('googleClientId') ||
    params.get('gClientId') ||
    localStorage.getItem('nibras_google_client_id') ||
    window.NIBRAS_GOOGLE_CLIENT_ID ||
    DEFAULT_GOOGLE_CLIENT_ID
  ).trim();

  const getServiceUrl = (service = 'admin') => services[service] || services.admin;

  window.NIBRAS_API_SERVICES = services;
  window.NIBRAS_API_URL = services.admin;
  window.NIBRAS_BACKEND_URL = services.admin;
  window.NIBRAS_LEGACY_API_URL = services.legacyCommunity;
  window.NIBRAS_COMMUNITY_API_URL = services.community;
  window.NIBRAS_TRACKING_API_URL = services.tracking;
  window.NIBRAS_COMPETITIONS_API_URL = services.competitions;
  window.NIBRAS_GOOGLE_CLIENT_ID = googleClientId;
  window.NibrasApiConfig = Object.freeze({
    services,
    googleClientId,
    getServiceUrl,
  });

  console.log('[NIBRAS Config] API services:', services);
  console.log('[NIBRAS Config] Frontend running on:', `${window.location.hostname}:${window.location.port}`);
})();
