const tanuloAdatokSection = document.getElementById('tanulo-adatok-section');
const tanuloAdatokForm = document.getElementById('tanulo-adatok-form');
const formTanuloNeveInput = document.getElementById('form-tanulo-neve');
const formOktatasiAzonositoInput = document.getElementById('form-oktatasi-azonosito');

const tanarokListaSection = document.getElementById('tanarok-lista-section');
const tanarokListaDiv = document.getElementById('tanarok-lista');

const fogadooraSection = document.getElementById('fogadoora-section');
const valasztottTanarNevElem = document.getElementById('valasztott-tanar-nev');
const valasztottTanarTeremSpan = document.getElementById('valasztott-tanar-terem');
const valasztottTanarTargyakSpan = document.getElementById('valasztott-tanar-targyak');
const idopontokListaDiv = document.getElementById('idopontok-lista');

const foglalasaimSection = document.getElementById('foglalasaim-section');
const foglalasaimTanuloInfoSpan = document.getElementById('foglalasaim-tanulo-info');
const sajatFoglalasokDiv = document.getElementById('sajat-foglalasok');

let aktivTanarId = null;
let tanarokCache = []; // Gyorsítótár a tanároknak
let aktualisTanuloNeve = '';
let aktualisOktatasiAzonosito = '';

// Globális inicializálás: Dátum betöltése a navigációba
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      if (config.date) {
        document.getElementById('navbar-brand-title').textContent = `Fogadóóra (${config.date})`;
      }
    }
  } catch (error) { console.error('Hiba a konfiguráció betöltésekor:', error); }
});

// Tanulói adatok kezelése
tanuloAdatokForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tanuloNeve = formTanuloNeveInput.value.trim();
  const oktatasiAzonosito = formOktatasiAzonositoInput.value.trim();
  if (!tanuloNeve || !oktatasiAzonosito || oktatasiAzonosito.length !== 11 || !/^\d+$/.test(oktatasiAzonosito)) {
    alert('Kérjük, adja meg helyesen a tanuló nevét és a 11 jegyű oktatási azonosítóját!');
    return;
  }
  aktualisTanuloNeve = tanuloNeve;
  aktualisOktatasiAzonosito = oktatasiAzonosito;
  tanuloAdatokSection.style.display = 'none';
  tanarokListaSection.style.display = 'block';
  foglalasaimSection.style.display = 'block';
  foglalasaimTanuloInfoSpan.textContent = `${aktualisTanuloNeve} ${aktualisOktatasiAzonosito}`;

  await loadTanarok(); // Először a tanárokat töltjük be, hogy a cache rendelkezésre álljon
  await loadSajatFoglalasok(aktualisOktatasiAzonosito); // Majd a saját foglalásokat, ami használja a tanarokCache-t
});

