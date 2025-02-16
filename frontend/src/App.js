import React, { useState, useEffect, useRef } from "react";
import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const MAX_PRODUCTION = 5;
const MAX_DEFICIT = 2;

const weatherImpact = {
  sunny: 1,
  windy: 0.8,
  foggy: 0.4,
  rainy: 0.3,
};

// Mapeo de direcciones (se usan solo las address)
const walletAddresses = {
  H1: "0x...84FC",
  H2: "0x...3511",
  H3: "0x...7CC6",
  H4: "0x...0b46",
  PublicGrid: "0x...B98A",
};

function calculatePowerFactor(voltage, current) {
  const realPower = voltage * current;
  const apparentPower = voltage * current;
  return realPower / apparentPower;
}

function generateInitialData(production) {
  const voltage = 110;
  const current = 10;
  return Array.from({ length: 4 }, (_, i) => {
    const powerFactor = calculatePowerFactor(voltage, current);
    return {
      house: `H${i + 1}`,
      generation: production,
      consumption: Math.floor(Math.random() * (7 - 4 + 1)) + 4,
      voltage: voltage.toFixed(1),
      powerFactor: powerFactor.toFixed(2),
    };
  });
}

const App = () => {
  // Estados principales
  const [weather, setWeather] = useState("sunny");
  const [production, setProduction] = useState(MAX_PRODUCTION * weatherImpact[weather]);
  const [data, setData] = useState(generateInitialData(production));
  const [response, setResponse] = useState("");

  // WebSocket para el AI Agent
  const [agentThoughts, setAgentThoughts] = useState("");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Transacciones de Sonic
  const [sonicTransactions, setSonicTransactions] = useState([]);

  // Función para enviar data al backend
  const sendDataToBackend = async (updatedData) => {
    try {
      const result = await axios.post("http://localhost:3001/api/simulation", {
        data: updatedData,
        weather,
      });
      setResponse(result.data.publicGridAction);
    } catch (error) {
      console.error("Error sending data to backend:", error);
    }
  };

  // Al cambiar el clima
  useEffect(() => {
    const newProduction = MAX_PRODUCTION * weatherImpact[weather];
    setProduction(newProduction);
    setData((prevData) =>
      prevData.map((item) => ({ ...item, generation: newProduction }))
    );
    const newData = generateInitialData(newProduction);
    sendDataToBackend(newData);
  }, [weather]);

  // WebSocket para el AI Agent
  useEffect(() => {
    const connectWebSocket = () => {
      wsRef.current = new WebSocket("ws://192.168.10.93:8765");

      wsRef.current.onopen = () => {
        console.log("WebSocket Online");
        setAgentThoughts("WebSocket Connection Established. Waiting for Data...");
        setRetryCount(0);
      };

      wsRef.current.onmessage = (event) => {
        console.log("Message Received (raw):", event.data);
        setTransitionState("fade-out");
        setTimeout(() => {
          let newMessage = event.data;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.ai_decision) newMessage = parsed.ai_decision;
            else if (parsed.thoughts) newMessage = parsed.thoughts;
            else newMessage = JSON.stringify(parsed, null, 2);
          } catch (err) {
            console.error("Can't parse JSON...:", err);
          }
          setAgentThoughts(newMessage);
          setTransitionState("fade-in");
        }, 300);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setAgentThoughts("WebSocket events cannot be retrieved.");
      };

      wsRef.current.onclose = (evt) => {
        console.log("WebSocket Connection Closed:", evt.code, evt.reason);
        setAgentThoughts("WebSocket Connection Closed.");
        const MAX_RETRIES = 5;
        if (retryCount < MAX_RETRIES) {
          const delay = (retryCount + 1) * 2000;
          console.log(`Intentando reconectar en ${delay} ms...`);
          retryTimeoutRef.current = setTimeout(() => setRetryCount((prev) => prev + 1), delay);
        } else {
          console.warn("Max attempts reached.");
        }
      };
    };

    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [retryCount]);

  // Transacciones de Sonic (simuladas)
  const handleGetSonicTransactions = async () => {
    try {
      const mockTx = [
        { id: 1, from: "Alice", to: "Bob", amount: "10 KW" },
        { id: 2, from: "Charlie", to: "Dave", amount: "5 KW" },
      ];
      setSonicTransactions(mockTx);
    } catch (error) {
      console.error("Error retrieving transactions on Sonic Network:", error);
      setSonicTransactions([]);
    }
  };

  // Handlers
  const handleWeatherChange = (event, newWeather) => {
    if (newWeather !== null) setWeather(newWeather);
  };

  const handleSliderChange = (index, newValue) => {
    setData((prevData) => {
      const newData = [...prevData];
      newData[index].consumption = newValue;
      sendDataToBackend(newData);
      return newData;
    });
  };

  const handleReset = () => {
    const newData = generateInitialData(production);
    setData(newData);
    sendDataToBackend(newData);
  };

  // Cálculo del balance
  const totalNetEnergy = data.reduce(
    (acc, item) => acc + (item.generation - item.consumption),
    0
  );
  const publicGridAction =
    totalNetEnergy < 0
      ? `Buying ${Math.abs(totalNetEnergy).toFixed(2)} kWh from Public Grid`
      : totalNetEnergy > 0
      ? `Selling ${totalNetEnergy.toFixed(2)} kWh to Public Grid`
      : "Sistem On Balance";

  // Color del cable
  let cableColor = "black";
  if (totalNetEnergy > 0) cableColor = "red";
  else if (totalNetEnergy < 0) cableColor = "green";

  // Gráfica
  const chartData = {
    labels: data.map((item) => item.house),
    datasets: [
      {
        label: "Energy Consumption (kWh)",
        data: data.map((item) => item.consumption),
        backgroundColor: "rgba(64, 11, 255, 0.2)",
        borderColor: "rgb(63, 80, 233)",
        borderWidth: 1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Egergy Consumptions per House",
        font: { size: 20 },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.raw} kWh`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: "Houses" },
      },
      y: {
        stacked: true,
        title: { display: true, text: "Energy Consumption (kWh)" },
        ticks: { beginAtZero: true },
      },
    },
  };

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: "1200px",
        margin: "auto",
        display: "flex",
        gap: 4,
      }}
    >
      {/* Columna Izquierda */}
      <Box sx={{ width: "60%" }}>
        <h1 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
          Solarmetrics Panel
        </h1>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, my: 2 }}>
          <ToggleButtonGroup
            value={weather}
            exclusive
            onChange={handleWeatherChange}
            aria-label="weather selection"
          >
            <ToggleButton value="sunny">☀️ Sunny</ToggleButton>
            <ToggleButton value="windy">🌬️ Windy</ToggleButton>
            <ToggleButton value="foggy">🌫️ Foggy</ToggleButton>
            <ToggleButton value="rainy">🌧️ Rainy</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <h2 style={{ textAlign: "center", fontSize: "20px", margin: "16px 0" }}>
          Net Energy Production per House: {production.toFixed(2)} kWh
        </h2>
        <h2 style={{ textAlign: "center", fontSize: "20px", margin: "16px 0" }}>
          Net Energy Balance : {totalNetEnergy.toFixed(2)} kWh
        </h2>

        {/* FILA: Medidor Público y 4 medidores */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 4,
            mt: 3,
          }}
        >
          {/* Medidor Público */}
          <Box
            sx={{
              width: "230px",
              minHeight: "330px",
              border: "2px solid #ccc",
              borderRadius: "6px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 1,
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                borderBottom: "1px solid #ccc",
                pb: 0.5,
              }}
            >
              <span style={{ color: "green", fontSize: "1.2rem", marginRight: "4px" }}>
                ⚡
              </span>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                Public Energy Network Meter
              </span>
            </Box>
            <Box
              sx={{
                mt: 1,
                width: "90%",
                border: "2px inset #999",
                backgroundColor: "#fafafa",
                p: 1,
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "1rem",
                color: "#333",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                {publicGridAction}
              </div>
            </Box>
            {/* Wallet para Public Grid */}
            <Box
              sx={{
                mt: 1,
                fontSize: "0.75rem",
                textAlign: "center",
                color: "#777",
              }}
            >
              Agent Wallet: {walletAddresses.PublicGrid}
            </Box>
          </Box>

          {/* Grid de 4 medidores individuales */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {data.map((item, index) => {
              const deficit =
                item.consumption > item.generation
                  ? (item.consumption - item.generation).toFixed(2)
                  : 0;
              return (
                <Box
                  key={`${item.house}-${weather}`}
                  sx={{
                    width: "230px",
                    minHeight: "330px",
                    border: "2px solid #ccc",
                    borderRadius: "6px",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      borderBottom: "1px solid #ccc",
                      pb: 0.5,
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                      SONICMETER
                    </span>
                    <br />
                    <span style={{ fontSize: "0.7rem", color: "#666" }}>
                      SDM72DR
                    </span>
                  </Box>

                  <Box
                    sx={{
                      mt: 1,
                      width: "90%",
                      border: "2px inset #999",
                      backgroundColor: "#fafafa",
                      p: 1,
                      textAlign: "center",
                      fontFamily: "monospace",
                      fontSize: "1.1rem",
                      color: "#333",
                    }}
                  >
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      {Number(item.generation).toFixed(1)} kWh
                    </div>
                    <div style={{ fontSize: "0.7rem", marginTop: "4px" }}>
                      (Currently Generated)
                    </div>
                  </Box>

                  <Box
                    sx={{
                      mt: 1,
                      fontSize: "0.75rem",
                      textAlign: "center",
                      color: "#444",
                      lineHeight: 1.4,
                    }}
                  >
                    <div>Volts: {item.voltage} V</div>
                    <div>Power Factor: {item.powerFactor}</div>
                    <div>Comsuption Rate: {item.consumption.toFixed(2)} kWh</div>
                  </Box>

                  <Slider
                    value={item.consumption}
                    min={0}
                    max={item.generation + MAX_DEFICIT}
                    step={1}
                    onChange={(e, val) => handleSliderChange(index, val)}
                    sx={{ width: "90%", mt: 1 }}
                  />

                  {item.consumption > item.generation && (
                    <Box
                      sx={{
                        color: "red",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        mt: 1,
                      }}
                    >
                      Energy Deficit!: {deficit} kWh
                    </Box>
                  )}

                  {/* Para la caja SONICMETER (H1) se muestra explícitamente la wallet */}
                  {item.house === "H1" && (
                    <Box
                      sx={{
                        mt: 1,
                        fontSize: "0.75rem",
                        textAlign: "center",
                        color: "#777",
                      }}
                    >
                      Agent 1 Wallet: 0x...84FC
                    </Box>
                  )}

                  {/* Para H2, H3 y H4 se muestra la wallet del objeto */}
                  {item.house !== "H1" && (
                    <Box
                      sx={{
                        mt: 1,
                        fontSize: "0.80rem",
                        textAlign: "center",
                        color: "#777",
                      }}
                    >
                      Agent Wallet: {walletAddresses[item.house]}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Botón para Reiniciar (doble ancho) */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReset}
            sx={{ width: "460px", fontSize: "0.85rem", px: 3, py: 1 }}
          >
            RANDOMIZE CONSUMPTION
          </Button>
        </Box>
      </Box>

      {/* Columna Derecha: Chart, IA y Sonic */}
      <Box sx={{ width: "60%" }}>
        <Box sx={{ height: "300px" }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
          {/* Panel IA */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              border: "1px solid #ccc",
              borderRadius: 2,
              backgroundColor: "#fafafa",
              minHeight: "200px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/128/3483/3483127.png" // Reemplaza con la ruta real de tu logo
                alt="logo"
                style={{ width: "30px", height: "30px" }}
              />
              <h3 style={{ fontWeight: "bold", margin: 0 }}>Main Agent Tougths "It could take a while..."</h3>
            </Box>
            <Box
  sx={{
    minHeight: "60px",
    border: "1px solid #ddd",
    borderRadius: 1,
    p: 1,
    backgroundColor: "#fff",
    whiteSpace: "pre-wrap",
    transition: "opacity 0.3s ease-in-out",
  }}
>
  {transitionState === "fade-out" || !agentThoughts ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <span>Thinking...</span>
      <span role="img" aria-label="brain">
        🧠
      </span>
    </Box>
  ) : (
    agentThoughts
  )}
</Box>
          </Box>

          {/* Panel Sonic */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              border: "1px solid #ccc",
              borderRadius: 2,
              backgroundColor: "#fafafa",
              minHeight: "200px",
            }}
          >
            <h3 style={{ fontWeight: "bold" }}>
              Blockchain TXs....
            </h3>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleGetSonicTransactions}
              sx={{ mb: 2 }}
            >Get Transactions
            </Button>
            <Box
              sx={{
                minHeight: "60px",
                border: "1px solid #ddd",
                borderRadius: 1,
                p: 1,
                backgroundColor: "#fff",
              }}
            >
              {sonicTransactions.length > 0 ? (
                <ul>
                  {sonicTransactions.map((tx) => (
                    <li key={tx.id}>
                      <strong>ID:</strong> {tx.id} | <strong>From:</strong> {tx.from} |{" "}
                      <strong>To:</strong> {tx.to} | <strong>Amount:</strong> {tx.amount}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No Transactions so far...</p>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default App;
