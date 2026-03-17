// ============================================================
// IMPORTANT: Replace this with your API Gateway URL after deploy
// ============================================================
const API_URL = "/api/chat";
// ============================================================

let history = [];
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Hide config notice — URL is managed via env var on the server
document.getElementById("config-notice").classList.add("hidden");

// Auto-resize textarea
inputEl.addEventListener("input", () => {
  inputEl.style.height = "22px";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
  sendBtn.disabled = !inputEl.value.trim();
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

function fillInput(text) {
  inputEl.value = text;
  inputEl.dispatchEvent(new Event("input"));
  inputEl.focus();
}

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addMessage(role, text) {
  const empty = document.getElementById("empty-state");
  if (empty) empty.remove();

  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = `
        <div class="avatar ${role}">${role === "ai" ? "AI" : "you"}</div>
        <div>
          <div class="bubble">${escapeHtml(text)}</div>
          <div class="bubble-meta">${getTime()} · ${role === "ai" ? "Nova Lite via bedrock" : "you"}</div>
        </div>
      `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "msg ai";
  div.id = "typing";
  div.innerHTML = `
        <div class="avatar ai">AI</div>
        <div class="typing-bubble">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typing");
  if (el) el.remove();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

async function sendMessage() {
  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = "";
  inputEl.style.height = "22px";
  sendBtn.disabled = true;

  addMessage("user", message);
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    const data = await response.json();
    removeTyping();

    if (data.error) {
      addMessage("ai", "Error: " + data.error);
    } else {
      addMessage("ai", data.reply);
      // Update conversation history for context
      // Nova Lite requires content as array of text objects
      history.push({ role: "user", content: [{ text: message }] });
      history.push({ role: "assistant", content: [{ text: data.reply }] });
      // Keep history to last 10 turns to stay within token limits
      if (history.length > 20) history = history.slice(-20);
    }
  } catch (err) {
    removeTyping();
    addMessage(
      "ai",
      "Connection error. Make sure your API Gateway URL is configured correctly.",
    );
  }
}
