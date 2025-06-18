# Fogadóóra alkalmazás specifikáció

Ez a dokumentum a Fogadóóra alkalmazás rendszertervét és működési specifikációját tartalmazza. Célja, hogy átfogó képet adjon az alkalmazás funkcióiról, architektúrájáról és technikai részleteiről.

## Tartalomjegyzék

1. [Bevezetés](#1-bevezetés)
    * [1.1. Az alkalmazás célja](#11-az-alkalmazás-célja)
    * [1.2. Főbb funkciók áttekintése](#12-főbb-funkciók-áttekintése)
2. [Célközönség és szerepkörök](#2-célközönség-és-szerepkörök)
    * [2.1. Szülő](#21-szülő)
    * [2.2. Tanár](#22-tanár)
    * [2.3. Adminisztrátor (Rendszerüzemeltető)](#23-adminisztrátor-rendszerüzemeltető)
3. [Funkcionális Követelmények](#3-funkcionális-követelmények)
    * [3.1. Általános funkciók](#31-általános-funkciók)
    * [3.2. Szülői funkciók](#32-szülői-funkciók)
    * [3.3. Tanári funkciók](#33-tanári-funkciók)
    * [3.4. Adminisztratív funkciók (Konfiguráció)](#34-adminisztratív-funkciók-konfiguráció)
4. [Rendszerarchitektúra](#4-rendszerarchitektúra)
    * [4.1. Frontend](#41-frontend)
    * [4.2. Backend](#42-backend)
    * [4.3. Adatbázis](#43-adatbázis)
5. [Technológiai Stack](#5-technológiai-stack)
6. [Adatmodell](#6-adatmodell)
    * [6.1. `tanarok` tábla](#61-tanarok-tábla)
    * [6.2. `foglalasok` tábla](#62-foglalasok-tábla)
7. [API végpontok (összefoglaló)](#7-api-végpontok-összefoglaló)
8. [Konfiguráció](#8-konfiguráció)
9. [Biztonság](#9-biztonság)
10. [Felhasználói felület](#10-felhasználói-felület)
    * [10.1. Szülői felület (`index.html`)](#101-szülői-felület-indexhtml)
    * [10.2. Tanári felület (`tanar.html`)](#102-tanári-felület-tanarhtml)

---

## 1. Bevezetés

### 1.1. Az alkalmazás célja

A Fogadóóra alkalmazás célja, hogy egyszerű és átlátható platformot biztosítson iskolai fogadóórák időpontjainak online kezelésére. Lehetővé teszi a szülők számára, hogy könnyedén foglaljanak időpontot a választott tanárokhoz, a tanárok számára pedig, hogy áttekinthessék a hozzájuk érkezett foglalásokat.

### 1.2. Főbb funkciók áttekintése

* **Szülőknek**: Tanulói adatok megadása, tanárválasztás, szabad időpontok megtekintése, időpontfoglalás, meglévő foglalások megtekintése és lemondása.
* **Tanároknak**: Biztonságos bejelentkezés, saját foglalások listájának megtekintése (időpont, tanuló neve, oktatási azonosítója).
* **Adminisztrátoroknak**: A fogadóóra központi beállításainak (dátum, idősávok hossza, kezdő- és végidőpont) konfigurálása, tanárok adatainak szerkesztése.

---

## 2. Célközönség és szerepkörök

### 2.1. Szülő

Olyan felhasználó, aki gyermeke számára szeretne időpontot foglalni egy tanárhoz a meghirdetett fogadóórán.

### 2.2. Tanár

Az iskola pedagógusa, aki fogadóórát tart, és szeretné megtekinteni a hozzá lefoglalt időpontokat és a foglaló diákok adatait.

### 2.3. Adminisztrátor (Rendszerüzemeltető)

Az a személy vagy csoport, aki felelős az alkalmazás technikai működtetéséért, beleértve az adatbázis karbantartását, a tanárok kezdeti regisztrációját (jelszó hash-ekkel) és a fogadóóra globális paramétereinek beállítását a konfigurációs fájlon keresztül.

---

## 3. Funkcionális követelmények

### 3.1. Általános funkciók

* A fogadóóra aktuális dátumának megjelenítése a felhasználói felületeken.
* Reszponzív felhasználói felület, amely különböző képernyőméreteken is jól használható.

### 3.2. Szülői funkciók

* **Tanulói adatok megadása**: A szülőnek meg kell adnia a tanuló nevét és 11 jegyű oktatási azonosítóját a foglalási folyamat megkezdéséhez.
* **Tanárválasztás**: A rendszer listázza az elérhető tanárokat, akik közül a szülő választhat.
* **Időpontok megtekintése**: A kiválasztott tanár szabad és foglalt időpontjainak megjelenítése.
  * Ha a tanulónak már van foglalása az adott tanárhoz, erről figyelmeztetés jelenik meg, és újabb foglalás nem lehetséges ehhez a tanárhoz.
* **Időpontfoglalás**:
  * A szülő kiválaszthat egy szabad idősávot.
  * A rendszer ellenőrzi, hogy a tanulónak az adott idősávban nincs-e már foglalása másik tanárnál.
  * A foglalás előtt megerősítést kér a rendszertől.
* **Saját foglalások megtekintése**: A szülő megtekintheti gyermeke aktuális foglalásait (tanár neve, idősáv).
* **Foglalás lemondása**: A szülő lemondhatja meglévő foglalását. A lemondás megerősítést igényel.
* **Dinamikus frissítés**: Foglalás vagy lemondás után a felület automatikusan frissül.

### 3.3. Tanári funkciók

* **Bejelentkezés**: A tanárok egyedi névvel és jelszóval jelentkezhetnek be a rendszerbe.
* **Dashboard**: Bejelentkezés után a tanár egy áttekintő felületet lát:
  * Üdvözlő üzenet, saját név, terem, tanított tárgyak.
  * A hozzá tartozó összes foglalás listázása: idősáv, tanuló neve, tanuló oktatási azonosítója.
  * Ha nincsenek foglalások, erről tájékoztató üzenet jelenik meg.
* **Kijelentkezés**: Lehetőség a rendszerből való biztonságos kijelentkezésre.
* **Munkamenet kezelése**: Érvényes munkamenet esetén automatikus beléptetés a dashboardra. Lejárt/érvénytelen munkamenet esetén visszairányítás a bejelentkezési oldalra.

### 3.4. Adminisztratív funkciók (konfiguráció)

* **Fogadóóra paramétereinek beállítása**: A rendszer adminisztrátora a szerveroldali konfigurációs fájlon (`.env`) keresztül beállíthatja:
  * A fogadóóra dátumát.
  * A fogadóóra kezdő és befejező időpontját.
  * Az egyes időpontfoglalási idősávok hosszát percekben.
* **Tanárok adatainak kezelése**: Tanárok felvétele az adatbázisba (név, jelszó hash, terem, tárgyak). Ez közvetlen adatbázis-műveletet igényel (SQL szkript szerkesztése, futtatása).
* **JWT titkos kulcs beállítása**: A biztonságos authentikációhoz szükséges titkos kulcs konfigurálása.

---

## 4. Rendszerarchitektúra

Az alkalmazás egy klasszikus háromrétegű webalkalmazás:

### 4.1. Frontend

* **Technológia**: HTML, CSS (Bootstrap 5.3.2), JavaScript (Vanilla JS).
* **Feladata**: A felhasználói felület biztosítása a szülők és tanárok számára. Interakció a backend API-val adatok lekérdezésére és küldésére (aszinkron módon, `fetch` API segítségével).
* **Főbb komponensek**:
  * `index.html` és `js/szulo.js`: Szülői felület és annak logikája.
  * `tanar.html` és `js/tanar.js`: Tanári felület és annak logikája.

### 4.2. Backend

* **Technológia**: Node.js, Express.js.
* **Feladata**: Az üzleti logika kezelése, adatbázis-műveletek végrehajtása, API végpontok biztosítása a frontend számára, tanári authentikáció (JWT).
* **Főbb komponensek**:
  * `server.js`: Az Express alkalmazás fő fájlja, amely tartalmazza az API végpontokat, middleware-eket és az adatbázis-kapcsolatot.

### 4.3. Adatbázis

* **Technológia**: SQLite (a `better-sqlite3` Node.js könyvtáron keresztül).
* **Feladata**: A tanárok adatainak és a foglalásoknak a tárolása.
* **Főbb jellemzők**: Fájl alapú adatbázis, `FOREIGN KEY` megszorítások és `UNIQUE` indexek használata az adatkonzisztencia érdekében. `journal_mode = WAL` a jobb teljesítményért.

---

## 5. Technológiai stack

* **Backend**: Node.js, Express.js
* **Adatbázis**: SQLite
* **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
* **Authentikáció**: JSON Web Tokens (JWT)
* **Jelszókezelés**: bcrypt (jelszavak hashelésére)
* **Egyéb**: `dotenv` (környezeti változók kezelésére), `cors` (Cross-Origin Resource Sharing).

---

## 6. Adatmodell

Az adatbázis két fő táblából áll:

### 6.1. `tanarok` tábla

* Célja: A rendszerben regisztrált tanárok adatainak tárolása.
* Oszlopok:
  * `tanarID` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Egyedi azonosító.
  * `nev` (TEXT, NOT NULL): Tanár neve.
  * `jelszoHash` (TEXT, NOT NULL): Bcrypt hash-elt jelszó.
  * `terem` (TEXT): Fogadóóra helyszíne (opcionális).
  * `targyak` (TEXT): Oktatott tárgyak (opcionális, vesszővel elválasztva).

### 6.2. `foglalasok` tábla

* Célja: A tanulók által lefoglalt időpontok rögzítése.
* Oszlopok:
  * `foglalasID` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Egyedi azonosító.
  * `tanarID` (INTEGER, NOT NULL): Hivatkozás a `tanarok(tanarID)`-ra. `ON DELETE CASCADE`.
  * `idosav` (TEXT, NOT NULL): Az idősáv kezdete (pl. '17:00').
  * `tanuloNeve` (TEXT, NOT NULL): Foglaló tanuló neve.
  * `oktatasiAzonosito` (TEXT, NOT NULL): Foglaló tanuló 11 jegyű oktatási azonosítója.
* **Egyedi megszorítások (UNIQUE constraints)**:
  * `(tanarID, idosav)`: Egy tanárhoz egy idősávra csak egy foglalás.
  * `(tanarID, oktatasiAzonosito)`: Egy tanuló egy tanárhoz csak egyszer foglalhat.
  * `(oktatasiAzonosito, idosav)`: Egy tanuló egy idősávban csak egy helyre foglalhat.

---

## 7. API végpontok (összefoglaló)

| Metódus | Útvonal                                  | Leírás                                                     | Authentikáció szükséges? |
|---------|------------------------------------------|------------------------------------------------------------|--------------------------|
| GET     | `/api/config`                            | Aktuális fogadóóra dátumának lekérdezése.                  | Nem                      |
| GET     | `/api/tanarok`                           | Összes tanár listázása.                                    | Nem                      |
| GET     | `/api/tanarok/:tanarID/fogadoora`        | Adott tanár fogadóórájának és idősávjainak lekérdezése.    | Nem                      |
| POST    | `/api/tanarok/:tanarID/foglalasok`       | Új időpont foglalása adott tanárhoz.                       | Nem                      |
| DELETE  | `/api/foglalasok`                        | Szülő törli a saját foglalását (query: `tanarID`, `oktatasiAzonosito`). | Nem                      |
| GET     | `/api/tanulok/:oktatasiAzonosito/foglalasok` | Adott tanuló összes foglalásának lekérdezése.              | Nem                      |
| POST    | `/api/auth/login`                        | Tanár bejelentkeztetése.                                   | Nem (de tokent generál)  |
| GET     | `/api/auth/profil/foglalasok`            | Bejelentkezett tanár foglalásainak listázása.              | Igen (JWT)               |

---

## 8. Konfiguráció

Az alkalmazás működését befolyásoló főbb paraméterek a projekt gyökérkönyvtárában található `.env` fájlban kerülnek beállításra:

* `PORT`: A szerver portszáma (alapértelmezett: 3000).
* `DATABASE_PATH`: Az SQLite adatbázisfájl elérési útja (alapértelmezett: `idopontok.db`).
* `JWT_SECRET`: A JWT tokenek aláírásához használt titkos kulcs.
* `DATE`: Az aktuális fogadóóra dátuma (formátum: `YYYY-MM-DD`).
* `START`: A fogadóóra kezdési időpontja (formátum: `HH:MM`).
* `END`: A fogadóóra befejezési időpontja (formátum: `HH:MM`).
* `HOSSZ`: Egy idősáv hossza percekben.

---

## 9. Biztonság

* **Authentikáció**: A tanári felület védett végpontjai JWT (JSON Web Token) alapú authentikációt használnak. Bejelentkezéskor a szerver egy tokent generál, amelyet a kliensnek minden védett kérésnél el kell küldenie az `Authorization: Bearer <token>` fejlécben.
* **Jelszótárolás**: A tanárok jelszavai nem nyers formában, hanem `bcrypt` segítségével hashelve tárolódnak az adatbázisban.
* **Adatvalidáció**: A backend végpontok ellenőrzik a bemeneti adatokat (pl. kötelező mezők, formátumok). A frontend is végez alapvető validációt (pl. oktatási azonosító formátuma).

---

## 10. Felhasználói felület

A felhasználói felület Bootstrap keretrendszer segítségével reszponzív és letisztult megjelenést biztosít.

### 10.1. Szülői Felület (`index.html`)

* **Navigációs sáv**: Linkek a szülői és tanári oldalra, valamint a fogadóóra aktuális dátumának megjelenítése.
* **Tanuló adatai szekció**: Űrlap a tanuló nevének és oktatási azonosítójának bekérésére.
* **Tanárválasztó szekció**: Lista a választható tanárokról (név, tárgyak).
* **Fogadóóra szekció**: A kiválasztott tanár adatai (név, terem, tárgyak) és a szabad/foglalt időpontok gombok formájában. Figyelmeztető üzenet, ha már van foglalás az adott tanárhoz.
* **Foglalásaim szekció**: A bejelentkezett tanuló aktuális foglalásainak listája, lemondási lehetőséggel.

### 10.2. Tanári Felület (`tanar.html`)

* **Navigációs sáv**: Linkek a szülői és tanári oldalra, valamint a fogadóóra aktuális dátumának megjelenítése.
* **Bejelentkezési szekció**: Űrlap a tanár nevének és jelszavának megadására. Hibaüzenet megjelenítése sikertelen bejelentkezés esetén.
* **Dashboard szekció (bejelentkezés után)**:
  * Üdvözlő üzenet a tanár nevével.
  * Tanár adatai (terem, tárgyak).
  * Táblázat a tanárhoz tartozó foglalásokkal (idősáv, tanuló neve, oktatási azonosító).
  * Kijelentkezés gomb.
