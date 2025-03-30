const TOKEN = '';
const OWNER_IDS = ['', ''];
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

  const chatId = String(message.chat.id); // Pastikan dalam bentuk string
  const chatType = message.chat.type;
  const messageId = message.message_id;
  const replyToMessage = message.reply_to_message;

  if (chatType !== 'private') {
    Logger.log(`🚫 Pesan dari ${chatType} (${chatId}) diabaikan.`);
    return ContentService.createTextOutput(
      'Bot hanya menerima pesan dari chat pribadi.'
    );
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const users = sheet
    .getDataRange()
    .getValues()
    .map((row) => String(row[0]));

  if (!OWNER_IDS.includes(chatId) && !users.includes(chatId)) {
    sheet.appendRow([chatId]);
  }

  // Jika admin membalas pesan pengguna
  if (OWNER_IDS.includes(chatId) && replyToMessage) {
    const match = replyToMessage.text
      ? replyToMessage.text.match(/👤 ID: (\d+)/)
      : null;
    if (match) {
      const userId = match[1];
      copyMessage(userId, chatId, messageId);
      sendMessage(chatId, `✅ Pesan dikirim ke ${userId}`);
      Logger.log(`✅ Admin ${chatId} membalas pengguna ${userId}`);
      return;
    }
  }

  // Jika admin mengirim broadcast
  if (OWNER_IDS.includes(chatId)) {
    sendBroadcast(messageId, chatId);
    sendMessage(chatId, '✅ Pesan dikirim ke semua pengguna.');
    Logger.log(`📢 Admin ${chatId} mengirim pesan ke semua pengguna.`);
    return;
  }

  // Jika pengguna mengirim pesan ke bot, diteruskan ke semua admin
  if (!OWNER_IDS.includes(chatId)) {
    OWNER_IDS.forEach((adminId) => {
      forwardMessage(adminId, chatId, messageId);
      sendMessage(adminId, `📩 Pesan dari pengguna:\n👤 ID: ${chatId}`);
    });
    Logger.log(`📨 Pesan dari ${chatId} diteruskan ke semua admin.`);
    return;
  }
}

// Fungsi untuk meneruskan pesan pengguna ke admin (mempertahankan format)
function forwardMessage(toChatId, fromChatId, messageId) {
  const url = 'https://api.telegram.org/bot' + TOKEN + '/forwardMessage';
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
  const url = 'https://api.telegram.org/bot' + TOKEN + '/copyMessage';
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
function sendBroadcast(messageId, senderId) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const users = sheet
    .getDataRange()
    .getValues()
    .map((row) => String(row[0]));

  users.forEach((userId) => {
    if (userId && !OWNER_IDS.includes(userId)) {
      copyMessage(userId, senderId, messageId);
      Utilities.sleep(1000);
    }
  });

  Logger.log(`📢 Pesan dari ${senderId} berhasil dikirim ke semua pengguna.`);
}

// Fungsi untuk mengirim pesan teks
function sendMessage(chatId, text) {
  const url = 'https://api.telegram.org/bot' + TOKEN + '/sendMessage';
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
  const apiUrl =
    'https://api.telegram.org/bot' + TOKEN + '/setWebhook?url=' + url;
  UrlFetchApp.fetch(apiUrl);
  Logger.log('✅ Webhook telah dipasang.');
}
