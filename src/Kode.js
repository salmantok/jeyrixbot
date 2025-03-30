const TOKEN = '';
const ADMIN_IDS = ['']; // Pastikan tidak ada string kosong
const SHEET_ID = '';

function doPost(e) {
  if (!e || !e.postData) {
    Logger.log('⚠️ Tidak ada data masuk.');
    return ContentService.createTextOutput('No data');
  }

  const data = JSON.parse(e.postData.contents);
  Logger.log('📩 Data diterima: ' + JSON.stringify(data));

  const message = data.message || data.edited_message;
  if (!message) {
    Logger.log('⚠️ Tidak ada pesan dalam data.');
    return ContentService.createTextOutput('No message');
  }

  const chatId = String(message.chat.id);
  const chatType = message.chat.type;
  const messageId = message.message_id;
  const replyToMessage = message.reply_to_message;

  // Hanya menerima pesan dari chat pribadi
  if (chatType !== 'private') {
    Logger.log(`🚫 Pesan dari ${chatType} (${chatId}) diabaikan.`);
    return ContentService.createTextOutput(
      'Bot hanya menerima pesan dari chat pribadi.'
    );
  }

  // Ambil daftar pengguna dari Google Spreadsheet
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const users = sheet
    .getDataRange()
    .getValues()
    .map((row) => String(row[0]));

  // Tambahkan pengguna baru jika belum terdaftar
  if (!ADMIN_IDS.includes(chatId) && !users.includes(chatId)) {
    sheet.appendRow([chatId]);
  }

  // Jika admin membalas pesan pengguna
  if (ADMIN_IDS.includes(chatId) && replyToMessage) {
    const match = replyToMessage.text
      ? replyToMessage.text.match(/👤 ID: (\d+)/)
      : null;
    if (match) {
      const userId = match[1];
      copyMessage(userId, chatId, messageId); // Menggunakan copyMessage agar tidak ada label "Diteruskan dari"
      sendMessage(chatId, `✅ Pesan dikirim ke ${userId}`);
      Logger.log(`✅ Admin ${chatId} membalas pengguna ${userId}`);
      return;
    }
  }

  // Jika admin mengirim broadcast
  if (ADMIN_IDS.includes(chatId)) {
    sendBroadcast(messageId);
    sendMessage(chatId, '✅ Pesan dikirim ke semua pengguna.');
    Logger.log(`📢 Admin ${chatId} mengirim pesan ke semua pengguna.`);
    return;
  }

  // Jika pengguna mengirim pesan ke bot, diteruskan ke admin
  if (!ADMIN_IDS.includes(chatId)) {
    ADMIN_IDS.forEach((adminId) => {
      forwardMessage(adminId, chatId, messageId);
      sendMessage(
        adminId,
        `📩 Pesan dari pengguna:
👤 ID: ${chatId}`
      );
    });
    Logger.log(`📨 Pesan dari ${chatId} diteruskan ke semua admin.`);
  }
}

// Fungsi untuk meneruskan pesan pengguna ke admin (mempertahankan format)
function forwardMessage(toChatId, fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${TOKEN}/forwardMessage`;
  const payload = {
    method: 'post',
    payload: {
      chat_id: String(toChatId),
      from_chat_id: String(fromChatId),
      message_id: messageId,
    },
  };
  UrlFetchApp.fetch(url, payload);
}

// Fungsi untuk menyalin pesan dari admin ke pengguna tanpa label "Diteruskan dari"
function copyMessage(toChatId, fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${TOKEN}/copyMessage`;
  const payload = {
    method: 'post',
    payload: {
      chat_id: String(toChatId),
      from_chat_id: String(fromChatId),
      message_id: messageId,
    },
  };
  UrlFetchApp.fetch(url, payload);
}

// Fungsi untuk mengirim broadcast ke semua pengguna tanpa "Diteruskan dari"
function sendBroadcast(messageId) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const users = sheet
    .getDataRange()
    .getValues()
    .map((row) => String(row[0]));

  users.forEach((userId) => {
    if (userId && !ADMIN_IDS.includes(userId)) {
      try {
        copyMessage(userId, ADMIN_IDS, messageId);
        Logger.log(`📢 Pesan dikirim ke ${userId}`);
        Utilities.sleep(1000);
      } catch (e) {
        Logger.log(`❌ Gagal mengirim ke ${userId}: ${e.message}`);
      }
    }
  });
  Logger.log('📢 Pesan berhasil dikirim ke semua pengguna.');
}

// Fungsi untuk mengirim pesan teks
function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    method: 'post',
    payload: {
      chat_id: String(chatId),
      text: text,
    },
  };
  UrlFetchApp.fetch(url, payload);
}

// Fungsi untuk memasang webhook
function setWebhook() {
  const url = 'YOUR_WEBHOOK_URL';
  const apiUrl = `https://api.telegram.org/bot${TOKEN}/setWebhook?url=${url}`;
  UrlFetchApp.fetch(apiUrl);
  Logger.log('✅ Webhook telah dipasang.');
}
