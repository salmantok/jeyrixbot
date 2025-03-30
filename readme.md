# jeyrixbot

jeyrixbot dibuat menggunakan [Google Apps Script](https://script.google.com) dan terintegrasi dengan [Telegram Bot API](https://core.telegram.org/bots/api). Fungsi utama bot ini adalah untuk meneruskan pesan dari pengguna ke admin dan sebaliknya, serta mendukung fitur broadcast.

## Konfigurasi Awal

1. **Buat Bot Telegram** melalui [@BotFather](https://t.me/BotFather) dan dapatkan TOKEN.
2. **Dapatkan ADMIN_IDS** dengan mengirim pesan ke [@getinfomyidbot](https://t.me/getinfomyidbot).
3. **Buat Google Spreadsheet** dan salin SHEET_ID dari URL-nya.
4. **Pasang Webhook** dengan menjalankan fungsi `setWebhook()` dan mengganti `YOUR_WEBHOOK_URL` dengan URL Apps Script Anda.

## Struktur Kode

### Variabel Utama

- `TOKEN`: Token bot Telegram.
- `ADMIN_IDS`: ID admin bot.
- `SHEET_ID`: ID spreadsheet untuk menyimpan daftar pengguna.

### Fungsi Utama

#### `doPost(e)`

- Menerima dan memproses pesan yang dikirim ke bot.
- Jika pesan berasal dari pengguna, pesan diteruskan ke admin.
- Jika admin membalas pesan pengguna, balasan dikirim langsung tanpa label "Diteruskan dari".
- Jika admin mengirim broadcast, pesan dikirim ke semua pengguna.

#### `forwardMessage(toChatId, fromChatId, messageId)`

- Meneruskan pesan dari pengguna ke admin dengan label "Diteruskan dari".

#### `copyMessage(toChatId, fromChatId, messageId)`

- Menyalin pesan tanpa label "Diteruskan dari".

#### `sendBroadcast(messageId)`

- Mengirim pesan ke semua pengguna yang terdaftar di spreadsheet.

#### `sendMessage(chatId, text)`

- Mengirim pesan teks ke chat tertentu.

#### `setWebhook()`

- Memasang webhook untuk menghubungkan bot dengan Google Apps Script.

## Cara Menggunakan

1. **Tambahkan bot ke chat pribadi Anda.**
2. **Gunakan bot sebagai pengguna:** Kirim pesan ke bot, pesan akan diteruskan ke admin.
3. **Gunakan bot sebagai admin:**
   - Balas pesan pengguna untuk mengirim pesan kembali.
   - Kirim pesan langsung untuk broadcast ke semua pengguna.

## Log Aktivitas

- Setiap pesan yang diterima atau dikirim akan dicatat dengan `Logger.log()` untuk debugging.

## Catatan

- Bot hanya menerima pesan dari chat pribadi.
- Pastikan webhook sudah aktif agar bot dapat menerima pesan secara real-time.
- Broadcast memiliki jeda 1 detik per pengguna untuk menghindari pembatasan Telegram.
