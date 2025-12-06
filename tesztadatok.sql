CREATE TABLE tanarok (
    tanarID INTEGER PRIMARY KEY AUTOINCREMENT,
    nev TEXT NOT NULL,
    jelszoHash TEXT NOT NULL,
    terem TEXT,
    targyak TEXT
);

CREATE TABLE foglalasok (
    foglalasID INTEGER PRIMARY KEY AUTOINCREMENT,
    tanarID INTEGER NOT NULL,
    idosav TEXT NOT NULL, -- A konkrét 10 perces idősáv kezdete, pl. '17:00', '17:10'
    tanuloNeve TEXT NOT NULL,
    oktatasiAzonosito TEXT NOT NULL,
    FOREIGN KEY (tanarID) REFERENCES tanarok(tanarID) ON DELETE CASCADE,
    UNIQUE (tanarID, idosav), -- Biztosítja, hogy egy tanárhoz egy adott idősávra csak egy foglalás legyen (az aktuális fogadóórán)
    UNIQUE (tanarID, oktatasiAzonosito), -- Biztosítja, hogy egy tanuló egy adott tanárhoz csak egy időpontot foglalhasson (az aktuális fogadóórán)
    UNIQUE (oktatasiAzonosito, idosav) -- Biztosítja, hogy egy tanuló ne lehessen egyszerre két helyen (az aktuális fogadóórán)
);

-- Tanárok beszúrása
INSERT INTO tanarok (nev, jelszoHash, terem, targyak) VALUES
('Nagy Béla', '$2b$10$Ds3fc3CLCL67UAYJ9N2vcuxvE9hHiYwShQHDdzyyRJJV1g/DbgeY.', '101-es terem', 'Matematika, Fizika'),
('Kiss Mária', '$2b$10$2OvYwi31gNvDdpJDThzFVex1KU1lWQgJC2vO.nvInIpGUrBBVyOe2', '102-es terem', 'Magyar nyelv és irodalom'),
('Szabó István', '$2b$10$QVXHB2/91kzFdAOJvc9aZu2V1WhySZoY9qIjINAvaLjhqohAd1TLa', 'Földszint 3.', 'Történelem, Földrajz'),
('Horváth Éva', '$2b$10$FuKKMjeW6yIQY8qG9yqlZOgDH3aoKXFPtpyoaTR/0E4oP0FGFcbfi', '205-ös terem', 'Angol nyelv');

-- Foglalások beszúrása az aktuális fogadóórára
-- Tanár ID-k: Nagy Béla=1, Kiss Mária=2, Szabó István=3, Horváth Éva=4

-- Nagy Bélához (TanarID=1)
INSERT INTO foglalasok (tanarID, idosav, tanuloNeve, oktatasiAzonosito) VALUES
(1, '17:00', 'Teszt Elek', '70000000001'),
(1, '17:20', 'Minta Anna', '70000000002');

-- Kiss Máriához (TanarID=2)
INSERT INTO foglalasok (tanarID, idosav, tanuloNeve, oktatasiAzonosito) VALUES
(2, '17:10', 'Próba Péter', '70000000003'),
(2, '17:50', 'Gyakorló Gréta', '70000000004');

-- Szabó Istvánhoz (TanarID=3)
INSERT INTO foglalasok (tanarID, idosav, tanuloNeve, oktatasiAzonosito) VALUES
(3, '17:50', 'Kísérleti Kázmér', '70000000005');

-- Horváth Évához (TanarID=4)
-- Nincs még foglalás, hogy lássuk az üres helyeket is.
