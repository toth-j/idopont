// server.js
require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const dbPath = process.env.DATABASE_PATH || 'idopontok.db';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const JWT_SECRET = process.env.JWT_SECRET;
// Fogadóóra konfiguráció
const FOGADOORA_START_IDO = process.env.START || "17:00";
const FOGADOORA_END_IDO = process.env.END || "18:00";
const FOGADOORA_HOSSZ_PERC = parseInt(process.env.HOSSZ) || 10;
const FOGADOORA_DATUM = process.env.DATE;

// Idősávok generálása
function generateTimeSlots(startTimeStr, endTimeStr, intervalMinutes, existingBookings) {
  const slots = [];
  const [startHour, startMinute] = startTimeStr.split(':').map(Number);
  const [endHour, endMinute] = endTimeStr.split(':').map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const booking = existingBookings.find(b => b.idosav === timeStr);
    if (booking) {
      slots.push({
        idosav: timeStr,
        statusz: 'foglalt',
        foglaloAdatai: {
          tanuloNeve: booking.tanuloNeve,
          oktatasiAzonosito: booking.oktatasiAzonosito
        }
      });
    } else {
      slots.push({ idosav: timeStr, statusz: 'szabad' });
    }
    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute %= 60;
    }
  }
  return slots;
}

// Middleware: Token hitelesítés
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ hiba: 'Nincs token megadva.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ hiba: 'Hibás token.' }); // Forbidden
    req.user = user;
    next();
  });
}

// --- Publikus végpontok ---

// 0. Konfigurációs adatok (dátum)
app.get('/api/config', (req, res) => {
  res.status(200).json({ date: process.env.DATE });
});


// 1. Összes tanár listázása
app.get('/api/tanarok', (req, res) => {
  try {
    const stmt = db.prepare('SELECT tanarID, nev, terem, targyak FROM tanarok');
    const tanarok = stmt.all();
    res.status(200).json(tanarok);
  } catch (error) {
    console.error("Hiba a tanárok listázásakor:", error);
    res.status(500).json({ hiba: 'Szerverhiba történt.' });
  }
});

// 2. Egy adott tanár fogadóórájának lekérdezése
app.get('/api/tanarok/:tanarID/fogadoora', (req, res) => {
  const { tanarID } = req.params;
  try {
    const tanarStmt = db.prepare('SELECT tanarID, nev, terem, targyak FROM tanarok WHERE tanarID = ?');
    const tanar = tanarStmt.get(tanarID);
    if (!tanar) {
      return res.status(404).json({ hiba: 'A megadott tanár nem található.' });
    }

    const foglalasokStmt = db.prepare('SELECT idosav, tanuloNeve, oktatasiAzonosito FROM foglalasok WHERE tanarID = ?');
    const foglaltIdopontok = foglalasokStmt.all(tanarID);
    const idopontok = generateTimeSlots(FOGADOORA_START_IDO, FOGADOORA_END_IDO, FOGADOORA_HOSSZ_PERC, foglaltIdopontok);

    res.status(200).json({
      ...tanar,
      idopontok
    });
  } catch (error) {
    console.error(`Hiba a(z) ${tanarID} tanár fogadóórájának lekérdezésekor:`, error);
    res.status(500).json({ hiba: 'Szerverhiba történt.' });
  }
});

// 3. Új időpont foglalása
app.post('/api/tanarok/:tanarID/foglalasok', (req, res) => {
  const { tanarID } = req.params;
  const { idosav, tanuloNeve, oktatasiAzonosito } = req.body;

  if (!idosav || !tanuloNeve || !oktatasiAzonosito) {
    return res.status(400).json({ hiba: 'Minden mező kitöltése kötelező (idosav, tanuloNeve, oktatasiAzonosito).' });
  }

  // Ellenőrizzük, hogy a foglalás a fogadóóra napján vagy előtte történik-e
  const maiDatum = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formátum
  if (!FOGADOORA_DATUM) {
    console.error("Hiba: A FOGADOORA_DATUM nincs beállítva a .env fájlban.");
    return res.status(500).json({ hiba: 'Szerver konfigurációs hiba: a fogadóóra dátuma nincs megadva.' });
  }
  if (maiDatum > FOGADOORA_DATUM) {
    return res.status(403).json({ hiba: `Foglalás csak a fogadóóra napjáig lehetséges.` });
  }

  // Ellenőrizzük, hogy a tanár létezik-e
  const tanarStmt = db.prepare('SELECT tanarID FROM tanarok WHERE tanarID = ?');
  const tanar = tanarStmt.get(tanarID);
  if (!tanar) {
    return res.status(404).json({ hiba: 'A megadott tanár nem található.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO foglalasok (tanarID, idosav, tanuloNeve, oktatasiAzonosito) VALUES (?, ?, ?, ?)');
    const info = stmt.run(tanarID, idosav, tanuloNeve, oktatasiAzonosito);
    res.status(201).json({
      foglalasID: info.lastInsertRowid,
      tanarID: parseInt(tanarID),
      idosav,
      tanuloNeve,
      oktatasiAzonosito
    });
  } catch (error) {
    console.error("Hiba foglaláskor:", error.message);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      if (error.message.includes('foglalasok.tanarID, foglalasok.idosav')) {
        return res.status(409).json({ hiba: 'Ez az idősáv ennél a tanárnál már foglalt.' });
      }
      if (error.message.includes('foglalasok.tanarID, foglalasok.oktatasiAzonosito')) {
        return res.status(409).json({ hiba: 'Ennél a tanárnál már van foglalásod.' });
      }
      if (error.message.includes('foglalasok.oktatasiAzonosito, foglalasok.idosav')) {
        return res.status(409).json({ hiba: 'Ebben az időpontban már van egy másik foglalásod.' });
      }
    }
    res.status(500).json({ hiba: 'Szerverhiba történt a foglalás során.' });
  }
});

