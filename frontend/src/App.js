import React, { useState, useEffect, useRef } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CasinoIcon from "@mui/icons-material/Casino";
import Tooltip from "@mui/material/Tooltip";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

// Register chart.js components
ChartJS.register(Title, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale);

const MAX_PRODUCTION = 5;
const MAX_DEFICIT = 2;

// Weather impact on production
const weatherImpact = {
  sunny: 1,
  windy: 0.8,
  foggy: 0.4,
  rainy: 0.0,
};

// Wallet addresses
const walletAddresses = {
  H1: "0xE860ADA0513Cd6490684BC23e04B27E410DE84FC",
  H2: "0x9ac8253474Ea11CcadE156324A4cD36B60773511",
  H3: "0x5EFF96BE67aa638E17Fef1Aa682038E8B9F77CC6",
  H4: "0xEa35dE96dAC85be0BE9af15EC71a4978a3070b46",
  PublicGrid: "0x2BD22357d36c99EF3aE117D7cD4170A2Ea30B98A",
};

// SonicScan constants
const SONIC_API_KEY = "ZKT31GHIWB4NYI12CIVBJREQX18FYPYGCS";
const SONIC_CONTRACT = "0xA77884FE9B83C678689b98E877b2a2D5bAF53497"; // your testnet token
const SONIC_DECIMALS = 18; // assuming 18 decimals

// Simple power factor calculation
function calculatePowerFactor(voltage, current) {
  const realPower = voltage * current;
  const apparentPower = voltage * current;
  return realPower / apparentPower;
}

// Generate initial house data
function generateInitialData(production) {
  const voltage = 110;
  const current = 10;
  return Array.from({ length: 4 }, (_, i) => {
    const powerFactor = calculatePowerFactor(voltage, current);
    return {
      house: `H${i + 1}`,
      generation: production,
      consumption: 0,
      voltage: voltage.toFixed(1),
      powerFactor: powerFactor.toFixed(2),
    };
  });
}

