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

  // Net energy balance calculation (only for debugging, not sent to AI)
  const totalNetEnergy = data.reduce(
    (acc, item) => acc + (item.generation - item.consumption),
    0
  );

  // Payload to send to AI - Only raw data, NO publicGridAction
  const aiPayload = {
    weather,
    houses: data, // Houses' energy data (generation, consumption, etc.)
  };

  // Log received data
  logData('Received data from frontend', { weather, data });
  logData('Calculated Net Energy (for debugging only)', { totalNetEnergy });

  // Send data to AI agent via WebSocket (without Public Grid bias)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(aiPayload));
    }
  });

  res.status(200).json({ message: 'Data processed successfully' });
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
