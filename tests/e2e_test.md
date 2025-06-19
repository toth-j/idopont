# Fogadóóra alkalmazás E2E tesztesetek

Ez a dokumentum a Fogadóóra alkalmazás végponttól végpontig (E2E) tartó teszteseteit tartalmazza, a felhasználói felületek főbb funkcióira összpontosítva. A tesztek feltételezik, hogy az adatbázis a `tesztadatok.sql` alapján lett inicializálva.

## 1. Szülői felület (`index.html`, `szulo.js`)

### 1.1. Tanulói adatok sikeres megadása és továbbítás

* **Cél**: Ellenőrizni, hogy a felhasználó sikeresen meg tudja adni a tanuló adatait, és tovább tud lépni a tanárválasztó felületre.
* **Előfeltételek**: Az alkalmazás fut, az `index.html` elérhető.
* **Lépések**:
    1. Nyissa meg az `index.html` oldalt a böngészőben.
    2. A "Tanuló neve" mezőbe írjon be egy nevet ("Új Diák Géza").
    3. Az "Oktatási azonosító" mezőbe írjon be egy érvényes, 11 jegyű számot, amely még nem szerepel a `tesztadatok.sql`-ben ("70000000006").
    4. Kattintson a "Tovább az időpontfoglaláshoz" gombra.
* **Elvárt eredmény**:
  * A "Tanuló adatai" szakasz eltűnik.
  * A "Válasszon tanárt" szakasz megjelenik.
  * A tanárok listája betöltődik a "Válasszon tanárt" szakaszban ("Nagy Béla", "Kiss Mária", "Szabó István", "Horváth Éva").
  * A "Foglalásaim" szakasz megjelenik.
  * A "Foglalásaim" szakasz fejlécében megjelenik a megadott tanuló neve és oktatási azonosítója ("Új Diák Géza 70000000006").
  * Még nincs foglalásom, ezért megjelenik a "Nincsenek foglalásaid ezzel az oktatási azonosítóval." üzenet.

### 1.2. Tanulói adatok érvénytelen megadása

* **Cél**: Ellenőrizni, hogy a rendszer helyesen kezeli-e az érvénytelen tanulói adatokat.
* **Előfeltételek**: Az alkalmazás fut, az `index.html` elérhető.
* **Lépések**:
    1. Nyissa meg az `index.html` oldalt a böngészőben.
    2. Hagyja üresen a "Tanuló neve" mezőt.
    3. Az "Oktatási azonosító" mezőbe írjon be egy érvénytelen azonosítót ("123" vagy "abc").
    4. Kattintson a "Tovább az időpontfoglaláshoz" gombra.
* **Elvárt eredmény**:
  * Egy figyelmeztető üzenet jelenik meg, amely tájékoztat, hogy "Töltse ki ezt a mezőt".
  * A "Tanuló adatai" szakasz továbbra is látható marad.

### 1.3. Tanár kiválasztása és fogadóóra időpontok megjelenítése

* **Cél**: Ellenőrizni, hogy a felhasználó ki tud választani egy tanárt, és megjelennek a tanár adatai, valamint a szabad/foglalt időpontjai.
* **Előfeltételek**: Sikeresen megadta a tanulói adatokat (lásd 1.1. teszteset, "Új Diák Géza", "70000000006"). Az API szolgáltat tanárokat és időpontokat a `tesztadatok.sql` alapján.
* **Lépések**:
    1. A "Válasszon tanárt" listából kattintson "Nagy Béla" nevére.
* **Elvárt eredmény**:
  * A kiválasztott tanár neve "Nagy Béla", terme "101-es terem" és tárgyai "Matematika, Fizika" megjelennek.
  * A "Szabad időpontok" (`idopontok-lista`) alatt megjelennek az időpontok. A `tesztadatok.sql` alapján "Nagy Béla" 17:00 és 17:20 időpontjai piros (foglalt) gombként, a többi lehetséges időpont (a backend logikája szerint) zöld (szabad) gombként jelenik meg.
  * "Nagy Béla" aktívként jelenik meg a tanárlistában.

