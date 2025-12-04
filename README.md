# Fogadóra

## Vizsgaremek (2025. május)

A Fogadóóra alkalmazás célja, hogy egyszerű és átlátható platformot biztosítson iskolai fogadóórák időpontjainak online kezelésére. Lehetővé teszi a szülők számára, hogy időpontot foglaljanak a választott tanárokhoz, a tanárok számára pedig, hogy áttekinthessék a hozzájuk érkezett foglalásokat.

* * *

## Telepítés és futtatás

### Szükséges szoftverek

* Node.js (LTS verzió ajánlott)
* npm (Node.js-sel együtt települ)

### Konfiguráció

1. Klónozd a projekt repository-t.

2. Navigálj a projekt gyökérkönyvtárába.

3. Hozz létre egy `.env` fájlt a gyökérkönyvtárban a következő tartalommal (Cseréld le a `JWT_SECRET` értékét egy titkos kulcsra, a dátumot pedig egy jövőbeli dátumra):

   ```plaintext
    PORT=3000
    DATABASE_PATH=idopontok.db
    JWT_SECRET=secret_key_for_jwt
    DATE=2026-09-02
    START=18:00
    END=19:00
    HOSSZ=10
   ```

4. Telepítsd a függőségeket: `npm install`

5. Hozd létre az adatbázist és abban a tanárok adatait. Ezt  alegegyszerűbbe a `tesztadatok.sql` fájlban lévő parancsok futtatásával tudod megtenni:
   `sqlite3 idopontok.db < tesztadatok.sql`

A rendszergazdáknak részletes [leírás](docs/admin.md) is van a teendőkről.

### Indítás

* A szerver indítása: `npm start` vagy `node server.js`
* Az alkalmazás elérhető lesz a `http://localhost:3000` címen.

## Dokumentáció

* A specifikáció, valamint a frontend és a backend dokumentációja a [docs mappában](docs) található.

## Tesztelés

* A manuális teszteket a [tests mappában](tests) találod.