// 4. Szülő törli a saját foglalását
app.delete('/api/foglalasok', (req, res) => {
  const { tanarID, oktatasiAzonosito } = req.query;
  if (!tanarID || !oktatasiAzonosito) {
    return res.status(400).json({ hiba: 'A tanarID és oktatasiAzonosito query paraméterek megadása kötelező.' });
  }

  try {
    const stmt = db.prepare('DELETE FROM foglalasok WHERE tanarID = ? AND oktatasiAzonosito = ?');
    const info = stmt.run(tanarID, oktatasiAzonosito);

    if (info.changes > 0) {
      res.status(204).json({ uzenet: 'A foglalás sikeresen törölve lett' });
    } else {
      res.status(404).json({ hiba: 'Nincs ilyen foglalás a megadott tanárnál ezzel az oktatási azonosítóval.' });
    }
  } catch (error) {
    console.error("Hiba foglalás törlésekor:", error);
    res.status(500).json({ hiba: 'Szerverhiba történt.' });
  }
});

// 5. Egy adott tanuló összes foglalásának lekérdezése
app.get('/api/tanulok/:oktatasiAzonosito/foglalasok', (req, res) => {
  const { oktatasiAzonosito } = req.params;
  if (!oktatasiAzonosito) {
    return res.status(400).json({ hiba: 'Oktatási azonosító megadása kötelező.' });
  }

  try {
    const stmt = db.prepare(`
      SELECT f.foglalasID, f.tanarID, t.nev as tanarNev, f.idosav, f.tanuloNeve, f.oktatasiAzonosito
      FROM foglalasok f
      JOIN tanarok t ON f.tanarID = t.tanarID
      WHERE f.oktatasiAzonosito = ?
      ORDER BY f.idosav
    `);
    const foglalasok = stmt.all(oktatasiAzonosito);
    res.status(200).json(foglalasok);
  } catch (error) {
    console.error(`Hiba a(z) ${oktatasiAzonosito} tanuló foglalásainak lekérdezésekor:`, error);
    res.status(500).json({ hiba: 'Szerverhiba történt a foglalások lekérdezése során.' });
  }
});

// --- Tanári (hitelesítést igénylő) végpontok ---

// 6. Tanár bejelentkezése
app.post('/api/auth/login', (req, res) => {
  const { nev, jelszo } = req.body;
  if (!nev || !jelszo) {
    return res.status(400).json({ hiba: 'A név és jelszó megadása kötelező.' });
  }

  try {
    const stmt = db.prepare('SELECT tanarID, nev, jelszoHash, terem, targyak FROM tanarok WHERE nev = ?');
    const tanar = stmt.get(nev);
    if (!tanar) {
      return res.status(401).json({ hiba: 'Hibás felhasználónév vagy jelszó.' });
    }
    bcrypt.compare(jelszo, tanar.jelszoHash, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ hiba: 'Hibás felhasználónév vagy jelszó.' });
      }

      const { jelszoHash, ...tanarAdatai } = tanar; // Jelszóhash nélkül küldjük vissza
      const token = jwt.sign({ tanarID: tanar.tanarID, nev: tanar.nev }, JWT_SECRET, { expiresIn: '2h' });
      res.status(200).json({ token, tanar: tanarAdatai });
    });
  } catch (error) {
    console.error("Hiba bejelentkezéskor:", error);
    res.status(500).json({ hiba: 'Szerverhiba történt.' });
  }
});

// 7. Bejelentkezett tanár foglalásainak listázása
app.get('/api/auth/profil/foglalasok', authenticateToken, (req, res) => {
  const tanarID = req.user.tanarID; // a tokenből
  try {
    const stmt = db.prepare('SELECT foglalasID, idosav, tanuloNeve, oktatasiAzonosito FROM foglalasok WHERE tanarID = ? ORDER BY idosav');
    const foglalasok = stmt.all(tanarID);
    res.status(200).json(foglalasok);
  } catch (error) {
    console.error("Hiba a tanári foglalások listázásakor:", error);
    res.status(500).json({ hiba: 'Szerverhiba történt.' });
  }
});

// szerver indítása
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Szerver fut a http://localhost:${PORT} porton`);
  console.log(`Adatbázis: ${dbPath}`);
  console.log(`Fogadóóra: ${FOGADOORA_START_IDO} - ${FOGADOORA_END_IDO}, ${FOGADOORA_HOSSZ_PERC} perces idősávok`);
});

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