### 1.4. Sikeres időpontfoglalás

* **Cél**: Ellenőrizni, hogy a felhasználó sikeresen tud időpontot foglalni egy tanárhoz.
* **Előfeltételek**: A tanulói adatok megadva ("Új Foglaló Károly", "70000000007" - egy új, még nem használt azonosító). A felhasználó kiválasztotta "Horváth Éva" tanárt (akinek a `tesztadatok.sql` szerint nincsenek foglalásai, így minden időpontja szabad).
* **Lépések**:
    1. A "Szabad időpontok" listából kattintson egy zöld, szabad időpontot jelző gombra, "Horváth Éva"-nál a "17:00" gombra.
    2. A megjelenő megerősítő párbeszédablakban ("Biztosan szeretné lefoglalni ezt az időpontot?") kattintson az "OK" gombra.
* **Elvárt eredmény**:
  * A "Foglalásaim" szakaszban megjelenik az újonnan foglalt időpont: "Horváth Éva - 17:00" és mellette a "Lemondás" gomb
  * "Horváth Éva" "Szabad időpontok" nézete frissül: megjelenik a "Már van foglalása ehhez a tanárhoz" üzenet.

### 1.5. Időpontfoglalási kísérlet már foglalt idősávra (másik tanárnál)

* **Cél**: Ellenőrizni, hogy a rendszer megakadályozza-e a foglalást olyan idősávra, amelyben a tanulónak már van foglalása egy másik tanárnál.
* **Előfeltételek**: A tanuló "Teszt Elek" (oktatási azonosító: "70000000001") be van jelentkezve. A `tesztadatok.sql` szerint "Teszt Elek"-nek 17:00-kor van foglalása "Nagy Béla"-nál. A felhasználó kiválasztja "Kiss Mária" tanárt. Feltételezzük, hogy "Kiss Mária"-nak a rendszer generál egy szabad "17:00" idősávot.
* **Lépések**:
    1. Válassza ki "Kiss Mária" tanárt.
    2. Kattintson "Kiss Mária" "17:00"-s szabad időpontjára.
* **Elvárt eredmény**:
  * Egy figyelmeztető üzenet (alert) jelenik meg, amely tájékoztatja a felhasználót, hogy ebben az idősávban már van egy másik foglalása ("Figyelem: Ebben az idősávban (17:00) már van egy másik foglalásod...").
  * A foglalás nem történik meg.

### 1.6. Időpontfoglalási kísérlet tanárnál, akihez már van foglalás

* **Cél**: Ellenőrizni, hogy a rendszer nem enged újabb időpontot foglalni ugyanahhoz a tanárhoz, ha már van létező foglalás.
* **Előfeltételek**: A tanuló "Teszt Elek" (oktatási azonosító: "70000000001") be van jelentkezve. A `tesztadatok.sql` szerint "Teszt Elek"-nek van foglalása "Nagy Béla"-nál.
* **Lépések**:
    1. Válassza ki újra "Nagy Béla" tanárt a listából.
* **Elvárt eredmény**:
  * A "Szabad időpontok" helyett egy figyelmeztető üzenet jelenik meg ("Már van foglalása ehhez a tanárhoz. Újabb foglalás nem lehetséges.").
  * Nem jelennek meg foglalható időpont gombok.

### 1.7. Foglalás lemondása

* **Cél**: Ellenőrizni, hogy a felhasználó sikeresen le tudja mondani egy meglévő foglalását.
* **Előfeltételek**: A tanuló "Új Foglaló Károly" (oktatási azonosító: "70000000007") be van jelentkezve. Az 1.4-es tesztben foglalt egy idpontot Horváth Évához ("17:00"). Ez a foglalás megjelenik a "Foglalásaim" szakaszban.
* **Lépések**:
    1. A "Foglalásaim" listában a "Új Foglaló Károly - 17:00" foglalás melletti "Lemondás" gombra kattint.
    2. A megjelenő megerősítő párbeszédablakban ("Biztosan le szeretné mondani ezt a foglalást?") kattintson az "OK" gombra.
