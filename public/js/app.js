(function () {
  const $ = (id) => document.getElementById(id);

  const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const longFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const localISO = (d = new Date()) => {
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 10);
  };
  const shiftISO = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return localISO(d);
  };
  const showDate = (iso) => dateFmt.format(new Date(iso + 'T00:00:00'));

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  let lastSavedId = null;

  /* ---------- Session ---------- */

  function backToLogin() {
    window.location.replace('index.html');
  }

  // Any request that finds the session gone sends the user back to sign in
  function handleError(err) {
    if (err.status === 401) return backToLogin();
    toast(err.message);
  }

  $('signOut').addEventListener('click', async (e) => {
    e.preventDefault();
    try { await Api.logout(); } catch { /* signing out locally is enough */ }
    window.location.href = 'index.html';
  });

  /* ---------- Views ---------- */

  function showView() {
    const view = location.hash === '#register' ? 'register' : 'new';
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== 'view-' + view; });
    document.querySelectorAll('.nav-item').forEach((a) => {
      if (a.dataset.view === view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = (view === 'new' ? 'New patient' : 'Dashboard') + ' · CarePoint Front Desk';
    if (view === 'register') loadRegister();
    else resetForm();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', showView);

  /* ---------- New patient form ---------- */

  const form = $('patientForm');
  const fields = ['visitDate', 'gender', 'patientName', 'mobile', 'address'];

  $('todayLabel').textContent = longFmt.format(new Date());

  async function resetForm() {
    form.reset();
    form.visitDate.value = localISO();
    form.visitDate.max = localISO();
    $('remarksCount').textContent = '0 / 500';
    fields.forEach((f) => setError(f, ''));
    try {
      $('regNo').textContent = await Api.nextRegNo();
    } catch (err) {
      $('regNo').textContent = '—';
      if (err.status === 401) backToLogin();
    }
  }

  function setError(name, message) {
    const wrap = name === 'gender' ? $('gender-field') : form[name].closest('.field');
    wrap.classList.toggle('has-error', Boolean(message));
    $(name + '-error').textContent = message;
  }

  function validate(data) {
    const errors = {};
    if (!data.visitDate) errors.visitDate = 'Choose the visit date.';
    else if (data.visitDate > localISO()) errors.visitDate = 'The visit date can’t be in the future.';
    if (!data.gender) errors.gender = 'Choose a gender.';
    if (data.patientName.length < 2) errors.patientName = 'Enter the patient’s full name.';
    if (!/^[6-9]\d{9}$/.test(data.mobile)) errors.mobile = 'Enter a 10-digit mobile number starting with 6, 7, 8 or 9.';
    if (data.address.length < 5) errors.address = 'Enter the address, at least the area and city.';
    return errors;
  }

  form.mobile.addEventListener('input', () => {
    form.mobile.value = form.mobile.value.replace(/\D/g, '').slice(0, 10);
  });

  form.remarks.addEventListener('input', () => {
    $('remarksCount').textContent = form.remarks.value.length + ' / 500';
  });

  // Clear a field's error as soon as it is corrected
  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (fields.includes(name)) setError(name, '');
  });

  function isDirty() {
    return ['patientName', 'mobile', 'address', 'remarks'].some((f) => form[f].value.trim())
      || Boolean(form.querySelector('input[name="gender"]:checked'));
  }

  $('cancelBtn').addEventListener('click', () => {
    if (isDirty() && !confirm('Discard this entry? The details you typed will be cleared.')) return;
    resetForm();
    form.patientName.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      visitDate: form.visitDate.value,
      gender: (form.querySelector('input[name="gender"]:checked') || {}).value || '',
      patientName: form.patientName.value.trim().replace(/\s+/g, ' '),
      mobile: form.mobile.value.trim(),
      address: form.address.value.trim(),
      remarks: form.remarks.value.trim(),
    };

    const errors = validate(data);
    fields.forEach((f) => setError(f, errors[f] || ''));
    const first = fields.find((f) => errors[f]);
    if (first) {
      (first === 'gender' ? $('g-male') : form[first]).focus();
      return;
    }

    const btn = $('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const saved = await Api.createPatient(data);
      lastSavedId = saved.id;
      toast(`Patient saved: ${saved.patientName}, reg. no. ${saved.id}`);
      await resetForm();
      form.patientName.focus();
    } catch (err) {
      if (err.fields) {
        fields.forEach((f) => setError(f, err.fields[f] || ''));
        const bad = fields.find((f) => err.fields[f]);
        if (bad) (bad === 'gender' ? $('g-male') : form[bad]).focus();
      }
      handleError(err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save patient';
    }
  });

  /* ---------- Toast ---------- */

  let toastTimer;
  function toast(text) {
    $('toastText').textContent = text;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 6000);
  }
  $('toastAction').addEventListener('click', () => {
    $('toast').classList.remove('show');
    location.hash = '#register';
  });

  /* ---------- Dashboard ---------- */

  const fName = $('f-name');
  const fFrom = $('f-from');
  const fTo = $('f-to');

  function setRange(range) {
    const today = localISO();
    const ranges = {
      today: [today, today],
      yesterday: [shiftISO(-1), shiftISO(-1)],
      7: [shiftISO(-6), today],
      30: [shiftISO(-29), today],
      all: ['', ''],
    };
    [fFrom.value, fTo.value] = ranges[range];
    syncChips();
    loadRegister();
  }

  function syncChips() {
    const today = localISO();
    const match = {
      today: fFrom.value === today && fTo.value === today,
      yesterday: fFrom.value === shiftISO(-1) && fTo.value === shiftISO(-1),
      7: fFrom.value === shiftISO(-6) && fTo.value === today,
      30: fFrom.value === shiftISO(-29) && fTo.value === today,
      all: !fFrom.value && !fTo.value,
    };
    document.querySelectorAll('.chip').forEach((c) => {
      c.setAttribute('aria-pressed', String(Boolean(match[c.dataset.range])));
    });
  }

  document.querySelectorAll('.chip').forEach((c) => {
    c.addEventListener('click', () => setRange(c.dataset.range));
  });

  let searchTimer;
  fName.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadRegister, 200);
  });
  [fFrom, fTo].forEach((el) => el.addEventListener('change', () => { syncChips(); loadRegister(); }));
  $('filters').addEventListener('submit', (e) => { e.preventDefault(); loadRegister(); });

  function clearFilters() {
    fName.value = '';
    setRange('all');
    fName.focus();
  }
  $('clearFilters').addEventListener('click', clearFilters);
  $('emptyClear').addEventListener('click', clearFilters);

  function highlight(name, term) {
    const safe = escapeHtml(name);
    if (!term) return safe;
    const re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }

  const genderColor = { Male: 'var(--scrub)', Female: 'var(--band)', Other: 'var(--ink-faint)' };

  async function loadRegister() {
    const filters = { name: fName.value, from: fFrom.value, to: fTo.value };
    if (filters.from && filters.to && filters.from > filters.to) {
      [filters.from, filters.to] = [filters.to, filters.from];
    }

    let list, todayList;
    try {
      [list, todayList] = await Promise.all([
        Api.listPatients(filters),
        Api.listPatients({ from: localISO(), to: localISO() }),
      ]);
    } catch (err) {
      return handleError(err);
    }

    // Summary
    const count = { Male: 0, Female: 0, Other: 0 };
    list.forEach((p) => { count[p.gender] = (count[p.gender] || 0) + 1; });
    $('t-total').textContent = list.length;
    $('t-male').textContent = count.Male;
    $('t-female').textContent = count.Female;
    $('t-other').textContent = count.Other;
    const bar = $('genderBar').children;
    const total = list.length || 1;
    bar[0].style.width = (count.Male / total) * 100 + '%';
    bar[1].style.width = (count.Female / total) * 100 + '%';
    bar[2].style.width = (count.Other / total) * 100 + '%';

    $('todaySummary').textContent = todayList.length
      ? `${todayList.length} patient${todayList.length === 1 ? '' : 's'} registered today, ${longFmt.format(new Date())}.`
      : `No patients registered yet today, ${longFmt.format(new Date())}.`;

    const term = filters.name.trim();
    $('resultCount').textContent = list.length === 1 ? '1 patient' : `${list.length} patients`;

    // Rows
    $('rows').innerHTML = list.map((p) => `
      <tr class="${p.id === lastSavedId ? 'row-new' : ''}">
        <td class="col-reg">#${p.id}</td>
        <td class="col-date">${showDate(p.visitDate)}</td>
        <td class="col-name"><strong>${highlight(p.patientName, term)}</strong></td>
        <td class="col-gender"><span class="g-tag"><span class="swatch" style="background:${genderColor[p.gender]}"></span>${escapeHtml(p.gender)}</span></td>
        <td class="col-mobile">+91 ${escapeHtml(p.mobile.slice(0, 5))} ${escapeHtml(p.mobile.slice(5))}</td>
        <td class="col-address">${escapeHtml(p.address)}</td>
        <td class="col-remarks">${p.remarks ? escapeHtml(p.remarks) : '<span style="color:var(--ink-faint)">None</span>'}</td>
      </tr>`).join('');

    $('empty').hidden = list.length > 0;
    document.querySelector('.register').hidden = list.length === 0;
    lastSavedId = null;
  }

  // Only show the app once the session is confirmed
  Api.me()
    .then((user) => {
      $('userName').textContent = user.name;
      $('userId').textContent = user.userId;
      document.body.classList.remove('is-loading');
      showView();
    })
    .catch(backToLogin);
})();
