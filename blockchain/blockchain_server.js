const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const puppeteer = require("puppeteer");

const bcApp = express();
const bcServer = http.createServer(bcApp);
const bcWss = new WebSocket.Server({ server: bcServer });

const SONIC_SCAN_URL = "https://testnet.sonicscan.org/address/0xA77884FE9B83C678689b98E877B2A2D5bAF53497";

// Últimas transacciones procesadas
let lastTxHashes = new Set();

async function fetchTransactions() {
    console.log("[SCRAPER] Abriendo Sonic Scan...");

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: process.env.CHROME_PATH || puppeteer.executablePath() // Usa el Puppeteer interno en Render
    });

    const page = await browser.newPage();
    await page.goto(SONIC_SCAN_URL, { waitUntil: "networkidle2" });

    console.log("[SCRAPER] Esperando a que carguen las transacciones...");

    try {
        await page.waitForSelector('table tbody tr', { timeout: 60000 });

        const transactions = await page.evaluate(() => {
            const rows = document.querySelectorAll("table tbody tr");
            let txData = [];

            rows.forEach(row => {
                const columns = row.querySelectorAll("td");
                if (columns.length < 6) return;

                const hash = columns[0]?.innerText?.trim();
                const from = columns[1]?.innerText?.trim();
                const to = columns[2]?.innerText?.trim();
                const type = columns[3]?.innerText?.trim();
                const status = columns[4]?.innerText?.trim();
                const amount = columns[5]?.innerText?.trim();

                txData.push({ hash, from, to, type, status, amount });
            });

            return txData;
        });

        await browser.close();

        // Filtrar transacciones nuevas
        const newTransactions = transactions.filter(tx => !lastTxHashes.has(tx.hash));

        if (newTransactions.length > 0) {
            console.log(`[BLOCKCHAIN] 🔥 ${newTransactions.length} nuevas transacciones detectadas.`);

            // Guardar nuevos hashes para evitar duplicados
            newTransactions.forEach(tx => lastTxHashes.add(tx.hash));

            // Enviar a WebSocket
            bcWss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "blockchain_tx", transactions: newTransactions }));
                }
            });
        } else {
            console.log("[BLOCKCHAIN] No hay nuevas transacciones.");
        }

    } catch (error) {
        console.error("[SCRAPER] ❌ Error obteniendo transacciones:", error.message);
    }
}

// 🔄 Ejecutar scraping cada 10 segundos
setInterval(fetchTransactions, 10000);

// 🔹 WebSocket para el frontend
bcWss.on("connection", (ws) => {
    console.log("[BLOCKCHAIN SERVER] Frontend conectado por WebSocket");
    ws.send(JSON.stringify({ type: "info", message: "Conectado a Blockchain TX server." }));
});

// 🔹 Health-check endpoint
bcApp.get("/health-check", (req, res) => {
    res.status(200).send("Blockchain server is healthy");
});

// 🔹 Iniciar el servidor en el puerto 3002
const PORT_BC = process.env.PORT_BC || 3002;
bcServer.listen(PORT_BC, () => {
    console.log(`✅ Blockchain server listening on port ${PORT_BC}`);
});
