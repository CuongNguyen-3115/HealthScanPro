// server.js
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = 5000;

// Cho phép frontend gọi từ web/mobile
app.use(cors());
app.use(bodyParser.json());

// Endpoint chính
app.post("/chat", async (req, res) => {
  try {
    const { message, profile } = req.body;
    console.log("📩 Nhận message từ client:", message);
    console.log("📑 Hồ sơ nhận được:", profile);

    // API key của Gemini
    const apiKey = process.env.GEMINI_API_KEY;

    // Gọi Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Hồ sơ bệnh án: ${JSON.stringify(profile)} \n\nCâu hỏi: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Lỗi khi gọi Gemini API:", errorText);
      return res.json({ reply: "⚠️ Lỗi khi gọi Gemini API" });
    }

    const data = await response.json();
    const botReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Bot không trả lời";

    console.log("🤖 Trả lời từ Gemini:", botReply);

    res.json({ reply: botReply });
  } catch (err) {
    console.error("🔥 Lỗi server:", err);
    res.json({ reply: "❌ Bot lỗi server" });
  }
});

// Lắng nghe từ mọi thiết bị trong mạng LAN
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server Gemini chạy tại http://localhost:${PORT}`);
});

