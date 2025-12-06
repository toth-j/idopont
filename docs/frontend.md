# Frontend fejlesztői dokumentáció

Ez a dokumentum a Fogadóóra alkalmazás frontend részének fejlesztői dokumentációját tartalmazza.

## Tartalomjegyzék

- [Frontend fejlesztői dokumentáció](#frontend-fejlesztői-dokumentáció)
  - [Tartalomjegyzék](#tartalomjegyzék)
  - [1. Áttekintés](#1-áttekintés)
  - [2. Fájlstruktúra](#2-fájlstruktúra)
  - [3. HTML fájlok](#3-html-fájlok)
    - [3.1. `index.html` (Szülői felület)](#31-indexhtml-szülői-felület)
    - [3.2. `tanar.html` (Tanári felület)](#32-tanarhtml-tanári-felület)
  - [4. JavaScript fájlok](#4-javascript-fájlok)
    - [4.1. `szulo.js` (Szülői felület logikája)](#41-szulojs-szülői-felület-logikája)
    - [4.2. `tanar.js` (Tanári felület logikája)](#42-tanarjs-tanári-felület-logikája)
  - [5. CSS stílusok](#5-css-stílusok)
  - [6. API interakciók](#6-api-interakciók)
  - [7. Fontosabb funkciók](#7-fontosabb-funkciók)
    - [7.1. Szülői felület (`index.html`, `szulo.js`)](#71-szülői-felület-indexhtml-szulojs)
    - [7.2. Tanári felület (`tanar.html`, `tanar.js`)](#72-tanári-felület-tanarhtml-tanarjs)
  - [8. Felhasználói (E2E) tesztelés](#8-felhasználói-e2e-tesztelés)

---

## 1. Áttekintés

A frontend két fő felhasználói felületet biztosít: egyet a szülőknek időpontfoglalásra, és egyet a tanároknak a foglalásaik megtekintésére. Az alkalmazás dinamikusan tölti be az adatokat a backend API-ról és interaktív felhasználói élményt nyújt. Bootstrap keretrendszert használ a reszponzív megjelenéshez.

---

## 2. Fájlstruktúra

A frontend főbb fájljai a `public` mappában találhatók:

* `index.html`: A szülői felület HTML struktúrája.
* `tanar.html`: A tanári felület HTML struktúrája.
* `js/szulo.js`: A szülői felület kliensoldali logikája.
* `js/tanar.js`: A tanári felület kliensoldali logikája.
* `css/style.css`: Egyedi CSS stílusok (ha vannak, a példában nem szerepel tartalommal).
* `favicon.png`: Az oldalhoz tartozó favicon.

---

## 3. HTML fájlok

### 3.1. `index.html` (Szülői felület)

Ez a fájl definiálja a szülők számára elérhető felületet.

* **Célja**: Lehetővé teszi a szülők számára, hogy tanuló nevének és oktatási azonosítójának megadása után tanárt válasszanak a legördülő listából, megtekintsék a szabad időpontokat, és időpontot foglaljanak, valamint megtekinthessék és lemondhassák meglévő foglalásaikat.
* **Főbb szekciók**:
  * `navbar`: Navigációs sáv a "Szülőknek" és "Tanároknak" linkekkel, valamint a fogadóóra dátumának megjelenítésével (`navbar-brand-title`).
  * `tanulo-adatok-section`: Űrlap a tanuló nevének és oktatási azonosítójának bekérésére.
  * `tanarok-lista-section`: Legördülő lista (`<select>`) a választható tanárokról.
  * `fogadoora-section`: A kiválasztott tanár adatainak és szabad időpontjainak megjelenítése (csak akkor látható, ha nincs foglalás az adott tanárhoz).
  * `foglalasaim-section`: A tanuló aktuális foglalásainak listája.
* **Kapcsolódó JavaScript**: `js/szulo.js`

### 3.2. `tanar.html` (Tanári felület)

Ez a fájl definiálja a tanárok számára elérhető felületet.

* **Célja**: Lehetővé teszi a tanárok számára, hogy bejelentkezzenek, megtekintsék a hozzájuk foglalt időpontokat és a foglaló diákok adatait.
* **Főbb szekciók**:
  * `navbar`: Navigációs sáv a "Szülőknek" és "Tanároknak" linkekkel, valamint a fogadóóra dátumának megjelenítésével (`navbar-brand-title`).
  * `login-section`: Bejelentkezési űrlap tanároknak (név, jelszó).
  * `dashboard-section`: Bejelentkezés után megjelenő felület, amely üdvözli a tanárt, megjeleníti az adatait (terem, tárgyak) és listázza a foglalásait.
* **Kapcsolódó JavaScript**: `js/tanar.js`

---

## 4. JavaScript fájlok

### 4.1. `szulo.js` (Szülői felület logikája)

Ez a fájl tartalmazza a `index.html`-hez kapcsolódó összes kliensoldali logikát.

* **Globális változók és DOM elemek**:
  * DOM elemek referenciái (pl. `tanuloAdatokSection`, `tanarokSelectElem`, `idopontokListaDiv`).
  * Gyorsítótár: `sajatFoglalasok`.
  * Állapotváltozók: `aktualisTanuloNeve`, `aktualisOktatasiAzonosito`.
* **Eventos kezelők**:
  * `DOMContentLoaded`: Betölti a konfigurációt (dátumot) a navigációs sávba.
  * `tanuloAdatokForm` `submit`: Feldolgozza a tanulói adatokat, megjeleníti a tanárválasztót és a foglalások szekciót, betölti a tanárokat és a saját foglalásokat.
  * `tanarokSelectElem` `change`: Tanár kiválasztásakor a `loadFogadoora()` függvényt hívja meg.
  * Időpont gombra kattintás: Elindítja a foglalási folyamatot.
  * Lemondás gombra kattintás: Elindítja a foglalás lemondási folyamatát.
* **Főbb funkciók**:
  * `loadTanarok()`: Lekéri a tanárok listáját az API-ról és az opciók elemeket a `tanarokSelectElem` select elembe helyezi.
  * `loadFogadoora(tanarID)`: Lekéri és megjeleníti a kiválasztott tanár fogadóóráit. Ellenőrzi, van-e már foglalás az adott tanárhoz. Ha van, a `fogadooraSection` rejtve marad; ha nincs, megjeleníti az időpontokat.
  * `kezdemenyezFoglalas(tanarID, tanarNev, idosav)`: Ellenőrzi, hogy az adott idősávban van-e már másik foglalása a tanulónak. Ha nincs, megerősítést kér, majd elküldi a foglalási kérelmet az API-nak. Sikeres foglalás után a `fogadooraSection` rejtve marad.
  * `loadSajatFoglalasok(oktatasiAzonosito)`: Lekéri és megjeleníti a tanuló saját foglalásait a `sajatFoglalasok` globális tömbben.
  * `cancelFoglalas(tanarID, oktatasiAzonosito)`: Megerősítést kér, majd elküldi a foglalás törlési kérelmet az API-nak.
* **API Interakciók**:
  * `/api/config`: Konfiguráció (dátum) lekérése.
  * `/api/tanarok`: Tanárok listájának lekérése.
  * `/api/tanarok/{tanarID}/fogadoora`: Adott tanár fogadóóráinak lekérése.
  * `/api/tanarok/{tanarID}/foglalasok` (POST): Új foglalás létrehozása.
  * `/api/tanulok/{oktatasiAzonosito}/foglalasok`: Tanuló foglalásainak lekérése.
  * `/api/foglalasok?tanarID={tanarID}&oktatasiAzonosito={oktatasiAzonosito}` (DELETE): Foglalás törlése.
* **Caching**: A saját foglalások a `sajatFoglalasok` globális tömbben tárolódnak a jobb teljesítmény érdekében.

### 4.2. `tanar.js` (Tanári felület logikája)

Ez a fájl tartalmazza a `tanar.html`-hez kapcsolódó összes kliensoldali logikát.

* **Globális változók és DOM elemek**:
  * DOM elemek referenciái (pl. `loginSection`, `dashboardSection`, `tanariFoglalasokBody`).
* **Eseménykezelők**:
  * `DOMContentLoaded`: Betölti a konfigurációt (dátumot) a navigációs sávba, majd ellenőrzi a bejelentkezési állapotot a `sessionStorage`-ben.
  * `loginForm` `submit`: Feldolgozza a bejelentkezési adatokat, elküldi azokat az API-nak. Sikeres bejelentkezés esetén a tokent és a tanár adatait `sessionStorage`-be menti, majd megjeleníti a dashboardot.
  * `logoutBtn` `click`: Kijelentkezteti a tanárt, törli a `sessionStorage` adatait, és megjeleníti a login felületet.
* **Főbb funkciók**:
  * `checkLoginState()`: Ellenőrzi, hogy van-e érvényes token és tanár adat a `sessionStorage`-ben. Ennek alapján dönti el, hogy a login felületet vagy a dashboardot jeleníti-e meg.
  * `showLogin()`: Megjeleníti a login szekciót, elrejti a dashboardot, és törli a releváns `sessionStorage` elemeket.
  * `showDashboard(tanar, token)`: Megjeleníti a dashboard szekciót, elrejti a login felületet, kitölti a tanár adatait, és betölti a tanári foglalásokat.
  * `loadTanariFoglalasok(token)`: Lekéri és megjeleníti a bejelentkezett tanár foglalásait az API-ról, a token segítségével authentikálva a kérést.
* **Authentikáció**:
  * A bejelentkezés során kapott JWT tokent és a tanár adatait a böngésző `sessionStorage`-ében tárolja (csak az aktuális munkamenet alatt).
  * A védett API végpontokhoz (`/api/auth/profil/foglalasok`) a tokent `Bearer` tokenként küldi el az `Authorization` fejlécben.
* **API Interakciók**:
  * `/api/config`: Konfiguráció (dátum) lekérése.
  * `/api/auth/login` (POST): Tanár bejelentkeztetése.
  * `/api/auth/profil/foglalasok` (GET): Bejelentkezett tanár foglalásainak lekérése (authentikált végpont).

---

## 5. CSS stílusok

* **Bootstrap 5.3.2**: Az alapvető UI komponensek és a reszponzív dizájn Bootstrap segítségével valósul meg, amelyet a CDN-ről tölt le.
* `css/style.css`: Ez a fájl egyedi stílusokat tartalmaz, amelyek felülírják vagy kiegészítik a Bootstrap stílusait.

---

## 6. API interakciók

Mindkét JavaScript fájl `fetch` API-t használ a backenddel való kommunikációra.

* A kérések JSON formátumú adatokat küldenek és fogadnak.
* Hibakezelés: A `try...catch` blokkok és a `response.ok` ellenőrzése szolgálja a hálózati és API hibák kezelését. A felhasználó `alert` üzenetekben vagy a felületen megjelenő hibaüzenetekben kap visszajelzést.

---

## 7. Fontosabb funkciók

### 7.1. Szülői felület (`index.html`, `szulo.js`)

1. **Tanulói adatok megadása**:
    * A felhasználó megadja a tanuló nevét és 11 jegyű oktatási azonosítóját.
    * Validáció történik az oktatási azonosító formátumára.
2. **Tanárválasztás**:
    * A rendszer betölti az elérhető tanárok listáját.
    * A felhasználó kiválaszt egy tanárt a listából.
3. **Időpontok megtekintése és foglalás**:
    * A kiválasztott tanár adatai (név, terem, tárgyak) és szabad időpontjai csak akkor jelennek meg, ha a tanulónak még nincs foglalása az adott tanárhoz.
    * Ha már van foglalása, a fogadóóra szekció rejtett marad.
    * A szabad időpontok zöld gombokkal, a foglaltak piros, inaktív gombokkal jelennek meg.
    * Foglaláskor ellenőrzés történik, hogy az adott idősávban nincs-e már másik foglalása a tanulónak.
    * A foglalás megerősítést igényel.
    * Sikeres foglalás után az időpontok eltűnnek és a foglalás megjelenik a "Foglalások" listában.
4. **Saját foglalások kezelése**:
    * A tanuló megtekintheti az aktuális foglalásait (tanár neve, idősáv).
    * Lehetőség van a foglalások lemondására, ami megerősítést igényel.
    * Lemondás után az időpontok újra megjelennek a tanár fogadóórájaiban (ha az meg van jelenítve).
5. **Dinamikus frissítés**:
    * Foglalás vagy lemondás után a releváns nézetek automatikusan frissülnek.
    * A tanár adatai és az időpontok csak akkor jelennek meg, ha nincs foglalás az adott tanárhoz.
6. **Tanárválasztás**:
    * A tanárok legördülő listában jelennek meg (`<select>` elem).
    * Tanár kiválasztásakor azonnal betöltésre kerülnek a fogadóóra adatai.

### 7.2. Tanári felület (`tanar.html`, `tanar.js`)

1. **Bejelentkezés**:
    * A tanár a nevével és jelszavával tud bejelentkezni.
    * Sikertelen bejelentkezés esetén hibaüzenet jelenik meg.
    * Sikeres bejelentkezés után a rendszer a dashboardra navigál, a kapott tokent és tanári adatokat a `localStorage`-ben tárolja.
2. **Dashboard**:
    * Megjeleníti az üdvözlő üzenetet, a tanár nevét, termét és tanított tárgyait.
    * Listázza a tanárhoz tartozó összes foglalást (idősáv, tanuló neve, tanuló oktatási azonosítója).
    * Ha nincsenek foglalások, erről tájékoztató üzenet jelenik meg.
3. **Kijelentkezés**:
    * A "Kijelentkezés" gombra kattintva a tanár kijelentkezik, a `sessionStorage` adatai törlődnek, és a login felület jelenik meg újra.
4. **Munkamenet kezelése**:
    * Az oldal betöltésekor ellenőrzi a `sessionStorage`-t. Ha van érvényes token, automatikusan a dashboardot tölti be.
    * API hívások során (pl. foglalások lekérése) lejárt vagy érvénytelen token esetén a felhasználót visszairányítja a login oldalra.
5. **Navigációs sáv**:
    * Mindkét oldalon (szülői, tanári) a navigációs sávban megjelenik a fogadóóra beállított dátuma, amit az `/api/config` végpontról kér le.

---

## 8. Felhasználói (E2E) tesztelés

A felhasználói tesztek a `tests/e2e_test.md` fájlban találhatók. A tesztesetek futtatása előtt be kell állítani a fogadóóra adatait a `.env` fájlban, és a `tesztadatok.sql` fájl futtatásával új adatbázist kell létrehozni:

```bash
sqlite3 idopontok.db < tests/tesztadatok.sql
```
