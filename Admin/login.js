const ADMIN_AUTH_KEY = 'organograma_admin_auth';
const ADMIN_PASSWORD = '123';

const loginForm = document.getElementById('admin-login-form');
const passwordInput = document.getElementById('admin-password');
const loginStatus = document.getElementById('login-status');

if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'ok') {
    window.location.href = 'admin.html';
}

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = String(passwordInput?.value || '');

    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'ok');
        window.location.href = 'admin.html';
        return;
    }

    if (loginStatus) {
        loginStatus.textContent = 'Senha incorreta.';
        loginStatus.classList.remove('hidden');
    }
});
