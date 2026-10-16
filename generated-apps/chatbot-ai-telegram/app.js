const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');

let messages = JSON.parse(localStorage.getItem('telegram_chat_history')) || [
    { sender: 'bot', text: 'Halo! Saya adalah asisten AI Telegram kamu. Sekarang kamu bisa bebas mengobrol dengan saya. Ketik "buat aplikasi [topik]" jika ingin saya membuatkan aplikasi web interaktif.' }
];

function saveHistory() {
    localStorage.setItem('telegram_chat_history', JSON.stringify(messages));
}

function renderChat() {
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender}`;
        
        let contentHtml = `<p>${escapeHtml(msg.text)}</p>`;
        
        if (msg.appData) {
            contentHtml += `
                <div class="app-preview-card">
                    <span><i class="fa-solid fa-code"></i> Aplikasi Berhasil Dibuat</span>
                    <a href="#" class="open-app-btn" onclick="openApp('${escapeHtml(msg.appData.title)}')">Buka Aplikasi</a>
                </div>
            `;
        }
        
        msgDiv.innerHTML = contentHtml;
        chatMessages.appendChild(msgDiv);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    messages.push({ sender: 'user', text: text });
    userInput.value = '';
    userInput.style.height = 'auto';
    saveHistory();
    renderChat();

    setTimeout(() => {
        processBotResponse(text);
    }, 600);
}

function processBotResponse(userText) {
    const lower = userText.toLowerCase();
    let botReply = "";
    let appData = null;

    if (lower.startsWith('buat aplikasi') || lower.startsWith('buatkan aplikasi') || lower.includes('buatkan web')) {
        const appName = userText.replace(/buatkan aplikasi|buat aplikasi|buatkan web/gi, '').trim() || 'Aplikasi Mini';
        botReply = `Baik, saya telah membuatkan aplikasi "${appName}" untuk Anda berdasarkan permintaan tersebut. Silakan klik tombol di bawah untuk membukanya.`;
        
        appData = {
            title: appName,
            code: `<!DOCTYPE html><html><head><title>${appName}</title><style>body{font-family:sans-serif;padding:20px;background:#f0f2f5;color:#333;text-align:center;} .card{background:white;padding:20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);display:inline-block;}</style></head><body><div class="card"><h2>${appName}</h2><p>Aplikasi ini dibuat khusus untuk Anda!</p><button onclick="alert('Halo dari ${appName}!')">Klik Saya</button></div></body></html>`
        };
        
        // Save app to localstorage list
        let apps = JSON.parse(localStorage.getItem('telegram_generated_apps')) || [];
        apps.push(appData);
        localStorage.setItem('telegram_generated_apps', JSON.stringify(apps));
    } else if (lower.includes('halo') || lower.includes('hai')) {
        botReply = "Halo juga! Ada yang bisa saya bantu hari ini? Mau ngobrol atau bikin aplikasi?";
    } else if (lower.includes('siapa kamu')) {
        botReply = "Saya adalah bot AI asisten Anda di Telegram. Saya bisa diajak diskusi atau membuatkan program sesuai perintah.";
    } else {
        botReply = `Menarik sekali membahas tentang "${userText}". Ceritakan lebih banyak atau ketik "buat aplikasi [topik]" jika ingin saya wujudkan dalam bentuk program web.`;
    }

    messages.push({ sender: 'bot', text: botReply, appData: appData });
    saveHistory();
    renderChat();
}

window.openApp = function(title) {
    let apps = JSON.parse(localStorage.getItem('telegram_generated_apps')) || [];
    let targetApp = apps.find(a => a.title === title);
    if (targetApp) {
        const newWindow = window.open();
        newWindow.document.write(targetApp.code);
        newWindow.document.close();
    } else {
        alert('Aplikasi tidak ditemukan.');
    }
};

sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

clearBtn.addEventListener('click', () => {
    if (confirm('Hapus semua riwayat percakapan?')) {
        messages = [{ sender: 'bot', text: 'Riwayat dibersihkan. Mari ngobrol lagi!' }];
        saveHistory();
        renderChat();
    }
});

renderChat();