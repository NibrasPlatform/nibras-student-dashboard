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
 * 3. Defaults below
 */
(function () {
  const DEFAULT_ADMIN_API = 'https://nibras-admin-service-production.up.railway.app/api';
  const DEFAULT_LEGACY_API = 'https://community-system-production.up.railway.app';
  const DEFAULT_COMMUNITY_API = 'https://nibras-community.fly.dev';
  const DEFAULT_TRACKING_API = 'https://nibras-api.fly.dev';
  const DEFAULT_COMPETITIONS_API = 'https://competitionsproduction.up.railway.app';

  const params = new URLSearchParams(window.location.search);

  const normalizeUrl = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.replace(/\/+$/, '') : null;
  };

  const readFirst = (...values) => {
    for (let i = 0; i < values.length; i += 1) {
      const normalized = normalizeUrl(values[i]);
      if (normalized) return normalized;
    }
    return null;
  };

  const adminApi = readFirst(
    params.get('api'),
    params.get('adminApi'),
    localStorage.getItem('nibras_admin_api_url'),
    localStorage.getItem('nibras_api_url'),
    window.NIBRAS_API_URL,
    window.NIBRAS_BACKEND_URL,
    DEFAULT_ADMIN_API
  );

  const legacyCommunityApi = readFirst(
    params.get('legacyApi'),
    localStorage.getItem('nibras_legacy_api_url'),
    DEFAULT_LEGACY_API
  );

  const communityApi = readFirst(
    params.get('communityApi'),
    params.get('discussionsApi'),
    localStorage.getItem('nibras_community_api_url'),
    DEFAULT_COMMUNITY_API
  );

  const trackingApi = readFirst(
    params.get('trackingApi'),
    params.get('trackApi'),
    localStorage.getItem('nibras_tracking_api_url'),
    DEFAULT_TRACKING_API
  );

  const competitionsApi = readFirst(
    params.get('competitionsApi'),
    params.get('compApi'),
    localStorage.getItem('nibras_competitions_api_url'),
    DEFAULT_COMPETITIONS_API
  );

  const services = Object.freeze({
    admin: adminApi,
    legacyCommunity: legacyCommunityApi,
    community: communityApi,
    tracking: trackingApi,
    competitions: competitionsApi,
  });

  const getServiceUrl = (service = 'admin') => services[service] || services.admin;

  window.NIBRAS_API_SERVICES = services;
  window.NIBRAS_API_URL = services.admin;
  window.NIBRAS_BACKEND_URL = services.admin;
  window.NIBRAS_LEGACY_API_URL = services.legacyCommunity;
  window.NIBRAS_COMMUNITY_API_URL = services.community;
  window.NIBRAS_TRACKING_API_URL = services.tracking;
  window.NIBRAS_COMPETITIONS_API_URL = services.competitions;
  window.NibrasApiConfig = Object.freeze({
    services,
    getServiceUrl,
  });

  console.log('[NIBRAS Config] API services:', services);
  console.log('[NIBRAS Config] Frontend running on:', `${window.location.hostname}:${window.location.port}`);
})();
