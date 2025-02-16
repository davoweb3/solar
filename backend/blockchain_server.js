// blockchainServer.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors");

const bcApp = express();
const bcServer = http.createServer(bcApp);
const bcWss = new WebSocket.Server({ server: bcServer });

bcApp.use(bodyParser.json());
bcApp.use(cors());

// Endpoint para recibir webhooks de blockchain
bcApp.post("/webhook", (req, res) => {
  const eventData = req.body;
  console.log("[BLOCKCHAIN] Webhook event received:", eventData);

  // Reenviamos a los clientes WebSocket conectados a este server
  bcWss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // Indicamos un type para que el frontend sepa que es info de blockchain
      client.send(JSON.stringify({ type: "blockchain_tx", payload: eventData }));
    }
  });

  res.status(200).json({ message: "OK - Webhook event" });
});

// WebSocket para FRONTEND
bcWss.on("connection", (ws) => {
  console.log("[BLOCKCHAIN SERVER] Frontend connected via WS");
  ws.on("message", (msg) => {
    console.log("[BLOCKCHAIN SERVER] Message received:", msg);
  });
});

// Health-check endpoint
bcApp.get("/health-check", (req, res) => {
  res.status(200).send("Blockchain server is healthy");
});

// Iniciar el servidor de blockchain en el puerto 3002
const PORT_BC = process.env.PORT_BC || 3002;
bcServer.listen(PORT_BC, () => {
  console.log(`Blockchain server listening on port ${PORT_BC}`);
});
