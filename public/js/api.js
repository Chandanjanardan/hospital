/* Talks to the Node backend in api/index.js. Pages only use window.Api. */
(function () {
  async function request(method, url, body) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
      });
    } catch {
      throw new Error('Can’t reach the server. Check your internet connection and try again.');
    }

    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Something went wrong. Try again in a moment.');
      err.status = res.status;
      err.fields = data.fields;
      throw err;
    }
    return data;
  }

  window.Api = {
    login: (userId, password) => request('POST', '/api/login', { userId, password }),
    logout: () => request('POST', '/api/logout'),
    me: () => request('GET', '/api/me'),

    async nextRegNo() {
      const { next } = await request('GET', '/api/patients/next-reg-no');
      return next;
    },

    createPatient: (data) => request('POST', '/api/patients', data),

    /** filters: { name, from, to } — dates as YYYY-MM-DD */
    listPatients(filters = {}) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && String(value).trim()) params.set(key, String(value).trim());
      });
      const qs = params.toString();
      return request('GET', '/api/patients' + (qs ? '?' + qs : ''));
    },
  };
})();
