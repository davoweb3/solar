// Backend for Microgrid Simulation
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(cors());

// Function to log data to the console
const logData = (message, data) => {
  console.log(`\n[LOG] ${message}`);
  console.log(JSON.stringify(data, null, 2));
};

// Endpoint to receive real-time data from the frontend
app.post('/api/simulation', (req, res) => {
  const { data, weather } = req.body;

  // Net energy balance calculation
  const totalNetEnergy = data.reduce(
    (acc, item) => acc + (item.generation - item.consumption),
    0
  );

  // Determine action with the public grid
  const publicGridAction = totalNetEnergy < 0
    ? `Purchase of ${Math.abs(totalNetEnergy).toFixed(2)} kWh from the Public Grid`
    : totalNetEnergy > 0
    ? `Sale of ${totalNetEnergy.toFixed(2)} kWh to the Public Grid`
    : 'Perfect Energy Balance (No purchase or sale)';

  // Complete data for the AI Agent
  const aiPayload = {
    weather,
    totalNetEnergy,
    publicGridAction,
    houses: data,
    publicGrid: {
      balance: totalNetEnergy,
      status: publicGridAction
    }
  };

  // Log received data and public grid actions
  logData('Received data from frontend', { weather, data });
  logData('Public grid action', { publicGridAction });

  // Send complete data to the AI agent via WebSocket
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(aiPayload));
    }
  });

  res.status(200).json({ message: 'Data processed successfully', publicGridAction });
});

// WebSocket for real-time communication with the AI agent
wss.on('connection', (ws) => {
  console.log('[AI AGENT] Connected');
  ws.on('message', (message) => {
    console.log('[AI AGENT] Message received:', message);
  });
});

// Health-check endpoint
app.get('/health-check', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