* **Elvárt eredmény**:
  * A foglalás eltűnik a "Foglalásaim" listából.
  * Ha "Horváth Éva" van kiválasztva a tanárlistából, és az ő időpontjai látszódtak, akkor a 17:00-ás időpontja újra szabaddá válik (zöld gombként jelenik meg).

### 1.8. Navigációs sávban a dátum megjelenése

* **Cél**: Ellenőrizni, hogy a fogadóóra dátuma helyesen megjelenik-e a navigációs sávban.
* **Előfeltételek**: Az alkalmazás fut, az `index.html` elérhető. Az `/api/config` végpont szolgáltatja a dátumot ("2023-12-01").
* **Lépések**:
    1. Nyissa meg az `index.html` oldalt a böngészőben.
* **Elvárt eredmény**:
  * A navigációs sávban a "Fogadóóra" szöveg mellett zárójelben megjelenik az aktuális fogadóóra dátuma ("Fogadóóra (2025-09-02)").

## 2. Tanári felület (`tanar.html`, `tanar.js`)

### 2.1. Sikeres tanári bejelentkezés

* **Cél**: Ellenőrizni, hogy a tanár sikeresen be tud jelentkezni a rendszerbe.
* **Előfeltételek**: Az alkalmazás fut, a `tanar.html` elérhető. A `tesztadatok.sql` alapján "Nagy Béla" tanár létezik. A bejelentkezéshez a "Nagy Béla" névhez tartozó, a backend által elfogadott jelszó szükséges (`nagyb`).
* **Lépések**:
    1. Nyissa meg a `tanar.html` oldalt a böngészőben.
    2. A "Név" mezőbe írja be: "Nagy Béla".
    3. A "Jelszó" mezőbe írja be a "Nagy Béla" tanárhoz tartozó érvényes jelszót ("nagyb").
    4. Kattintson a "Bejelentkezés" gombra.
* **Elvárt eredmény**:
  * A bejelentkezési felület eltűnik.
  * A tanári dashboard megjelenik.
  * Az üdvözlő üzenet: "Üdvözöljük, Nagy Béla!".
  * A tanár terme "101-es terem", tanított tárgyai "Matematika, Fizika".
  * A tanár foglalásai betöltődnek a "Foglalásaim" táblázatba (lásd 2.5. teszteset).
  * A `localStorage`-ban tárolódik a `tanarToken` és `tanarData`.

### 2.2. Sikertelen tanári bejelentkezés (hibás adatok)

* **Cél**: Ellenőrizni, hogy a rendszer helyesen kezeli-e a hibás bejelentkezési kísérletet.
* **Előfeltételek**: Az alkalmazás fut, a `tanar.html` elérhető.
* **Lépések**:
    1. Nyissa meg a `tanar.html` oldalt a böngészőben.
    2. A "Név" mezőbe írja be: "Nagy Béla".
    3. A "Jelszó" mezőbe írjon be egy érvénytelen jelszót ("hibasjelszo").
    4. Kattintson a "Bejelentkezés" gombra.
* **Elvárt eredmény**:
  * A bejelentkezési felület továbbra is látható marad.
  * A "Bejlentkezés" gomb alatt hibaüzenet jelenik meg ("Hibás felhasználónév vagy jelszó.").

### 2.3. Tanári kijelentkezés

* **Cél**: Ellenőrizni, hogy a tanár sikeresen ki tud jelentkezni a rendszerből.
* **Előfeltételek**: A tanár be van jelentkezve ("Nagy Béla", lásd 2.1. teszteset).
* **Lépések**:
    1. A tanári dashboardon kattintson a "Kijelentkezés" gombra.
* **Elvárt eredmény**:
  * A tanári dashboard eltűnik.
  * A bejelentkezési felület újra megjelenik.
  * A `localStorage`-ból törlődik a `tanarToken` és `tanarData`.

### 2.4. Munkamenet megőrzése (oldal újratöltése után)

