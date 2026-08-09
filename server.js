// ============================================
// AI CHATBOT - SAB KUCH EK FILE MEIN
// Arpit Fashion Store Demo
// ============================================
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// YAHAN SHOP KI JANKARI DAALO (naya client ke liye sirf ye badlega)
// ============================================
const SHOP_INFO = `
Tum "Arpit Fashion Store" ke liye ek helpful chatbot ho.

Shop ki jankari:
- Naam: Arpit Fashion Store
- Address: MG Road, Indore
- Timing: Subah 10 baje se raat 8 baje tak, Sunday band
- Products: Men's aur Women's clothing - shirts, jeans, kurta, sarees
- Price range: Shirts ₹499-999, Jeans ₹799-1499, Kurta ₹599-1299
- Delivery: Nahi, sirf store visit karke khareed sakte hain
- Contact: 98765-43210

Rules:
1. Sirf isi shop se related sawalon ke jawab do
2. Agar koi unrelated sawal puche, to politely mana kar do aur shop ke topic par le aao
3. Hamesha Hindi mein, dosti wale, chhote jawab do
`;

// ============================================
// WIDGET (chat bubble design) - HTML/CSS/JS ek string ke roop mein
// ============================================
const WIDGET_HTML = `
<style>
  #chatbot-bubble { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background: #4f46e5; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 999999; font-size: 28px; }
  #chatbot-window { position: fixed; bottom: 90px; right: 20px; width: 320px; max-width: 90vw; height: 450px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); display: none; flex-direction: column; z-index: 999999; overflow: hidden; font-family: Arial, sans-serif; }
  #chatbot-header { background: #4f46e5; color: white; padding: 14px; font-weight: bold; }
  #chatbot-messages { flex: 1; padding: 12px; overflow-y: auto; background: #f9fafb; }
  .chatbot-msg { margin-bottom: 10px; padding: 8px 12px; border-radius: 10px; max-width: 80%; font-size: 14px; line-height: 1.4; }
  .chatbot-msg.user { background: #4f46e5; color: white; margin-left: auto; }
  .chatbot-msg.bot { background: #e5e7eb; color: #111; }
  #chatbot-input-area { display: flex; border-top: 1px solid #e5e7eb; }
  #chatbot-input { flex: 1; border: none; padding: 12px; font-size: 14px; outline: none; }
  #chatbot-send { background: #4f46e5; color: white; border: none; padding: 0 16px; cursor: pointer; }
</style>
<div id="chatbot-bubble">💬</div>
<div id="chatbot-window">
  <div id="chatbot-header">Hume kuch poochiye 👋</div>
  <div id="chatbot-messages"></div>
  <div id="chatbot-input-area">
    <input id="chatbot-input" type="text" placeholder="Apna sawal type karein..." />
    <button id="chatbot-send">Send</button>
  </div>
</div>
<script>
  const bubble = document.getElementById("chatbot-bubble");
  const chatWindow = document.getElementById("chatbot-window");
  const messagesDiv = document.getElementById("chatbot-messages");
  const input = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("chatbot-send");

  bubble.addEventListener("click", () => {
    chatWindow.style.display = chatWindow.style.display === "flex" ? "none" : "flex";
  });

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = "chatbot-msg " + sender;
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    input.value = "";
    addMessage("Type ho raha hai...", "bot");
    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      messagesDiv.removeChild(messagesDiv.lastChild);
      addMessage(data.reply || "Maaf kijiye, jawab nahi mil paaya.", "bot");
    } catch (err) {
      messagesDiv.removeChild(messagesDiv.lastChild);
      addMessage("Connection mein dikkat aayi, dobara try karein.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
  addMessage("Namaste! Main aapki kaise madad kar sakta hoon?", "bot");
</script>
`;

// Demo page - isi par widget dikhega testing ke liye
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Arpit Fashion Store</title></head><body>
    <h1 style="font-family:Arial;color:#4f46e5;margin:60px;">Arpit Fashion Store - Demo</h1>
    ${WIDGET_HTML}
  </body></html>`);
});

// Chat endpoint - customer ka message yahan aata hai
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "Message khali nahi ho sakta" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key set nahi hai server par" });

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SHOP_INFO}\n\nCustomer ka sawal: ${userMessage}\n\nJawab do:` }] }],
        }),
      }
    );

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error("Gemini API error:", data);
      return res.status(500).json({ error: "AI se jawab lene mein dikkat aayi" });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf kijiye, jawab nahi mil paaya.";
    res.json({ reply: aiReply });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Kuch galat ho gaya" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chal raha hai port ${PORT} par`));
