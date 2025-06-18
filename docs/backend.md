# Fejlesztői dokumentáció: Fogadóóra backend (`server.js`)

## Tartalomjegyzék

[1. Áttekintés](#1-áttekintés)  
[2. Konfiguráció](#2-konfiguráció)  
[3. Adatbázis](#3-adatbázis)  
[4. Idősávok generálása](#4-idősávok-generálása)  
[5. Authentikáció (JWT)](#5-authentikáció-jwt)  
[6. API végpontok](#6-api-végpontok)  
    - [Végpontok összefoglaló táblázata](#végpontok-összefoglaló-táblázata)  
    - [6.1. Publikus végpontok](#61-publikus-végpontok-nincs-szükség-authentikációra)  
    - [6.2. Tanári végpontok](#62-tanári-végpontok)  
[7. Szerver indítása és leállítása](#7-szerver-indítása-és-leállítása)  
[8. Statikus fájlok kiszolgálása](#8-statikus-fájlok-kiszolgálása)  
[9. Middleware-ek](#9-middleware-ek)  
[10. API tesztelés](#10-api-tesztelés)

Ez a dokumentáció a fogadóóra alkalmazás backendjének működését, végpontjait és belső logikáját ismerteti.

## 1. Áttekintés

A backend Node.js és Express.js keretrendszerrel készült, adatbázisként SQLite-ot használ (a `better-sqlite3` könyvtáron keresztül). A backend felelős a tanárok adatainak és a foglalásoknak a kezeléséért, az idősávok generálásáért, valamint a tanári authentikációért.

## 2. Konfiguráció

A szerver viselkedését a projekt gyökérkönyvtárában található `.env` fájlban definiált környezeti változók befolyásolják.

* `PORT`: A port, amelyen a szerver futni fog (alapértelmezett: `3000`).
* `DATABASE_PATH`: Az SQLite adatbázis fájl elérési útja (alapértelmezett: `idopontok.db`).
* `JWT_SECRET`: A JSON Web Tokenek (JWT) aláírásához használt titkos kulcs.
* `DATE`: Az aktuális fogadóóra dátuma (string, pl. `2023-12-01`). Ezt a frontend jeleníti meg.
* `START`: A fogadóóra kezdési időpontja (formátum: `HH:MM`, pl. `17:00`).
* `END`: A fogadóóra befejezési időpontja (formátum: `HH:MM`, pl. `18:00`).
* `HOSSZ`: Egy idősáv hossza percekben (pl. `10`).

## 3. Adatbázis

Az alkalmazás indítása előtt létre kell hozni az adatbázisban a szükséges táblákat (`tanarok`, `foglalasok`), és fel kell tölteni a tanárok adatait. Ez egy SQL inicializáló szkript (pl. a `tesztadatok.sql` fájl) futtatásával történhet.

* **Technológia**: SQLite
* **Könyvtár**: `better-sqlite3`
* **Szerver oldali beállítások kapcsolódáskor**:
  * `PRAGMA foreign_keys = ON;`: A szerver minden adatbázis-kapcsolatnál bekapcsolja ezt az opciót, biztosítva az idegen kulcsok integritását.
  * `PRAGMA journal_mode = WAL;`: A szerver ezt a naplózási módot állítja be a jobb teljesítmény és konkurrenciakezelés érdekében.
* **Táblák**:

  * **`tanarok` tábla**
    * Célja: A rendszerben regisztrált tanárok adatainak tárolása.
    * Oszlopok:
      * `tanarID` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Egyedi azonosító minden tanárhoz.
      * `nev` (TEXT, NOT NULL): A tanár teljes neve.
      * `jelszoHash` (TEXT, NOT NULL): A tanár jelszavának bcrypt hash-e a biztonságos tárolás érdekében.
      * `terem` (TEXT): A tanár fogadóórájának helyszíne (pl. szobaszám). Opcionális.
      * `targyak` (TEXT): A tanár által oktatott tárgyak listája, vesszővel elválasztva. Opcionális.

  * **`foglalasok` tábla**
    * Célja: A tanulók által a tanárokhoz lefoglalt időpontok rögzítése az aktuális fogadóórára.
    * Oszlopok:
      * `foglalasID` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Egyedi azonosító minden foglaláshoz.
      * `tanarID` (INTEGER, NOT NULL): Hivatkozás a `tanarok` tábla `tanarID` oszlopára. Meghatározza, melyik tanárhoz történt a foglalás.
      * `idosav` (TEXT, NOT NULL): A konkrét idősáv kezdete (pl. '17:00', '17:10').
      * `tanuloNeve` (TEXT, NOT NULL): A foglalást végző tanuló neve.
      * `oktatasiAzonosito` (TEXT, NOT NULL): A foglalást végző tanuló 11 jegyű oktatási azonosítója.
    * **Kapcsolatok és megszorítások**:
      * `FOREIGN KEY (tanarID) REFERENCES tanarok(tanarID) ON DELETE CASCADE`: Ez a kulcs biztosítja a kapcsolatot a `tanarok` táblával. Ha egy tanár törlődik a `tanarok` táblából, az `ON DELETE CASCADE` miatt az összes hozzá tartozó foglalás automatikusan törlődik a `foglalasok` táblából is, fenntartva az adatbázis integritását.
      * `UNIQUE (tanarID, idosav)`: Biztosítja, hogy egy adott tanárhoz egy adott idősávra csak egyetlen foglalás létezhessen az aktuális fogadóórán. Megakadályozza, hogy ugyanazt az időpontot többször lefoglalják ugyanannál a tanárnál.
      * `UNIQUE (tanarID, oktatasiAzonosito)`: Biztosítja, hogy egy tanuló (azonosítva az `oktatasiAzonosito` által) egy adott tanárhoz csak egyetlen időpontot foglalhasson az aktuális fogadóórán. Megakadályozza, hogy egy diák több időpontot is lefoglaljon ugyanannál a tanárnál.
      * `UNIQUE (oktatasiAzonosito, idosav)`: Biztosítja, hogy egy tanuló egy adott idősávban csak egyetlen foglalással rendelkezhessen az egész rendszerben (azaz nem lehet egyszerre két különböző tanárnál ugyanabban az idősávban). Megakadályozza az időbeli ütközéseket a tanuló számára.

## 4. Idősávok generálása

* **Függvény**: `generateTimeSlots(startTimeStr, endTimeStr, intervalMinutes, existingBookings)`
* **Működés**:
  1. Bemenetként megkapja a fogadóóra kezdő és befejező időpontját (string), az idősávok hosszát percekben, valamint az adott tanárhoz már létező foglalások listáját.
  2. Iterál a kezdő időponttól a befejező időpontig a megadott idősávhosszal.
  3. Minden generált idősávhoz ellenőrzi, hogy szerepel-e a `existingBookings` között.
  4. Visszaad egy tömböt, amely objektumokat tartalmaz. Minden objektum egy idősávot reprezentál, és tartalmazza:
     * `idosav`: Az idősáv (pl. "17:00").
     * `statusz`: Lehet `'szabad'` vagy `'foglalt'`.
     * `foglaloAdatai` (csak ha `statusz === 'foglalt'`): Objektum a foglaló tanuló nevével és oktatási azonosítójával.

## 5. Authentikáció (JWT)

* **Middleware**: `authenticateToken(req, res, next)`
* **Működés**:
  1. Ellenőrzi a `Authorization` HTTP headerben a `Bearer <token>` formátumú JWT tokent.
  2. Ha a token hiányzik, `401 Unauthorized` választ küld.
  3. Ha a token létezik, a `jwt.verify()` segítségével ellenőrzi annak érvényességét a `JWT_SECRET` alapján.
  4. Sikeres ellenőrzés esetén a tokenből dekódolt felhasználói adatokat (pl. `tanarID`, `nev`) a `req.user` objektumhoz rendeli, és továbbengedi a kérést a következő middleware-re vagy végpontkezelőre.
  5. Hibás vagy lejárt token esetén `403 Forbidden` választ küld.

## 6. API végpontok

### Végpontok összefoglaló táblázata

| Metódus | Útvonal                                  | Leírás                                                     | Authentikáció szükséges? |
|---------|------------------------------------------|------------------------------------------------------------|--------------------------|
| GET     | `/api/config`                            | Aktuális fogadóóra dátumának lekérdezése.                  | Nem                      |
| GET     | `/api/tanarok`                           | Összes tanár listázása.                                    | Nem                      |
| GET     | `/api/tanarok/:tanarID/fogadoora`        | Adott tanár fogadóórájának és idősávjainak lekérdezése.    | Nem                      |
| POST    | `/api/tanarok/:tanarID/foglalasok`       | Új időpont foglalása adott tanárhoz.                       | Nem                      |
| DELETE  | `/api/foglalasok`                        | Szülő törli a saját foglalását.                             | Nem                      |
| GET     | `/api/tanulok/:oktatasiAzonosito/foglalasok` | Adott tanuló összes foglalásának lekérdezése.              | Nem                      |
| POST    | `/api/auth/login`                        | Tanár bejelentkeztetése.                                   | Nem (de tokent generál)  |
| GET     | `/api/auth/profil/foglalasok`            | Bejelentkezett tanár foglalásainak listázása.              | Igen                     |

---

### 6.1. Publikus végpontok (nincs szükség authentikációra)

* **`GET /api/config`**
  
  * **Leírás**: Visszaadja az aktuális fogadóóra dátumát a `.env` fájlból.
  * **Válasz (200 OK)**: `{ "date": "YYYY-MM-DD" }`
  * **Válasz (Hiba)**: Nincs specifikus hibakezelés, a `.env` változó meglététől függ.

* **`GET /api/tanarok`**
  
  * **Leírás**: Listázza az összes tanárt az adatbázisból (ID, név, terem, tárgyak).
  * **Válasz (200 OK)**: Tanárok tömbje: `[{ tanarID, nev, terem, targyak }, ...]`
  * **Válasz (500 Internal Server Error)**: `{ "hiba": "Szerverhiba történt." }`

* **`GET /api/tanarok/:tanarID/fogadoora`**
  
  * **Leírás**: Lekérdezi egy adott tanár adatait és a hozzá tartozó fogadóóra idősávjait (szabad/foglalt státusszal).
  * **Paraméterek**: `tanarID` (URL paraméter)
  * **Válasz (200 OK)**: `{ tanarID, nev, terem, targyak, idopontok: [{ idosav, statusz, foglaloAdatai? }, ...] }`
  * **Válasz (404 Not Found)**: `{ "hiba": "A megadott tanár nem található." }`
  * **Válasz (500 Internal Server Error)**: `{ "hiba": "Szerverhiba történt." }`

* **`POST /api/tanarok/:tanarID/foglalasok`**
  
  * **Leírás**: Új időpont foglalása egy adott tanárhoz.
  * **Paraméterek**: `tanarID` (URL paraméter)
  * **Request Body (JSON)**: `{ "idosav": "HH:MM", "tanuloNeve": "Név", "oktatasiAzonosito": "11_számjegy" }`
  * **Válasz (201 Created)**: A létrehozott foglalás adatai: `{ foglalasID, tanarID, idosav, tanuloNeve, oktatasiAzonosito }`
  * **Válasz (400 Bad Request)**: `{ "hiba": "Minden mező kitöltése kötelező..." }`
  * **Válasz (403 Forbidden)**: `{ "hiba": "Foglalás csak a fogadóóra napjáig lehetséges." }`
  * **Válasz (404 Not Found)**: `{ "hiba": "A megadott tanár nem található." }`
  * **Válasz (409 Conflict)**: Különböző hibaüzenetek a UNIQUE megszorítások alapján (pl. `{ "hiba": "Ez az idősáv ennél a tanárnál már foglalt." }`).
  * **Válasz (500 Internal Server Error)**: `{ "hiba": "Szerverhiba történt a foglalás során." }`

* **`DELETE /api/foglalasok`**
  
  * **Leírás**: Szülő törli a saját foglalását egy adott tanárnál. A törlés a tanár ID-ja és a tanuló oktatási azonosítója alapján történik.
  * **Query Paraméterek**: `tanarID`, `oktatasiAzonosito`
  * **Válasz (204 No Content)**: Sikeres törlés esetén (üzenet nélkül).
  * **Válasz (400 Bad Request)**: `{ "hiba": "A tanarID és oktatasiAzonosito query paraméterek megadása kötelező." }`
  * **Válasz (404 Not Found)**: `{ "hiba": "Nincs ilyen foglalás..." }`
  * **Válasz (500 Internal Server Error)**: `{ "hiba": "Szerverhiba történt." }`

* **`GET /api/tanulok/:oktatasiAzonosito/foglalasok`**
  
  * **Leírás**: Lekérdezi egy adott tanuló összes foglalását az aktuális fogadóórára, oktatási azonosító alapján.
  * **Paraméterek**: `oktatasiAzonosito` (URL paraméter)
  * **Válasz (200 OK)**: Foglalások tömbje: `[{ foglalasID, tanarID, tanarNev, idosav, tanuloNeve, oktatasiAzonosito }, ...]`
  * **Válasz (400 Bad Request)**: `{ "hiba": "Oktatási azonosító megadása kötelező." }`
  * **Válasz (500 Internal Server Error)**: `{ "hiba": "Szerverhiba történt a foglalások lekérdezése során." }`

### 6.2. Tanári végpontok

Authentikációt igényelnek - `authenticateToken` middleware.

* **`POST /api/auth/login`**
  
  * **Leírás**: Tanár bejelentkeztetése.
  * **Request Body (JSON)**: `{ "nev": "Tanár Neve", "jelszo": "jelszó" }`
  * **Válasz (200 OK)**: `{ "token": "JWT_TOKEN", "tanar": { tanarID, nev, terem, targyak } }` (a `jelszoHash` nélkül)
  * **Válasz (400 Bad Request)**: `{ "hiba": "A név és jelszó megadása kötelező." }`
  * **Válasz (401 Unauthorized)**: `{ "hiba": "Hibás felhasználónév vagy jelszó." }`
  * **Válasz (500 Internal Server Error)**: `{ "hiba": "Szerverhiba történt." }`

* **`GET /api/auth/profil/foglalasok`**
  
  * **Leírás**: A bejelentkezett tanár összes foglalásának listázása az aktuális fogadóórára. A tanár ID-ját a JWT tokenből nyeri ki.
  * **Headers**: `Authorization: Bearer <token>`
  * **Válasz (200 OK)**: Foglalások tömbje: `[{ foglalasID, idosav, tanuloNeve, oktatasiAzonosito }, ...]`
  * **Válasz (401 Unauthorized)**: `{ "hiba": "Nincs token megadva." }` (ha a token hiányzik)
  * **Válasz (403 Forbidden)**: `{ "hiba": "Hibás token." }` (ha a token érvénytelen)
  * **Válasz (500 Internal Server Error)**: `{ "hiba": "Szerverhiba történt." }`

## 7. Szerver indítása és leállítása

* **Indítás**: Az adatbázis inicializálása (táblák létrehozása és tanárok adatainak feltöltése) és a .env fájlban lévő környezeti változók beállítása után a szerver a projekt gyökérkönyvtárából a `node server.js` paranccsal indítható. A szerver a `PORT` környezeti változóban (vagy alapértelmezetten a 3000-es porton) indul el. Induláskor kiírja a konzolra a futási portot, az adatbázis elérési útját és a fogadóóra konfigurációját.
* **Graceful Shutdown**: A szerver figyeli a `exit`, `SIGHUP`, `SIGINT`, `SIGTERM` eseményeket, és ezek bekövetkeztekor megfelelően lezárja az adatbázis kapcsolatot (`db.close()`) a folyamat leállása előtt.

## 8. Statikus fájlok kiszolgálása

* `app.use(express.static('public'));`
  * A `public` mappa tartalmát (pl. HTML, CSS, kliensoldali JavaScript fájlok) statikusan szolgálja ki.

## 9. Middleware-ek

* `cors()`: Engedélyezi a Cross-Origin Resource Sharing-et, ami szükséges lehet, ha a frontend és a backend különböző domaineken/portokon fut.
* `express.json()`: Feldolgozza a bejövő JSON request body-kat.

## 10. API tesztelés

A backend API végpontjainak helyes működését a `tests/api_test.http` fájlban definiált tesztesetek segítségével lehet ellenőrizni. Ez a fájl a REST Client Visual Studio Code kiterjesztés által használt `.http` formátumot követi, amely lehetővé teszi HTTP kérések közvetlen küldését és a válaszok vizsgálatát a szerkesztőn belül.

* **Cél**:
  * Az összes API végpont funkcionalitásának ellenőrzése (sikeres esetek, hibakezelés, peremfeltételek).
  * Az adatbázis-műveletek helyességének validálása a végpontokon keresztül.
  * Az authentikációs mechanizmus (JWT) megfelelő működésének tesztelése.
  * A konfigurációs beállítások (pl. fogadóóra ideje) API-n keresztüli hatásának ellenőrzése.
* **Használat**:
  * A `tests/api_test.http` fájl tartalmazza a különböző végpontokhoz tartozó GET, POST, DELETE kéréseket.
  * Minden kérés előtt és után kommentekben szerepel a teszt célja és az elvárt eredmény (státuszkód, válasz body).
  * A tesztek futtatásához a REST Client kiterjesztés telepítése szükséges a VS Code-ban. Ezt követően a `.http` fájlban a "Send Request" linkre kattintva lehet egyesével végrehajtani a kéréseket.
  * A tesztek feltételezik, hogy az adatbázis a `tesztadatok.sql` szkript alapján lett inicializálva, és a `.env` fájlban a megfelelő konfigurációs értékek (pl. `DATE`, `START`, `END`) be vannak állítva a tesztesetek elvárásainak megfelelően.
  * Néhány teszt (pl. foglalás törlése) módosítja az adatbázis állapotát. Ezek újrafuttatása előtt szükség lehet az adatbázis visszaállítására a `tesztadatok.sql` segítségével.
  * Az authentikációt igénylő végpontok teszteléséhez a bejelentkezési (`/api/auth/login`) végpont válaszából származó JWT token `@változó`-ban kerül elmentésre, amit a későbbi kérések `Authorization: Bearer {{@valtozoNeve}}` fejlécben használnak fel.
