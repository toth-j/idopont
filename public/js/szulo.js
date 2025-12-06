const tanuloAdatokSection = document.getElementById('tanulo-adatok-section');
const tanuloAdatokForm = document.getElementById('tanulo-adatok-form');
const formTanuloNeveInput = document.getElementById('form-tanulo-neve');
const formOktatasiAzonositoInput = document.getElementById('form-oktatasi-azonosito');

const tanarokListaSection = document.getElementById('tanarok-lista-section');
const tanarokSelectElem = document.getElementById('tanarok-select');

const fogadooraSection = document.getElementById('fogadoora-section');
const valasztottTanarNevElem = document.getElementById('valasztott-tanar-nev');
const valasztottTanarTeremSpan = document.getElementById('valasztott-tanar-terem');
const valasztottTanarTargyakSpan = document.getElementById('valasztott-tanar-targyak');
const idopontokListaDiv = document.getElementById('idopontok-lista');

const foglalasaimSection = document.getElementById('foglalasaim-section');
const foglalasaimTanuloInfoSpan = document.getElementById('foglalasaim-tanulo-info');
const sajatFoglalasokDiv = document.getElementById('sajat-foglalasok');

let sajatFoglalasok = [];
let aktualisTanuloNeve = '';
let aktualisOktatasiAzonosito = '';

// Globális inicializálás: Dátum betöltése a navigációba
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      document.getElementById('navbar-brand-title').textContent = `Fogadóóra (${config.date})`;
    }
  } catch (error) {
    console.error('Hiba a dátum betöltésekor:', error);
  }
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
  tanarokListaSection.style.display = 'block';
  foglalasaimSection.style.display = 'block';

  await loadTanarok();
  await loadSajatFoglalasok(aktualisOktatasiAzonosito);
});

// Tanárok betöltése
async function loadTanarok() {
  try {
    const response = await fetch('/api/tanarok');
    if (!response.ok) throw new Error('Tanárok betöltése sikertelen');
    const tanarok = await response.json();

    tanarokSelectElem.innerHTML = '<option value="">-- Válasszon tanárt --</option>';
    tanarok.forEach(tanar => {
      const option = document.createElement('option');
      option.value = tanar.tanarID;
      option.textContent = `${tanar.nev} (${tanar.targyak || 'Tantárgy nincs megadva'})`;
      tanarokSelectElem.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    tanarokSelectElem.innerHTML = `<option value="">Hiba: ${error.message}</option>`;
  }
}

// Eseményfigyelő a select elemhez
tanarokSelectElem.addEventListener('change', (e) => {
  const tanarID = Number(e.target.value);
  if (tanarID) {
    loadFogadoora(tanarID);
  } else {
    // Kiválasztás törlése: elrejtjük a fogadóóra szekciót
    fogadooraSection.style.display = 'none';
  }
});

// Egy tanár fogadóórájának betöltése
async function loadFogadoora(tanarID) {
  try {
    const response = await fetch(`/api/tanarok/${tanarID}/fogadoora`);
    if (!response.ok) throw new Error('Fogadóóra betöltése sikertelen');
    const data = await response.json();

    // Ellenőrizzük, hogy van-e már foglalás ehhez a tanárhoz
    const vanMarFoglalasEhhezATanarhoz = sajatFoglalasok.some(
      foglalas => foglalas.tanarID === tanarID
    );

    if (vanMarFoglalasEhhezATanarhoz) {
      // Ha van foglalás, elrejtjük a fogadóóra szekciót
      fogadooraSection.style.display = 'none';
    } else {
      // Ha nincs foglalás, megjelenítsük a tanár adatait és az időpontokat
      valasztottTanarNevElem.textContent = data.nev;
      valasztottTanarTeremSpan.textContent = data.terem || 'Nincs megadva';
      valasztottTanarTargyakSpan.textContent = data.targyak || 'Nincs megadva';
      
      // Megjelenítjük az időpontokat
      idopontokListaDiv.innerHTML = ''; // Előző tartalom törlése
      if (data.idopontok && data.idopontok.length > 0) {
        data.idopontok.forEach(idopont => {
          const gomb = document.createElement('button');
          gomb.type = 'button';
          gomb.classList.add('btn');
          gomb.textContent = idopont.idosav;
          if (idopont.statusz === 'szabad') {
            gomb.classList.add('btn-success');
            gomb.addEventListener('click', () => startFoglalas(tanarID, data.nev, idopont.idosav));
          } else {
            gomb.classList.add('btn-danger');
            gomb.disabled = true;
          }
          idopontokListaDiv.appendChild(gomb);
        });
      } else {
        idopontokListaDiv.innerHTML = '<p>Nincsenek elérhető időpontok.</p>';
      }
      fogadooraSection.style.display = 'block';
    }
  } catch (error) {
    console.error(error);
    idopontokListaDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    fogadooraSection.style.display = 'block'; // Hogy a hiba látszódjon
  }
}

// Foglalás indítása
async function startFoglalas(tanarID, tanarNev, idosav) {
  // Ellenőrizzük, hogy az idősáv szerepel-e már a "Foglalásaim" között
  const idosavMarFoglaltMasikTanarnal = sajatFoglalasok.some(
    foglalas => foglalas.idosav === idosav
  );
  if (idosavMarFoglaltMasikTanarnal) {
    alert(`Figyelem: Ebben az idősávban (${idosav}) már van egy másik foglalásod. Kérjük, válassz másik időpontot, vagy mondd le a másik foglalást.`);
    return;
  }
  // Megerősítés
  if (!confirm(`Tanár: ${tanarNev}\nIdősáv: ${idosav}\nBiztosan szeretné lefoglalni ezt az időpontot?`))
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
      throw new Error('A foglalás sikertelen');
    }
    // Frissítjük a "Foglalásaim" listát
    await loadSajatFoglalasok(aktualisOktatasiAzonosito);
    // Elrejtjük az időpontokat
    fogadooraSection.style.display = 'none';
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
      throw new Error(`A saját foglalások lekérdezése sikertelen (státusz: ${response.status})`);
    }
    sajatFoglalasok = await response.json();

    if (sajatFoglalasok.length > 0) {
      // A DOM frissítése
      sajatFoglalasokDiv.innerHTML = '';
      const ul = document.createElement('ul');
      ul.classList.add('list-group');
      sajatFoglalasok.forEach(foglalas => {
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
    sajatFoglalasok = [];
  }
}

// Foglalás lemondása
async function cancelFoglalas(tanarID, oktatasiAzonosito) {
  if (!confirm('Biztosan le szeretné mondani ezt a foglalást?')) {
    return;
  }

  try {
    const response = await fetch(`/api/foglalasok?tanarID=${tanarID}&oktatasiAzonosito=${oktatasiAzonosito}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`A lemondás sikertelen (státusz: ${response.status})`);
    }
    await loadSajatFoglalasok(oktatasiAzonosito); // Frissítjük a "Foglalások" listát
    if (tanarokSelectElem.value && tanarokSelectElem.value === tanarID) {
      loadFogadoora(tanarokSelectElem.value); // Frissítjük az aktuális tanár idősávjait is, ha az volt nyitva
    }
  } catch (error) {
    alert(`Hiba a lemondáskor: ${error.message}`);
  }
}
