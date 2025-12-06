// hash.js
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askForPasswordAndHash() {
  rl.question('Adja meg a jelszót (vagy hagyja üresen a kilépéshez): ', async (password) => {
    if (!password) {
      console.log('Kilépés...');
      rl.close();
      return;
    }

    try {
      const saltRounds = 10; // Ajánlott érték a bcrypt-hez
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('A jelszó hash-e:', hashedPassword);
    } catch (error) {
      console.error('Hiba történt a jelszó hashelése közben:', error);
    } finally {
      // Újra meghívjuk a függvényt a következő jelszó bekéréséhez
      askForPasswordAndHash();
    }
  });
}

// Indítsuk el a jelszó bekérési folyamatot
askForPasswordAndHash();
