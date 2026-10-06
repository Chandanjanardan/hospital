/*
 * Design-preview data layer.
 * Same function names the real Node/Neon API will expose, so swapping this file
 * for fetch() calls later leaves the pages untouched.
 */
(function () {
  const store = {
    get(key) {
      try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
    },
    set(key, value) {
      try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* preview only */ }
    },
    remove(key) {
      try { sessionStorage.removeItem(key); } catch { /* preview only */ }
    },
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function isoDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  const SAMPLE = [
    [0, 'Ramesh Kumar', 'Male', '14, Shastri Nagar, Kanpur', '9839012345', 'Fever for 3 days, sent to OPD 2'],
    [0, 'Priya Sharma', 'Female', 'B-22, Sector 15, Noida', '9810023456', 'Follow-up after delivery, Dr. Mehta'],
    [0, 'Mohd. Arif', 'Male', 'Old City, near Jama Masjid, Lucknow', '9935067890', ''],
    [1, 'Sunita Devi', 'Female', 'Village Bhatpura, Barabanki', '8765432109', 'BP check, diabetic'],
    [1, 'Ankit Verma', 'Male', 'Flat 302, Green Park Apts, Lucknow', '9455011223', 'X-ray left wrist'],
    [1, 'Kavya Iyer', 'Female', '7th Cross, Indiranagar, Bengaluru', '9845098765', 'Child vaccination, 18 months'],
    [2, 'Rajesh Yadav', 'Male', 'Gomti Nagar, Lucknow', '9792233445', 'Chest pain, referred to cardiology'],
    [2, 'Neha Gupta', 'Female', '45, Civil Lines, Allahabad', '9918877665', ''],
    [3, 'Alex Fernandes', 'Other', 'Bandra West, Mumbai', '9820055443', 'Dressing change'],
    [3, 'Sita Ram Mishra', 'Male', 'Alambagh, Lucknow', '7007123456', 'Cataract consultation'],
    [4, 'Fatima Begum', 'Female', 'Aminabad, Lucknow', '9336655443', 'Pregnancy scan, 24 weeks'],
    [5, 'Vikram Singh', 'Male', 'Cantt Road, Lucknow', '9415098123', 'Knee pain, physiotherapy'],
    [6, 'Pooja Rawat', 'Female', 'Indira Nagar, Lucknow', '8090123987', 'Thyroid report collection'],
    [8, 'Harish Chandra', 'Male', 'Chinhat, Lucknow', '9450987654', ''],
    [9, 'Meena Kumari', 'Female', 'Rajajipuram, Lucknow', '9369874521', 'Skin allergy'],
    [12, 'Deepak Pandey', 'Male', 'Jankipuram, Lucknow', '9984512376', 'Admitted to ward 4'],
    [15, 'Rukhsar Khan', 'Female', 'Hazratganj, Lucknow', '9026541238', 'Dental, root canal sitting 2'],
    [21, 'Gopal Tiwari', 'Male', 'Mahanagar, Lucknow', '9125874563', 'Annual health check'],
  ];

  function seed() {
    return SAMPLE.map((row, i) => ({
      id: SAMPLE.length - i,
      visitDate: isoDaysAgo(row[0]),
      patientName: row[1],
      gender: row[2],
      address: row[3],
      mobile: row[4],
      remarks: row[5],
      createdBy: 'admin',
    }));
  }

  function allPatients() {
    let list = store.get('preview.patients');
    if (!list) {
      list = seed();
      store.set('preview.patients', list);
    }
    return list;
  }

  window.Api = {
    async login(userId, password) {
      await wait(450);
      if (userId === 'admin' && password === 'admin123') {
        const user = { userId: 'admin', name: 'Front Desk' };
        store.set('preview.user', user);
        return user;
      }
      throw new Error('That user ID and password don’t match. Check both and try again.');
    },

    async logout() {
      store.remove('preview.user');
    },

    async me() {
      const user = store.get('preview.user');
      if (!user) throw new Error('Not signed in');
      return user;
    },

    async nextRegNo() {
      const list = allPatients();
      return list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    },

    async createPatient(data) {
      await wait(350);
      const list = allPatients();
      const patient = { id: await this.nextRegNo(), createdBy: 'admin', ...data };
      list.unshift(patient);
      store.set('preview.patients', list);
      return patient;
    },

    /** filters: { name, from, to } — dates as YYYY-MM-DD */
    async listPatients(filters = {}) {
      await wait(120);
      const name = (filters.name || '').trim().toLowerCase();
      return allPatients()
        .filter((p) => !name || p.patientName.toLowerCase().includes(name))
        .filter((p) => !filters.from || p.visitDate >= filters.from)
        .filter((p) => !filters.to || p.visitDate <= filters.to)
        .sort((a, b) => b.visitDate.localeCompare(a.visitDate) || b.id - a.id);
    },
  };
})();