const App = () => {
  const [weather, setWeather] = useState("sunny");
  const [production, setProduction] = useState(MAX_PRODUCTION * weatherImpact[weather]);
  const [data, setData] = useState(generateInitialData(production));
  const [response, setResponse] = useState("");

  // AI Thoughts
  const [agentThoughts, setAgentThoughts] = useState("");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // House & PublicGrid balances
  const [houseBalances, setHouseBalances] = useState({
    H1: null,
    H2: null,
    H3: null,
    H4: null,
    PublicGrid: null, // <-- Se agregó el balance para PublicGrid
  });

  // Cuánta energía está comprando el Public Grid (si el comprador es la dirección dada)
  const [publicGridEnergyPurchase, setPublicGridEnergyPurchase] = useState(null);

  // Dirección a verificar
  const AI_BUYER_ADDRESS = "0x2BD22357d36c99EF3aE117D7cD4170A2Ea30B98A".toLowerCase();

  // Send data to backend
  const sendDataToBackend = async (updatedData) => {
    try {
      const result = await axios.post("https://fronandbackend-d6h7.onrender.com/api/simulation", {
        data: updatedData,
        weather,
      });
      setResponse(result.data.publicGridAction);
    } catch (error) {
      console.error("Error sending data to backend:", error);
    }
  };

  // Fetch single wallet balance
  async function fetchSonicBalance(address) {
    try {
      const url = `https://api-testnet.sonicscan.org/api?module=account&action=tokenbalance&contractaddress=${SONIC_CONTRACT}&address=${address}&tag=latest&apikey=${SONIC_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== "1" || !data.result) {
        return null;
      }
      const rawBalance = data.result;
      const balanceNum = Number(rawBalance);
      if (Number.isNaN(balanceNum)) {
        return null;
      }
      const formatted = balanceNum / 10 ** SONIC_DECIMALS;
      return formatted;
    } catch (err) {
      console.error("Error fetching from SonicScan:", err);
      return null;
    }
  }

  // Fetch all house balances every 30s
  async function fetchAllHouseBalances() {
    try {
      const newBal = { ...houseBalances };
      newBal.H1 = await fetchSonicBalance(walletAddresses.H1);
      newBal.H2 = await fetchSonicBalance(walletAddresses.H2);
      newBal.H3 = await fetchSonicBalance(walletAddresses.H3);
      newBal.H4 = await fetchSonicBalance(walletAddresses.H4);
      // Agregamos el fetch del saldo de PublicGrid
      newBal.PublicGrid = await fetchSonicBalance(walletAddresses.PublicGrid);

      setHouseBalances(newBal);
    } catch (error) {
      console.error("Error fetching all house balances:", error);
    }
  }

  useEffect(() => {
    // fetch house balances on mount
    fetchAllHouseBalances();
    // fetch every 30 seconds
    const intervalId = setInterval(fetchAllHouseBalances, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Update production when weather changes
  useEffect(() => {
    const newProduction = MAX_PRODUCTION * weatherImpact[weather];
    setProduction(newProduction);
    setData((prevData) =>
      prevData.map((item) => ({ ...item, generation: newProduction }))
    );
    const newData = generateInitialData(newProduction);
    sendDataToBackend(newData);
  }, [weather]);

  // WebSocket for AI thoughts
  useEffect(() => {
    const connectWebSocket = () => {
      wsRef.current = new WebSocket(
        "wss://0aee8286-0749-43b8-a437-d76ce96c1bd5-00-2ivxja85pn4h0.spock.replit.dev/"
      );

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
          let parsedData = null;

          try {
            parsedData = JSON.parse(event.data);
          } catch (err) {
            console.error("Can't parse JSON...:", err);
          }

          // Revisamos si el JSON tiene las propiedades buyer y energyPurchased
          // y si coincide con la dirección que queremos (AI_BUYER_ADDRESS).
          if (parsedData && parsedData.buyer && parsedData.energyPurchased) {
            if (parsedData.buyer.toLowerCase() === AI_BUYER_ADDRESS) {
              setPublicGridEnergyPurchase(parsedData.energyPurchased);
            } else {
              // Si el buyer no es el que buscamos, no mostramos compra
              setPublicGridEnergyPurchase(null);
            }
          } else {
            // Si no viene nada relevante, limpiamos
            setPublicGridEnergyPurchase(null);
          }

          // Ajustamos el campo agentThoughts
          if (parsedData?.ai_decision) {
            newMessage = parsedData.ai_decision;
          } else if (parsedData?.thoughts) {
            newMessage = parsedData.thoughts;
          } else if (parsedData) {
            newMessage = JSON.stringify(parsedData, null, 2);
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
          retryTimeoutRef.current = setTimeout(
            () => setRetryCount((prev) => prev + 1),
            delay
          );
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

  // Randomize consumption
  const handleReset = () => {
    const scenarios = [
      data.map((item) => ({
        ...item,
        generation: 5,
        consumption: 7,
        voltage: "110.0",
        powerFactor: calculatePowerFactor(110, 10).toFixed(2),
      })),
      data.map((item) => ({
        ...item,
        generation: production,
        consumption: 0,
        voltage: "110.0",
        powerFactor: calculatePowerFactor(110, 10).toFixed(2),
      })),
      data.map((item) => ({
        ...item,
        generation: production,
        consumption: Math.floor(Math.random() * (production + MAX_DEFICIT + 1)),
        voltage: "110.0",
        powerFactor: calculatePowerFactor(110, 10).toFixed(2),
      })),
    ];

    const newData = scenarios[Math.floor(Math.random() * scenarios.length)];
    setData(newData);
    sendDataToBackend(newData);
  };

  // Net energy balance
  const totalNetEnergy = data.reduce(
    (acc, item) => acc + (item.generation - item.consumption),
    0
  );

  // Chart data
  const chartData = {
    labels: data.map((item) => item.house),
    datasets: [
      {
        label: "Energy Consumption (kWh)",
        data: data.map((item) => item.consumption),
        backgroundColor: "rgba(81, 237, 9, 0.88)",
        borderColor: "rgb(71, 233, 63)",
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Energy Consumptions per House",
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
    <Box sx={{ p: 4, maxWidth: "1200px", margin: "auto", display: "flex", gap: 8 }}>
      {/* LEFT COLUMN */}
      <Box sx={{ width: "60%" }}>
        <h1
          style={{
            textAlign: "center",
            fontSize: "24px",
            fontWeight: "bold",
            fontFamily: "'Digital-7', monospace",
          }}
        >
          <img
            src="https://soniclabs.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F446f093d-6887-4cff-aaf8-7dc7beff2728%2F7b59c280-bdb3-4d5e-b4d9-21e009c389db%2FFullLogo_Sonic_Black.png?id=2658f549-7374-4b93-9b7c-37fb660b8469&table=block&spaceId=446f093d-6887-4cff-aaf8-7dc7beff2728&width=2000&userId=&cache=v2"
            alt="Logo Solar"
            style={{ verticalAlign: "middle", marginRight: "8px", width: "100px", height: "40px" }}
          />
          Solarmetrics Panel
        </h1>

        {/* Weather selection */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, my: 2 }}>
          <ToggleButtonGroup
            value={weather}
            exclusive
            onChange={(_, newWeather) => {
              if (newWeather !== null) setWeather(newWeather);
            }}
            aria-label="weather selection"
          >
            <ToggleButton value="sunny">☀️ Day</ToggleButton>
            {/* <ToggleButton value="windy">💨 Windy</ToggleButton>
            <ToggleButton value="foggy">🌫️ Foggy</ToggleButton> */}
            <ToggleButton value="rainy">🌙 Night</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Production / Balance info */}
        <h2
          style={{
            textAlign: "center",
            fontSize: "20px",
            margin: "16px 0",
            fontFamily: "'Digital-7', monospace",
          }}
        >
          Net Energy Production per House: {production.toFixed(2)} kWh
        </h2>
        <h2
          style={{
            textAlign: "center",
            fontSize: "20px",
            margin: "16px 0",
            fontFamily: "'Digital-7', monospace",
          }}
        >
          Net Energy Balance : {totalNetEnergy.toFixed(2)} kWh
        </h2>

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            mt: 3,
          }}
        >
          {/* PUBLIC GRID METER */}
          <Box
            sx={{
              position: "relative",
              width: "150px",
              minHeight: "380px", // un poco más alto para acomodar el texto
              border: "2px solid #ccc",
              borderRadius: "10px",
              background: "linear-gradient(180deg, #b6fcb6 0%, #48c774 100%)",
              boxShadow: "inset 0 0 6px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 1,
              zIndex: 2,
            }}
          >
            {/* RANDOMIZE button */}
            <Box
              sx={{
                position: "absolute",
                top: "-64px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <Tooltip title="Randomize Consumption">
                <Button
                  onClick={handleReset}
                  variant="contained"
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    minWidth: 0,
                    backgroundColor: "#c0392b",
                    "&:hover": {
                      backgroundColor: "#e74c3c",
                    },
                  }}
                >
                  <CasinoIcon fontSize="medium" />
                </Button>
              </Tooltip>
            </Box>

            {/* Meter Header */}
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                borderBottom: "1px solid rgba(0,0,0,0.2)",
                pb: 1,
                mt: 4,
                color: "#073c07",
                fontFamily: "'Digital-7', monospace",
              }}
            >
              <span style={{ fontSize: "1.2rem", marginRight: "4px" }}>⚡</span>
              <span style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                PUBLIC GRID METER
              </span>
            </Box>

            {/* Status */}
            <Box
              sx={{
                mt: 2,
                width: "90%",
                border: "2px inset rgba(0,0,0,0.25)",
                backgroundColor: "rgba(255,255,255,0.8)",
                p: 1,
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "1rem",
                color: "#333",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                {totalNetEnergy > 0
                  ? " I am Buying Energy"
                  : totalNetEnergy < 0
                  ? "I am Selling Energy"
                  : "System Balanced"}
              </div>
            </Box>

            {/* Mostrar el balance en SOLARS */}
            <Box
              sx={{
                mt: 2,
                fontSize: "0.85rem",
                textAlign: "center",
                color: "#073c07",
                fontWeight: "bold",
                width: "100%",
                padding: "4px",
                fontFamily: "'Digital-7', monospace",
              }}
            >
              Balance:{" "}
              {houseBalances.PublicGrid !== null
                ? `${houseBalances.PublicGrid.toLocaleString()} SOLARS`
                : "N/A"}
            </Box>

            {/* Si está comprando energía del comprador indicado */}
            {publicGridEnergyPurchase && (
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  textAlign: "center",
                  fontSize: "0.8rem",
                  fontFamily: "'Digital-7', monospace",
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderRadius: 2,
                  color: "#333",
                }}
              >
                Comprando {publicGridEnergyPurchase} kWh
                <br />
                de <strong>{AI_BUYER_ADDRESS}</strong>
              </Box>
            )}

            {/* Wallet */}
            <Box
              sx={{
                mt: 2,
                fontSize: "0.65rem",
                textAlign: "center",
                color: "#073c07",
                fontWeight: "bold",
                width: "100%",
                padding: "4px",
              }}
            >
               Agent Wallet: <br />
              0x2BD22357d36c99EF3aE11<br/>
              7D7cD4170A2Ea30B98A
            </Box>
          </Box>

          {/* SONICMETER CARDS (H1..H4) */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {data.map((item) => {
              const difference = item.generation - item.consumption;
              let balanceStatus = "";
              let balanceColor = "#e74c3c";

              if (difference > 0) {
                balanceStatus = `Surplus: ${difference.toFixed(2)} kWh`;
                balanceColor = "#2ecc71";
              } else if (difference < 0) {
                balanceStatus = `Deficit: ${Math.abs(difference).toFixed(2)} kWh`;
                balanceColor = "#e74c3c";
              } else {
                balanceStatus = "Balanced";
                balanceColor = "#7f8c8d";
              }

              return (
                <Box
                  key={`${item.house}-${weather}`}
                  sx={{
                    width: "230px",
                    minHeight: "330px",
                    border: "3px solid #2c3e50",
                    borderRadius: "12px",
                    background: "linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%)",
                    boxShadow:
                      "0 4px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.9)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 2,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Decorative Panel */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                      clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        width: "15px",
                        height: "15px",
                        background: "#ffd700",
                        borderRadius: "50%",
                      },
                    }}
                  />

                  {/* Meter Header */}
                  <Box
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      borderBottom: "2px solid #3498db",
                      pb: 1,
                      mb: 2,
                      fontFamily: "'Digital-7', monospace",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "1rem",
                        color: "#2c3e50",
                        textShadow: "1px 1px 1px rgba(255,255,255,0.8)",
                      }}
                    >
                      SONICMETER
                    </span>
                    <br />
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#7f8c8d",
                        letterSpacing: "1px",
                      }}
                    >
                      SDM72DR-SOLAR
                    </span>
                  </Box>

                  {/* Digital Display - Generation */}
                  <Box
                    sx={{
                      width: "90%",
                      border: "3px solid #95a5a6",
                      borderRadius: "8px",
                      background: "linear-gradient(180deg, #2c3e50 0%, #34495e 100%)",
                      p: 2,
                      textAlign: "center",
                      fontFamily: "'Digital-7', monospace",
                      position: "relative",
                      mb: 2,
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                      },
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.4rem",
                        fontWeight: "bold",
                        color: "#2ecc71",
                        textShadow: "0 0 5px rgba(46,204,113,0.5)",
                      }}
                    >
                      {Number(item.generation).toFixed(1)} kWh
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#bdc3c7",
                        marginTop: "4px",
                      }}
                    >
                      (Solar Generation)
                    </div>
                  </Box>

                  {/* Digital Display - Consumption */}
                  <Box
                    sx={{
                      width: "90%",
                      border: "3px solid #95a5a6",
                      borderRadius: "8px",
                      background: "linear-gradient(180deg, #2c3e50 0%, #34495e 100%)",
                      p: 2,
                      textAlign: "center",
                      fontFamily: "'Digital-7', monospace",
                      position: "relative",
                      mb: 2,
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                      },
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.4rem",
                        fontWeight: "bold",
                        color: "#e67e22",
                        textShadow: "0 0 5px rgba(230,126,34,0.5)",
                      }}
                    >
                      {Number(item.consumption).toFixed(1)} kWh
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#bdc3c7",
                        marginTop: "4px",
                      }}
                    >
                      (Consumption)
                    </div>
                  </Box>

                  {/* Balance (replacing Voltage) */}
                  <Box
                    sx={{
                      width: "90%",
                      fontSize: "0.8rem",
                      color: "#34495e",
                      textAlign: "center",
                      mb: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        backgroundColor: "rgba(52,152,219,0.1)",
                        borderRadius: "4px",
                      }}
                    >
                      <span>Balance:</span>
                      <span>
                        {houseBalances[item.house] === null
                          ? "N/A"
                          : houseBalances[item.house].toLocaleString()}{" "}
                        SOLARS
                      </span>
                    </div>
                  </Box>

                  {/* Surplus / Deficit / Balanced */}
                  <Box
                    sx={{
                      mt: 1,
                      p: 1,
                      backgroundColor: "rgba(231,76,60,0.1)",
                      borderRadius: "4px",
                      color: balanceColor,
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      textAlign: "center",
                    }}
                  >
                    {balanceStatus}
                  </Box>

                  {/* House Wallet */}
                  <Box
                    sx={{
                      mt: 2,
                      fontSize: "0.75rem",
                      color: "#7f8c8d",
                      textAlign: "center",
                      width: "100%",
                      padding: "4px",
                      borderTop: "1px solid #ecf0f1",
                    }}
                  >
                    Wallet: {walletAddresses[item.house]}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* RIGHT COLUMN */}
      <Box sx={{ width: "60%" }}>
        {/* Bar chart */}
        <Box sx={{ height: "300px" }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>

        {/* Panel: Agent Thoughts only */}
        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
          {/* Agent Thoughts panel */}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <img
                src="https://i.ibb.co/QjXxKKbb/openai.gif"
                alt="logo"
                style={{ width: "100px", height: "50px" }}
              />
              <h3 style={{ fontWeight: "bold", margin: 0, fontFamily: "'Digital-7', monospace" }}>
                Main Agent Thoughts "It could take a while...mode:GPT-4"
              </h3>
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
        </Box>

        {/* Pie de página con el enlace */}
        <footer style={{ marginTop: "20px", textAlign: "center" }}>
          <a
            href="https://testnet.sonicscan.org/token/0xa77884fe9b83c678689b98e877b2a2d5baf53497"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#007bff",
              textDecoration: "none",
              fontFamily: "'Digital-7', monospace",
              fontWeight: "bold",
            }}
          >
            Check TX on Sonic Blaze
          </a>
        </footer>
      </Box>
    </Box>
  );
};

export default App;