// Tanárok betöltése
async function loadTanarok() {
  try {
    const response = await fetch('/api/tanarok');
    if (!response.ok) throw new Error('Tanárok betöltése sikertelen');
    tanarokCache = await response.json();

    tanarokListaDiv.innerHTML = '';
    tanarokCache.forEach(tanar => {
      const tanarElem = document.createElement('a');
      tanarElem.href = '#';
      tanarElem.classList.add('list-group-item', 'list-group-item-action');
      tanarElem.textContent = `${tanar.nev} (${tanar.targyak || 'Nincs megadva'})`;
      tanarElem.dataset.tanarId = tanar.tanarID;

      tanarElem.addEventListener('click', (e) => {
        e.preventDefault();
        loadFogadoora(tanar.tanarID);
        // Aktív elem jelölése (először eltávolítjuk az aktív osztályt az összes elemről, utána hozzáadjuk az aktuálishoz)
        document.querySelectorAll('#tanarok-lista .list-group-item-action').forEach(item => item.classList.remove('active'));
        tanarElem.classList.add('active');
      });
      tanarokListaDiv.appendChild(tanarElem);
    });
  } catch (error) {
    console.error(error);
    tanarokListaDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// Egy tanár fogadóórájának betöltése
async function loadFogadoora(tanarID) {
  aktivTanarId = tanarID;
  try {
    const response = await fetch(`/api/tanarok/${tanarID}/fogadoora`);
    if (!response.ok) throw new Error('Fogadóóra betöltése sikertelen');
    const data = await response.json();

    valasztottTanarNevElem.textContent = data.nev;
    valasztottTanarTeremSpan.textContent = data.terem || 'Nincs megadva';
    valasztottTanarTargyakSpan.textContent = data.targyak || 'Nincs megadva';

    idopontokListaDiv.innerHTML = '';
    if (data.idopontok && data.idopontok.length > 0) {
      data.idopontok.forEach(idopont => {
        const gomb = document.createElement('button');
        gomb.type = 'button';
        gomb.classList.add('btn');
        gomb.textContent = idopont.idosav;
        if (idopont.statusz === 'szabad') {
          gomb.classList.add('btn-success');
          gomb.addEventListener('click', () => kezdemenyezFoglalas(tanarID, data.nev, idopont.idosav));
        } else {
          gomb.classList.add('btn-danger');
          gomb.disabled = true;
          gomb.title = `Foglalt: ${idopont.foglaloAdatai.tanuloNeve}`;
        }
        idopontokListaDiv.appendChild(gomb);
      });
    } else {
      idopontokListaDiv.innerHTML = '<p>Nincsenek elérhető időpontok.</p>';
    }
    fogadooraSection.style.display = 'block';
  } catch (error) {
    console.error(error);
    idopontokListaDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    fogadooraSection.style.display = 'block'; // Hogy a hiba látszódjon
  }
}

// Foglalás kezdeményezése confirm ablakkal
async function kezdemenyezFoglalas(tanarID, tanarNev, idosav) {
  if (!confirm(`Tanár: ${tanarNev}\nIdősáv: ${idosav}\nBiztosan szeretné lefoglalni ezt az idoőpontot?`))
    return;

  try {
    const response = await fetch(`/api/tanarok/${tanarID}/foglalasok`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idosav: idosav,
        tanuloNeve: aktualisTanuloNeve,
        oktatasiAzonosito: aktualisOktatasiAzonosito
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.hiba || 'Foglalás sikertelen');
    }
    if (aktivTanarId) {
      loadFogadoora(aktivTanarId); // Frissítjük az aktuális tanár nézetét
    }
    await loadSajatFoglalasok(aktualisOktatasiAzonosito); // Foglalásaim frissítése
  } catch (error) {
    alert(`Hiba: ${error.message}`);
  }
}

// Saját foglalások betöltése
async function loadSajatFoglalasok(oktatasiAzonosito) {
  sajatFoglalasokDiv.innerHTML = '<p>Keresés...</p>';

  try {
    const response = await fetch(`/api/tanulok/${oktatasiAzonosito}/foglalasok`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.hiba || `Saját foglalások lekérdezése sikertelen (státusz: ${response.status})`);
    }
    const talaltFoglalasok = await response.json();

    if (talaltFoglalasok && talaltFoglalasok.length > 0) {
      sajatFoglalasokDiv.innerHTML = ''; 
      const ul = document.createElement('ul');
      ul.classList.add('list-group');
      talaltFoglalasok.forEach(foglalas => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        li.innerHTML = `
                        <span><strong>${foglalas.tanarNev}</strong> - ${foglalas.idosav}</span>
                        <button class="btn btn-sm btn-warning btn-lemond" data-tanar-id="${foglalas.tanarID}" data-oktatasi-azonosito="${oktatasiAzonosito}">Lemondás</button>
                    `;
        const lemondButton = li.querySelector('.btn-lemond');
        if (lemondButton) {
          lemondButton.addEventListener('click', async () => {
            // Az e.target helyett közvetlenül a dataset-ből olvassuk ki, mivel a gomb maga az esemény célpontja
            await cancelFoglalas(lemondButton.dataset.tanarId, lemondButton.dataset.oktatasiAzonosito);
          });
        }
        ul.appendChild(li);
      });
      sajatFoglalasokDiv.appendChild(ul);
    } else {
      sajatFoglalasokDiv.innerHTML = '<p class="alert alert-info">Nincsenek foglalásaid ezzel az oktatási azonosítóval.</p>';
    }
  } catch (error) {
    console.error('Hiba a saját foglalások keresésekor:', error);
    sajatFoglalasokDiv.innerHTML = '<p class="alert alert-danger">Hiba történt a foglalások keresése közben.</p>';
  }
}

// Foglalás lemondása
async function cancelFoglalas(tanarID, oktatasiAzonosito) {
  if (!confirm('Biztosan le szeretné mondani ezt a foglalást?')) {
    return; // A felhasználó megszakította a műveletet
  }

  try {
    const response = await fetch(`/api/foglalasok?tanarID=${tanarID}&oktatasiAzonosito=${oktatasiAzonosito}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ hiba: 'Ismeretlen hiba' }));
      throw new Error(errorData.hiba || `Lemondás sikertelen (státusz: ${response.status})`);
    }
    await loadSajatFoglalasok(oktatasiAzonosito); // Frissítjük a "Foglalásaim" listát
    if (aktivTanarId && String(aktivTanarId) === String(tanarID)) {
      loadFogadoora(aktivTanarId); // Frissítjük az aktuális tanár idősávjait is, ha az volt nyitva
    }
  } catch (error) {
    alert(`Hiba a lemondáskor: ${error.message}`);
  }
}
