const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Proxy route — forwards request to API Gateway
app.post("/api/chat", async (req, res) => {
  const apiUrl = process.env.API_GATEWAY_URL;

  if (!apiUrl) {
    return res.status(500).json({ error: "API_GATEWAY_URL is not configured." });
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Failed to reach API Gateway." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
