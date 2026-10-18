# STOKER ($COAL) · X kit

Semua gambar, GIF, dan video dirender dari dunia 3D pixel yang sama dengan situs (`src/components/stoker/world/`), lewat halaman kit `konten-x/stoker-kit/`. Jadi pulau, tungku, dan kereta di postingan sama persis dengan yang di web.

| File | Pakai untuk |
|---|---|
| 01-logo-x.png (1000×1000), 01-logo-x-400.png | Foto profil X: pintu tungku pixel di atas cincin api (aman buat crop bulat) |
| 02-banner-x.png (1500×500) | Header X: seluruh pulau dari atas, tulisan di kanan (pojok kiri bawah aman buat avatar) |
| 03-link-preview.png (1200×630) | Preview link; versi yang sama ada di `public/og-image.png` |
| 04-prelaunch.mp4 (1080×1350, 10 dtk) | Video teaser sebelum launch: kamera mengitari pulau lalu berhenti di pintu tungku, "The fire is lit." |
| 05-burn.gif (720×720, loop) | Postingan launch atau tiap burn: pintu terbuka, gerbong batubara masuk, "Into the fire." |
| 06-how-it-burns.png (1080×1350) | Hook: cara kerja burn dalam 4 stasiun di pulau |
| 07-engine-classes.png (1600×900) | Hook: 5 kelas lokomotif yang terbuka sesuai % supply terbakar |
| 08-meme-firebox.png (1080×1080) | Meme: "Sold your $COAL?" / "Nothing comes back out of a firebox." |
| 09-template-burn.png (1080×1350) | Template tiap burn asli: tiket berisi jumlah, nomor, tanggal, dan tx (render ulang, lihat di bawah) |

## Render ulang
Jalankan dev server situs dulu (`npm run dev`), lalu dari root projek:
```
node konten-x/stoker-kit/render.mjs                      # semua aset
node konten-x/stoker-kit/render.mjs og banner            # sebagian
node konten-x/stoker-kit/render.mjs receipt --amount=4,120,330 --n=7 --tx=0x9f3a…c21e "--date=Oct 21, 14:02"
```
Kalau dev server bukan di port 5173, set `KIT_URL` (misalnya `KIT_URL=http://localhost:5191`). Video dan GIF pakai ffmpeg bawaan Remotion di `konten-x/studio` (jalankan `npm ci` di sana sekali kalau belum). Lihat satu aset di browser: `http://localhost:5173/konten-x/stoker-kit/index.html?shot=og` (shot: logo, banner, og, prelaunch, burn, how, classes, meme, receipt).

`og:image` di `index.html` sementara memakai URL GitHub raw (X butuh URL absolut). Ganti ke domain situs begitu sudah ada.

---

## Batas karakter X
Post maksimal **280**, bio maksimal **160** (akun tanpa Premium). Cara X ngitung:
- Huruf, angka, tanda baca biasa: 1. Emoji dan beberapa simbol (misalnya `…`, `→`): 2.
- Link apa pun selalu dihitung 23, berapapun panjangnya.
- CA (alamat 0x…, 42 karakter) dihitung 42.

Angka di tiap judul di bawah udah dihitung dengan aturan itu, dalam kondisi terburuk (placeholder dihitung sepanjang isi aslinya). Kalau ngedit caption, jalanin `python hitung-caption.py` buat ngecek ulang.

## Bio X (146/160)
Stoker shovels $COAL into the furnace at 0x…dEaD. Every trade builds pressure; a full gauge buys $COAL back and burns it. Nothing comes back out.

Akun X: belum ada. Begitu ada, isi `X_URL` di `src/App.tsx` dan tambahkan `twitter:site` di `index.html`.

## Urutan posting yang aku saranin
1. **Beberapa hari sebelum launch:** ganti logo + banner, pin `04-prelaunch.mp4`.
2. **Selang-seling sebelum launch:** `06-how-it-burns.png`, `07-engine-classes.png`, `08-meme-firebox.png`.
3. **Saat launch:** `05-burn.gif` dengan CA di caption, terus pin.
4. **Tiap burn asli:** `09-template-burn.png` diisi jumlah dan tx-nya, plus link tx.

---

## Post: prelaunch (04-prelaunch.mp4, pin) (268/280)
Every token sent to 0x…dEaD has to go somewhere.

Somebody has to shovel it into the fire.

Meet Stoker. Every $COAL trade builds pressure. When the gauge is full, the bot buys $COAL back and it goes into the furnace. Nothing comes back out.

Soon on Robinhood Chain.

## Post: launch (05-burn.gif) (228/280)
$COAL is live.

Every trade raises the pressure. A full gauge buys $COAL back and a wagon of it rolls into the furnace at 0x…dEaD.

The fire is lit. Feed it.

CA: [CA]

[LINK]

## Post: cara kerja (06-how-it-burns.png) (237/280)
How a $COAL trade ends up in the fire:

1. You trade. A small fee raises the pressure.
2. Full gauge: the whistle blows and the bot claims it.
3. It buys $COAL on the open market.
4. Into the furnace at 0x…dEaD.

Every step is on chain.

## Post: kelas lokomotif (07-engine-classes.png) (221/280)
The engine grows as the supply burns.

0-4-0 Yard Shunter is on the line today. Every percent of $COAL in the furnace rolls a bigger engine out of the shed, up to the 4-8-4 Northern at 5%.

Which class do we unlock first?

## Post: meme (08-meme-firebox.png) (54/280)
sold your $COAL?

nothing comes back out of a firebox.

## Post: tiap burn (09-template-burn.png) (123/280)
Into the fire: [JUMLAH] $COAL.

Ticket No. [NOMOR]. Gone for good at 0x…dEaD.

[LINK TX]