* **Cél**: Ellenőrizni, hogy a bejelentkezett tanár bejelentkezve marad-e az oldal újratöltése után.
* **Előfeltételek**: A tanár sikeresen bejelentkezett ("Nagy Béla").
* **Lépések**:
    1. Jelentkezzen be "Nagy Béla"-ként.
    2. Töltse újra a `tanar.html` oldalt a böngészőben (F5 vagy frissítés gomb).
* **Elvárt eredmény**:
  * A tanári dashboard jelenik meg, nem a bejelentkezési felület.
  * Az üdvözlő üzenet és a tanári adatok helyesen jelennek meg ("Nagy Béla" adatai).

### 2.5. Tanári foglalások megtekintése a dashboardon

* **Cél**: Ellenőrizni, hogy a bejelentkezett tanár látja-e a hozzá tartozó foglalásokat a `tesztadatok.sql` alapján.
* **Előfeltételek**: "Nagy Béla" tanár be van jelentkezve.
* **Lépések**:
    1. Jelentkezzen be "Nagy Béla"-ként.
* **Elvárt eredmény**:
  * A "Foglalásaim" táblázat a következő sorokat tartalmazza:
    * Idősáv: "17:00", Tanuló neve: "Teszt Elek", Oktatási azonosítója: "70000000001"

### 2.6. Üres foglalási lista megtekintése a dashboardon

* **Cél**: Ellenőrizni, hogy a rendszer helyesen jeleníti-e meg, ha a tanárnak nincsenek foglalásai.
* **Előfeltételek**:"Horváth Éva" tanár be van jelentkezve (a `tesztadatok.sql` szerint nincsenek foglalásai). A bejelentkezéshez a "Horváth Éva" névhez tartozó, a backend által elfogadott jelszó szükséges. 
* **Lépések**:
    1. Jelentkezzen be "Horváth Éva"-ként.
* **Elvárt eredmény**:
  * A "Foglalásaim" táblázat egyetlen sort tartalmaz egy üzenettel, "Nincsenek aktuális foglalások.".

### 2.7. Navigációs sávban a dátum megjelenése (Tanári felület)

* **Cél**: Ellenőrizni, hogy a fogadóóra dátuma helyesen megjelenik-e a navigációs sávban a tanári felületen is.
* **Előfeltételek**: Az alkalmazás fut, a `tanar.html` elérhető. Az `/api/config` végpont szolgáltatja a dátumot ("2023-12-01").
* **Lépések**:
    1. Nyissa meg a `tanar.html` oldalt a böngészőben.
* **Elvárt eredmény**:
  * A navigációs sávban a "Fogadóóra" szöveg mellett zárójelben megjelenik az aktuális fogadóóra dátuma ("Fogadóóra (2023-12-01)").

### 2.8. Lejárt/érvénytelen munkamenet kezelése

* **Cél**: Ellenőrizni, hogy a rendszer visszairányítja-e a felhasználót a bejelentkezési oldalra, ha a munkamenet (token) érvénytelen vagy lejárt a védett erőforrások (foglalások) lekérésekor.
* **Előfeltételek**: A tanár korábban bejelentkezett, de a tokenje időközben érvénytelenné vált (ezt nehéz E2E szinten szimulálni a frontendről, de a kódban lévő logikát teszteli).
* **Lépések**:
    1. (Szimulált) A tanár be van jelentkezve, de a `localStorage`-ban lévő `tanarToken` már nem érvényes.
    2. Az alkalmazás megpróbálja betölteni a tanári foglalásokat (`loadTanariFoglalasok` függvény hívódik meg, dashboard megjelenítésekor vagy oldalfrissítéskor).
* **Elvárt eredmény**:
  * A felhasználó a bejelentkezési felületre kerül.
  * Egy figyelmeztető üzenet (alert) jelenik meg, "Lejárt vagy érvénytelen munkamenet. Kérjük, jelentkezzen be újra.".
  * A `localStorage`-ból törlődik a `tanarToken` és `tanarData`.
