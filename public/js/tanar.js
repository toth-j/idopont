const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const loginErrorDiv = document.getElementById('login-error');

const dashboardSection = document.getElementById('dashboard-section');
const udvozloUzenetH1 = document.getElementById('udvozlo-uzenet');
const dashboardTeremSpan = document.getElementById('dashboard-terem');
const dashboardTargyakSpan = document.getElementById('dashboard-targyak');
const tanariFoglalasokBody = document.getElementById('tanari-foglalasok-body');
const logoutBtn = document.getElementById('logout-btn');

const API_URL = '';

// Oldal betöltésekor
document.addEventListener('DOMContentLoaded', async () => {
    // Dátum betöltése a navigációba
    try {
        const response = await fetch(`${API_URL}/api/config`);
        if (response.ok) {
            const config = await response.json();
            if (config.date) {
                document.getElementById('navbar-brand-title').textContent = `Fogadóóra (${config.date})`;
            }
        }
    } catch (error) { console.error('Hiba a konfiguráció betöltésekor:', error); }
    checkLoginState(); // Login állapot ellenőrzése a dátum betöltése után
});

// Ellenőrzi, van-e token, és megjeleníti a login szakaszt vagy a dashboardot
function checkLoginState() {
    const token = localStorage.getItem('tanarToken');
    const tanarData = JSON.parse(localStorage.getItem('tanarData'));

    if (!token || !tanarData) {
        showLogin();
    } else {
        showDashboard(tanarData, token);
    }
}

function showLogin() {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    localStorage.removeItem('tanarToken');
    localStorage.removeItem('tanarData');
}

async function showDashboard(tanar, token) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';

    udvozloUzenetH1.textContent = `Üdvözöljük, ${tanar.nev}!`;
    dashboardTeremSpan.textContent = tanar.terem || 'Nincs megadva';
    dashboardTargyakSpan.textContent = tanar.targyak || 'Nincs megadva';

    await loadTanariFoglalasok(token);
}

// Bejelentkezés
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorDiv.textContent = '';
    const nev = document.getElementById('tanar-nev-login').value;
    const jelszo = document.getElementById('jelszo-login').value;

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nev, jelszo })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.hiba || 'Sikertelen bejelentkezés');
        }

        localStorage.setItem('tanarToken', data.token);
        localStorage.setItem('tanarData', JSON.stringify(data.tanar));
        showDashboard(data.tanar, data.token);
    } catch (error) {
        console.error(error);
        loginErrorDiv.textContent = error.message;
    }
});

// Kijelentkezés
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        showLogin();
    });
}

// Tanári foglalások betöltése
async function loadTanariFoglalasok(token) {
    try {
        const response = await fetch(`${API_URL}/api/auth/profil/foglalasok`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Lejárt vagy érvénytelen munkamenet. Kérjük, jelentkezzen be újra.');
                showLogin();
            }
            throw new Error('Foglalások betöltése sikertelen');
        }
        const foglalasok = await response.json();

        tanariFoglalasokBody.innerHTML = '';
        if (foglalasok.length > 0) {
            foglalasok.forEach(foglalas => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                        <td>${foglalas.idosav}</td>
                        <td>${foglalas.tanuloNeve}</td>
                        <td>${foglalas.oktatasiAzonosito}</td>
                    `;
                tanariFoglalasokBody.appendChild(tr);
            });

        } else {
            tanariFoglalasokBody.innerHTML = '<tr><td colspan="3" class="text-center">Nincsenek aktuális foglalások.</td></tr>';
        }

    } catch (error) {
        console.error(error);
        tanariFoglalasokBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${error.message}</td></tr>`;
    }
}
