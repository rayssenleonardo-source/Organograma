const ADMIN_AUTH_KEY = 'organograma_admin_auth';
const ADMIN_PASSWORD = '123';
const DEFAULT_REDIRECT = 'admin.html';

const loginForm = document.getElementById('admin-login-form');
const passwordInput = document.getElementById('admin-password');
const loginStatus = document.getElementById('login-status');

function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    const rawNext = String(params.get('next') || '').trim();
    if (!rawNext) return DEFAULT_REDIRECT;

    const isExternal = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawNext) || rawNext.startsWith('//');
    if (isExternal) return DEFAULT_REDIRECT;

    if (!/^[a-zA-Z0-9._/-]+\.html(?:[?#].*)?$/.test(rawNext)) {
        return DEFAULT_REDIRECT;
    }

    return rawNext;
}

const redirectTarget = getRedirectTarget();

if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'ok') {
    window.location.href = redirectTarget;
}

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = String(passwordInput?.value || '');

    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'ok');
        window.location.href = redirectTarget;
        return;
    }

    if (loginStatus) {
        loginStatus.textContent = 'Senha incorreta.';
        loginStatus.classList.remove('hidden');
    }
});
