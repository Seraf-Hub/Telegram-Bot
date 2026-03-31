const fetch = require("node-fetch");
const fs = require("fs");
const products = require("./products");

// 🔑 CONFIG
const telegramToken = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const affiliateTag = process.env.AFFILIATE_TAG;

// 📂 file memoria
const SENT_FILE = "sent.json";

// 🧠 carica prodotti già inviati
function loadSent() {
  try {
    return JSON.parse(fs.readFileSync(SENT_FILE));
  } catch {
    return [];
  }
}

// 💾 salva prodotti inviati
function saveSent(data) {
  fs.writeFileSync(SENT_FILE, JSON.stringify(data, null, 2));
}

// 🕒 categoria per orario
function getCategoryByHour() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return "home";
  if (hour >= 12 && hour < 18) return "tech";
  return "random";
}

// 🎯 selezione prodotto intelligente
function getProduct() {
  const sent = loadSent();
  const category = getCategoryByHour();

  let available = products;

  if (category !== "random") {
    available = products.filter(p => p.category === category);
  }

  // ❌ esclude già inviati
  let filtered = available.filter(p => !sent.includes(p.link));

  // 🔁 se finiti, reset
  if (filtered.length === 0) {
    console.log("♻️ Reset prodotti inviati");
    saveSent([]);
    filtered = available;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

// 🚀 invio prodotto
async function sendProduct() {
  const sent = loadSent();
  const product = getProduct();

  const fullLink = `${product.link}?tag=${affiliateTag}`;

  const caption = `🔥 OFFERTA IMPERDIBILE

🛍 ${product.title}

💰 ${product.price}€ invece di ${product.oldPrice}€

👉 ${fullLink}

⚡ Approfittane subito!`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: product.image,
        caption: caption
      })
    });

    const data = await res.json();

    if (data.ok) {
      console.log("✅ Inviato:", product.title);

      // 💾 salva prodotto inviato
      sent.push(product.link);
      saveSent(sent);
    } else {
      console.log("❌ Errore Telegram:", data);
    }

  } catch (err) {
    console.error("❌ Errore:", err);
  }
}

// ⏱ ogni 1 ora
setInterval(sendProduct, 3600000);

// 🚀 invio iniziale
sendProduct();

// 🌐 mini server per Render
const http = require("http");

http.createServer((req, res) => {
  res.write("Bot attivo");
  res.end();
}).listen(3000, () => {
  console.log("🌐 Server attivo sulla porta 3000");
});