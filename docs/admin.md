Rendszergazdai teendők új fogadóóra előtt
-----------------------------------------

Minden új fogadóóra előtt az alábbi lépéseket kell elvégezni.

**Cél:** Az előző fogadóóra adatainak archiválása, a rendszer felkészítése az új fogadóórára friss tanári adatokkal és az új időpont-konfigurációval.

**Szükséges eszközök/fájlok:**

* Hozzáférést a szerverhez, ahol az alkalmazás fut.
* Egy SQL-kliens (pl. `sqlite3` parancssori eszköz vagy SQLite3 Editor kiegészítő a Visual Studio Code-ban) az adatbázis kezeléséhez.
* Egy naprakész SQL fájl, amely a táblák létrehozását és az aktuális tanárok adatait tartalmazó `INSERT` utasításokat tartalmazza. Ez a `tesztadatok.sql` fájlból származtatható a `foglalasok` táblába történő `INSERT` utasítások eltávolításával, valamint a tanári adatok frissítésével.
* Szerkesztő a `.env` konfigurációs fájl és az SQL fájl módosításához.

**Lépések:**

1. **Szerver leállítása (Ajánlott)**
   
   * Mielőtt módosításokat végezne az adatbázison vagy a konfigurációs fájlokon, ajánlott leállítani az alkalmazást futtató Node.js szervert. Ez megelőzi az esetleges adatkonzisztencia-problémákat.
   * A szerver a terminálban, ahol fut, a `Ctrl+C` billentyűkombinációval állítható le.

2. **Adatbázis és konfiguráció biztonsági mentése**
   
   * Készítsen biztonsági másolatot az aktuális adatbázis fájlról és a `.env` fájlról.
   * A másolatot egy dátummal elnevezett mappába vagy tömörített fájlba tegye. Ez lehetővé teszi a korábbi állapot visszaállítását szükség esetén.

3. **Adatbázis törlése**
   
   * Nyisson egy parancssort és törölje az adatbázis fájlokat a következő paranccsal:
     `del idopontok.db*`

4. **`.env` konfigurációs fájl frissítése**
   
   * Nyissa meg a projekt gyökérkönyvtárában található `.env` fájlt egy szövegszerkesztővel.
   * Módosítsa a következő változók értékeit az új fogadóóra adatai szerint:
     * `DATE`: Az új fogadóóra dátuma (pl. `DATE=2025-09-15`)
     * `START`: Az új fogadóóra kezdési időpontja (pl. `START=16:30`)
     * `END`: Az új fogadóóra befejezési időpontja (pl. `END=18:30`)
     * `HOSSZ`: Az idősávok hossza percekben (pl. `HOSSZ=15`)
   * Mentse el a `.env` fájlt.

5. **Új adatbázis létrehozása**
   
   * Nyissa meg az init.sql fájlt egy editorban, majd írja be a tanárok adatait a következő formában, vagy írja át a tesztadatokat:
     
     ```sql
     INSERT INTO tanarok (nev, jelszoHash, terem, targyak) 
     VALUES ('Új Tanár János', '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '103-as terem', 'Biológia');
     ```
     
     _Fontos: A `jelszoHash` értékeket a `hash.js` szkripttel generált, biztonságos hashekkel kell megadni._
   
   * Futtassa ezt az SQL fájlt:
     
     ```text
     sqlite3 idopontok.db < init.sql
     ```

6. **Szerver újraindítása**
   
   * Indítsa el újra a Node.js szervert a projekt gyökérkönyvtárából a `node server.js` paranccsal.

Ezekkel a lépésekkel a rendszer készen áll az új fogadóóra fogadására. Javasolt a folyamatot először tesztkörnyezetben kipróbálni, mielőtt éles rendszeren alkalmazná.
