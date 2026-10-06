(function () {
  const form = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');
  const button = document.getElementById('loginBtn');
  const password = document.getElementById('password');
  const toggle = document.getElementById('togglePassword');

  // Already signed in: go straight to the app
  Api.me().then(() => window.location.replace('app.html')).catch(() => {});

  toggle.addEventListener('click', () => {
    const showing = password.type === 'text';
    password.type = showing ? 'password' : 'text';
    toggle.textContent = showing ? 'Show' : 'Hide';
    toggle.setAttribute('aria-pressed', String(!showing));
  });

  function showError(message) {
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertBox.hidden = true;

    const userId = form.userId.value.trim();
    const pass = form.password.value;

    if (!userId || !pass) {
      showError('Enter your user ID and password.');
      (userId ? form.password : form.userId).focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Signing in…';

    try {
      await Api.login(userId, pass);
      window.location.href = 'app.html';
    } catch (err) {
      showError(err.message);
      form.password.value = '';
      form.password.focus();
      button.disabled = false;
      button.textContent = 'Sign in';
    }
  });
})();
