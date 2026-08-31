const FETCH_URL = "https://raw.githubusercontent.com/BaconHub1/websitelogin/main/testing";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1476804690833444934/qykVQu3SMeRR_qnM7aLjm9nYtCzgyLBTGLbM0ZBD11DLpT5ryBoqLYV57QkmYZ32UgWj";

let allowed = new Set();
let previousLines = null; // null = first load → sync silently

async function refreshCredentials() {
  try {
    const res = await fetch(FETCH_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    const text = await res.text();

    console.log("Fetched content:", text || "[empty]");

    const currentLines = new Set(text.split('\n').map(l => l.trim()).filter(Boolean));

    if (previousLines === null) {
      // First load: add all existing silently (no webhook spam)
      previousLines = currentLines;
      currentLines.forEach(line => {
        const lower = line.toLowerCase();
        const uIdx = lower.indexOf('username:');
        const pIdx = lower.indexOf('password:');
        if (uIdx >= 0 && pIdx > uIdx) {
          let username = line.slice(uIdx + 9, pIdx).trim().replace(/[^a-z0-9]/gi, '');
          let password = line.slice(pIdx + 9).trim().replace(/[^a-z0-9]/gi, '');
          if (username && password) allowed.add(`${username}:${password}`);
        }
      });
      console.log("First sync - loaded", allowed.size, "existing pairs (no webhooks)");
    } else {
      // Detect **new** lines only
      const added = [...currentLines].filter(line => !previousLines.has(line));
      added.forEach(line => {
        const lower = line.toLowerCase();
        const uIdx = lower.indexOf('username:');
        const pIdx = lower.indexOf('password:');
        if (uIdx >= 0 && pIdx > uIdx) {
          let username = line.slice(uIdx + 9, pIdx).trim().replace(/[^a-z0-9]/gi, '');
          let password = line.slice(pIdx + 9).trim().replace(/[^a-z0-9]/gi, '');
          if (username && password) {
            console.log("New credential:", username, ":", password);
            sendToWebhook("🆕 New Credential Added", 0xffff00, username, password);
            allowed.add(`${username}:${password}`);
          }
        }
      });

      // Detect **deleted** lines
      const removed = [...previousLines].filter(line => !currentLines.has(line));
      removed.forEach(line => {
        const lower = line.toLowerCase();
        const uIdx = lower.indexOf('username:');
        const pIdx = lower.indexOf('password:');
        if (uIdx >= 0 && pIdx > uIdx) {
          let username = line.slice(uIdx + 9, pIdx).trim().replace(/[^a-z0-9]/gi, '');
          let password = line.slice(pIdx + 9).trim().replace(/[^a-z0-9]/gi, '');
          if (username && password) {
            console.log("Removed credential:", username, ":", password);
            sendToWebhook("🗑️ Credential Removed", 0xff4444, username, password);
            allowed.delete(`${username}:${password}`);
          }
        }
      });
    }

    previousLines = currentLines;

    document.getElementById('status-msg').textContent = 
      `Loaded ${allowed.size} valid pairs • ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error("Fetch error:", err.message);
    document.getElementById('status-msg').textContent = 
      `Failed to load: ${err.message}. Check console (F12).`;
  }
}

refreshCredentials();
setInterval(refreshCredentials, 2000); // Every 2 seconds

function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function sendToWebhook(title, color, user = "N/A", pass = "N/A") {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: title,
          color: color,
          fields: [
            { name: "Username", value: user, inline: true },
            { name: "Password", value: pass, inline: true },
            { name: "Detected", value: new Date().toLocaleString(), inline: true },
            { name: "Browser", value: navigator.userAgent.substring(0, 100), inline: false }
          ],
        }]
      })
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
  }
}

function checkCredentials() {
  const user = document.getElementById('username-input').value.trim();
  const pass = document.getElementById('pass-input').value.trim();
  const errorMsg = document.getElementById('error-msg');

  if (allowed.has(`${user}:${pass}`)) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    showTab('kahoot'); // Show first tab by default
  } else {
    errorMsg.textContent = "Invalid username or password.";
    setTimeout(() => errorMsg.textContent = "", 3000);
  }
}

function openFullscreenAboutBlank(url) {
  if (!url) return;

  const newWindow = window.open('about:blank', '_blank');

  if (!newWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to use this feature.');
    return;
  }

  const doc = newWindow.document;
  doc.body.style.margin = '0';
  doc.body.style.padding = '0';
  doc.body.style.overflow = 'hidden';
  doc.title = 'New Tab';

  const iframe = doc.createElement('iframe');
  iframe.src = url;
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.margin = '0';
  iframe.style.padding = '0';
  iframe.style.display = 'block';

  doc.body.appendChild(iframe);
}
      docEl.webkitRequestFullscreen();
    } else if (docEl.msRequestFullscreen) { 
      docEl.msRequestFullscreen();
    }
  } else {
    alert('Popup blocked! Please allow popups for this site to use this feature.');
  }
}

window.addEventListener('beforeunload', function(event) {
  event.preventDefault();
  event.returnValue = '';
});
