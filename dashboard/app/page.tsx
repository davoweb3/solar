"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js"
import axios from "axios"
import { Network, Dice1Icon as Dice, Sun, Cloud, Moon, Bot, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// Register chart.js components
ChartJS.register(Title, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale)

const MAX_PRODUCTION = 5
const MAX_DEFICIT = 2

// Weather impact on production
const weatherImpact = {
  sunny: 1,
  foggy: 0.4,
  night: 0.0,
}

// Wallet addresses
const walletAddresses = {
  H1: "0xE860ADA0513Cd6490684BC23e04B27E410DE84FC",
  H2: "0x9ac8253474Ea11CcadE156324A4cD36B60773511",
  H3: "0x5EFF96BE67aa638E17Fef1Aa682038E8B9F77CC6",
  H4: "0xEa35dE96dAC85be0BE9af15EC71a4978a3070b46",
  PublicGrid: "0x2BD22357d36c99EF3aE117D7cD4170A2Ea30B98A",
}

// SonicScan constants
const SONIC_API_KEY = "ZKT31GHIWB4NYI12CIVBJREQX18FYPYGCS"
const SONIC_CONTRACT = "0xA77884FE9B83C678689B98E877b2a2D5bAF53497" // your testnet token
const SONIC_DECIMALS = 18 // assuming 18 decimals

// Simple power factor calculation
function calculatePowerFactor(voltage: number, current: number) {
  const realPower = voltage * current
  const apparentPower = voltage * current
  return realPower / apparentPower
}

// Generate initial house data
function generateInitialData(production: number) {
  const voltage = 110
  const current = 10
  return Array.from({ length: 4 }, (_, i) => {
    const powerFactor = calculatePowerFactor(voltage, current)
    return {
      house: `H${i + 1}`,
      generation: production,
      consumption: 0,
      voltage: voltage.toFixed(1),
      powerFactor: powerFactor.toFixed(2),
    }
  })
}

type HouseData = {
  house: string
  generation: number
  consumption: number
  voltage: string
  powerFactor: string
}

type HouseBalances = {
  H1: number | null
  H2: number | null
  H3: number | null
  H4: number | null
  PublicGrid: number | null
}

export default function SolarDashboard() {
  const [weather, setWeather] = useState<"sunny" | "foggy" | "night">("sunny")
  const [production, setProduction] = useState(MAX_PRODUCTION * weatherImpact[weather])
  const [data, setData] = useState<HouseData[]>(generateInitialData(production))
  const [response, setResponse] = useState("")
  
  // Track if weather change is from initial load or user interaction
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [weatherChangedAfterInitialLoad, setWeatherChangedAfterInitialLoad] = useState(false)

  // AI Thoughts
  const [agentThoughts, setAgentThoughts] = useState("")
  const [transitionState, setTransitionState] = useState("fade-in")
  const [retryCount, setRetryCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // House & PublicGrid balances
  const [houseBalances, setHouseBalances] = useState<HouseBalances>({
    H1: null,
    H2: null,
    H3: null,
    H4: null,
    PublicGrid: null,
  })

  // Cuánta energía está comprando el Public Grid (si el comprador es la dirección dada)
  const [publicGridEnergyPurchase, setPublicGridEnergyPurchase] = useState<number | null>(null)

  // Dirección a verificar
  const AI_BUYER_ADDRESS = "0x2BD22357d36c99EF3aE117D7cD4170A2Ea30B98A".toLowerCase()

  const { toast } = useToast()
  const [buttonCooldown, setButtonCooldown] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Popup state
  const [showPopup, setShowPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ x: 'calc(50% - 250px)', y: 'calc(50% - 250px)' })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const popupRef = useRef(null)
  
  // Track the last scenario index used
  const [lastScenarioIndex, setLastScenarioIndex] = useState(-1)
  
  // Typewriter effect state
  const [typewriterText, setTypewriterText] = useState("")
  
  // Theme state
  const [theme, setTheme] = useState("default") // "default" or "green"
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "default" ? "green" : "default")
  }

  // Send data to backend
  const sendDataToBackend = useCallback(
    async (updatedData: HouseData[]) => {
      try {
        console.log("Sending data to backend API")
        const result = await axios.post("https://fronandbackend-d6h7.onrender.com/api/simulation", {
          data: updatedData,
          weather,
        })
        setResponse(result.data.publicGridAction)
      } catch (error) {
        console.error("Error sending data to backend:", error)
      }
    },
    [weather],
  )

  // Fetch single wallet balance
  async function fetchSonicBalance(address: string) {
    try {
      const url = `https://api-testnet.sonicscan.org/api?module=account&action=tokenbalance&contractaddress=${SONIC_CONTRACT}&address=${address}&tag=latest&apikey=${SONIC_API_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.status !== "1" || !data.result) {
        return null
      }
      const rawBalance = data.result
      const balanceNum = Number(rawBalance)
      if (Number.isNaN(balanceNum)) {
        return null
      }
      const formatted = balanceNum / 10 ** SONIC_DECIMALS
      return formatted
    } catch (err) {
      console.error("Error fetching from SonicScan:", err)
      return null
    }
  }

  // Fetch all house balances every 30s
  async function fetchAllHouseBalances() {
    try {
      // Create a new object instead of spreading the current state
      const newBal = {
        H1: null,
        H2: null,
        H3: null,
        H4: null,
        PublicGrid: null,
      }

      // Fetch all balances
      newBal.H1 = await fetchSonicBalance(walletAddresses.H1)
      newBal.H2 = await fetchSonicBalance(walletAddresses.H2)
      newBal.H3 = await fetchSonicBalance(walletAddresses.H3)
      newBal.H4 = await fetchSonicBalance(walletAddresses.H4)
      newBal.PublicGrid = await fetchSonicBalance(walletAddresses.PublicGrid)

      // Only update state if we have at least one valid balance
      if (
        newBal.H1 !== null ||
        newBal.H2 !== null ||
        newBal.H3 !== null ||
        newBal.H4 !== null ||
        newBal.PublicGrid !== null
      ) {
        // Use functional update to ensure we're working with the latest state
        setHouseBalances((prevBalances) => {
          // Merge previous balances with new ones, keeping previous values if new ones are null
          return {
            H1: newBal.H1 !== null ? newBal.H1 : prevBalances.H1,
            H2: newBal.H2 !== null ? newBal.H2 : prevBalances.H2,
            H3: newBal.H3 !== null ? newBal.H3 : prevBalances.H3,
            H4: newBal.H4 !== null ? newBal.H4 : prevBalances.H4,
            PublicGrid: newBal.PublicGrid !== null ? newBal.PublicGrid : prevBalances.PublicGrid,
          }
        })
      }
    } catch (error) {
      console.error("Error fetching all house balances:", error)
    }
  }

  useEffect(() => {
    // fetch house balances on mount
    fetchAllHouseBalances()
    // fetch every 30 seconds
    const intervalId = setInterval(fetchAllHouseBalances, 30000)
    return () => clearInterval(intervalId)
  }, []) // Removed fetchAllHouseBalances from dependency array

  // Handle weather change
  const handleWeatherChange = (value: string) => {
    if (value) {
      setWeather(value as "sunny" | "foggy" | "night")
      
      // Mark that weather has been changed by user interaction
      if (isInitialLoad) {
        setIsInitialLoad(false)
      } else {
        setWeatherChangedAfterInitialLoad(true)
      }
    }
  }

  // Update production when weather changes, but only send data if not initial load
  useEffect(() => {
    const newProduction = MAX_PRODUCTION * weatherImpact[weather]
    setProduction(newProduction)
    setData((prevData) => prevData.map((item) => ({ ...item, generation: newProduction })))
    
    // Only send data if weather was changed by user after initial load
    if (weatherChangedAfterInitialLoad) {
      console.log("Weather changed by user, sending data")
      sendDataToBackend(generateInitialData(newProduction))
      setWeatherChangedAfterInitialLoad(false)
    }
  }, [weather, sendDataToBackend, weatherChangedAfterInitialLoad])

  // WebSocket for AI thoughts
  useEffect(() => {
    const connectWebSocket = () => {
      wsRef.current = new WebSocket("https://03d7-210-211-61-125.ngrok-free.app/")

      wsRef.current.onopen = () => {
        console.log("WebSocket Online")
        setAgentThoughts("WebSocket Connection Established. Waiting for Data...")
        setRetryCount(0)
      }

      wsRef.current.onmessage = (event) => {
        console.log("Message Received (raw):", event.data)
        setTransitionState("fade-out")

        setTimeout(() => {
          let newMessage = event.data
          let parsedData = null

          try {
            parsedData = JSON.parse(event.data)
          } catch (err) {
            console.error("Can't parse JSON...:", err)
          }

          // Revisamos si el JSON tiene las propiedades buyer y energyPurchased
          // y si coincide con la dirección que queremos (AI_BUYER_ADDRESS).
          if (parsedData && parsedData.buyer && parsedData.energyPurchased) {
            if (parsedData.buyer.toLowerCase() === AI_BUYER_ADDRESS) {
              setPublicGridEnergyPurchase(parsedData.energyPurchased)
            } else {
              // Si el buyer no es el que buscamos, no mostramos compra
              setPublicGridEnergyPurchase(null)
            }
          } else {
            // Si no viene nada relevante, limpiamos
            setPublicGridEnergyPurchase(null)
          }

          // Ajustamos el campo agentThoughts
          if (parsedData?.ai_decision) {
            newMessage = parsedData.ai_decision
          } else if (parsedData?.thoughts) {
            newMessage = parsedData.thoughts
          } else if (parsedData) {
            newMessage = JSON.stringify(parsedData, null, 2)
          }

          setAgentThoughts(newMessage)
          setTransitionState("fade-in")
        }, 300)
      }

      wsRef.current.onerror = (error) => {
        console.error("WebSocket Error:", error)
        setAgentThoughts("WebSocket events cannot be retrieved.")
      }

      wsRef.current.onclose = (evt) => {
        console.log("WebSocket Connection Closed:", evt.code, evt.reason)
        setAgentThoughts("WebSocket Connection Closed.")
        const MAX_RETRIES = 5
        if (retryCount < MAX_RETRIES) {
          const delay = (retryCount + 1) * 2000
          console.log(`Intentando reconectar en ${delay} ms...`)
          retryTimeoutRef.current = setTimeout(() => setRetryCount((prev) => prev + 1), delay)
        } else {
          console.warn("Max attempts reached.")
        }
      }
    }

    connectWebSocket()
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [retryCount])

  // Randomize consumption
  const handleReset = () => {
    if (buttonCooldown) {
      toast({
        title: "Action limited",
        description: "Ups, you can only randomize once every 30 secs for this demo!",
        variant: "destructive",
        action: <ToastAction altText="OK">OK</ToastAction>,
      })
      return
    }

    const scenarios = [
      // Scenario 1: High consumption (7 kWh for all houses)
      data.map((item) => ({
        ...item,
        generation: production,
        consumption: 7,
        voltage: "110.0",
        powerFactor: calculatePowerFactor(110, 10).toFixed(2),
      })),
      // Scenario 2: Zero consumption (0 kWh for all houses)
      data.map((item) => ({
        ...item,
        generation: production,
        consumption: 0,
        voltage: "110.0",
        powerFactor: calculatePowerFactor(110, 10).toFixed(2),
      })),
      // Scenario 3: Random consumption for each house
      data.map((item) => ({
        ...item,
        generation: production,
        consumption: Math.floor(Math.random() * (production + MAX_DEFICIT + 1)),
        voltage: "110.0",
        powerFactor: calculatePowerFactor(110, 10).toFixed(2),
      })),
    ]

    // Select a scenario that's different from the last one used
    let scenarioIndex;
    do {
      scenarioIndex = Math.floor(Math.random() * scenarios.length);
    } while (scenarioIndex === lastScenarioIndex && scenarios.length > 1);
    
    // Update the last scenario index
    setLastScenarioIndex(scenarioIndex);
    
    const newData = scenarios[scenarioIndex];
    setData(newData);
    
    // This is explicitly triggered by user button click, so we send the data
    sendDataToBackend(newData);
    console.log(`Button clicked, sending randomized data to API (Scenario ${scenarioIndex + 1})`);

    // Start cooldown
    setButtonCooldown(true);
    setCooldownRemaining(5);

    // Set up the countdown timer
    const startTime = Date.now();
    const endTime = startTime + 5000;

    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      setCooldownRemaining(remaining);

      if (remaining <= 0) {
        setButtonCooldown(false);
        setCooldownRemaining(0);
        if (cooldownTimerRef.current) {
          clearInterval(cooldownTimerRef.current);
        }
      }
    }, 1000);
  }

  // Toggle Popup
  const togglePopup = () => {
    setShowPopup(!showPopup)
    // Reset position when opening
    if (!showPopup) {
      setPopupPosition({ x: 'calc(50% - 250px)', y: 'calc(50% - 250px)' })
    }
  }
  
  // Popup dragging handlers
  const handleMouseDown = (e) => {
    if (popupRef.current && e.target.closest('.drag-handle')) {
      setIsDragging(true)
      const boundingRect = popupRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - boundingRect.left,
        y: e.clientY - boundingRect.top
      })
      e.preventDefault() // Prevent text selection during drag
    }
  }
  
  const handleMouseMove = useCallback((e) => {
    if (isDragging && popupRef.current) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      setPopupPosition({
        x: `${newX}px`,
        y: `${newY}px`
      })
    }
  }, [isDragging, dragOffset])
  
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
    }
  }, [isDragging])
  
  // Add and remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Net energy balance
  const totalNetEnergy = data.reduce((acc, item) => acc + (item.generation - item.consumption), 0)
  
  // Green theme CSS
  const greenThemeStyles = `
    body, .dark {
      background-color: #000000 !important; 
      color: #00FF00 !important;
      font-family: "Courier New", Courier, monospace !important;
    }
    
    .bg-\\[\\#0F1318\\], .bg-\\[\\#1A1D23\\], .from-\\[\\#1A1D23\\], .to-\\[\\#141619\\], .bg-\\[\\#141619\\], .bg-gradient-to-b, .border-\\[\\#2A2D35\\] {
      background-color: #003300 !important;
      background-image: none !important;
      border-color: #00FF00 !important;
    }
    
    .text-white, .text-\\[\\#9BA1A6\\], .text-\\[\\#00E67A\\], .text-\\[\\#4D9CFF\\], .text-\\[\\#FF9F1C\\] {
      color: #00FF00 !important;
    }
    
    .border-\\[\\#2A2D35\\] {
      border-color: #00FF00 !important;
    }
    
    button, .btn {
      background-color: #003300 !important;
      color: #00FF00 !important;
      border: 1px solid #00FF00 !important;
      font-family: "Courier New", Courier, monospace !important;
    }
    
    button:hover, .btn:hover {
      background-color: #005500 !important;
    }
    
    .bg-gradient-to-r {
      background-image: none !important;
      background-color: #003300 !important;
    }
    
    .bg-\\[\\#0F1318\\]\\/50 {
      background-color: #001100 !important;
    }
    
    a {
      color: #00FF00 !important;
      text-decoration: none !important;
    }
    
    a:hover {
      text-decoration: underline !important;
    }
    
    .clip-triangle {
      background-color: #005500 !important;
    }
  `

  // Chart data
  const chartData = {
    labels: data.map((item) => item.house),
    datasets: [
      {
        label: "Energy Consumption (kWh)",
        data: data.map((item) => item.consumption),
        backgroundColor: theme === "green" ? "rgba(0, 255, 0, 0.8)" : "rgba(0, 230, 122, 0.8)",
        borderColor: theme === "green" ? "rgb(0, 255, 0)" : "rgb(0, 230, 122)",
        borderWidth: 1,
      },
    ],
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Energy Consumptions per House",
        font: { size: 20 },
        color: theme === "green" ? "#00FF00" : "#ffffff",
      },
      legend: {
        labels: {
          color: theme === "green" ? "#00FF00" : "#ffffff",
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => `${tooltipItem.raw} kWh`,
        },
        backgroundColor: theme === "green" ? "#003300" : undefined,
        bodyColor: theme === "green" ? "#00FF00" : undefined,
        titleColor: theme === "green" ? "#00FF00" : undefined,
        borderColor: theme === "green" ? "#00FF00" : undefined,
        borderWidth: theme === "green" ? 1 : undefined,
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: "Houses", color: theme === "green" ? "#00FF00" : "#ffffff" },
        ticks: { color: theme === "green" ? "#00FF00" : "#ffffff" },
        grid: { color: theme === "green" ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        stacked: true,
        title: { display: true, text: "Energy Consumption (kWh)", color: theme === "green" ? "#00FF00" : "#ffffff" },
        ticks: { beginAtZero: true, color: theme === "green" ? "#00FF00" : "#ffffff" },
        grid: { color: theme === "green" ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" },
      },
    },
  }

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={`dark min-h-screen bg-[#0F1318] text-white ${theme === "green" ? "green-theme" : ""}`}>
      {/* Green Theme Styles */}
      {theme === "green" && (
        <style dangerouslySetInnerHTML={{ __html: greenThemeStyles }} />
      )}
      {/* Nebula Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div 
            ref={popupRef}
            className="absolute bg-[#1A1D23] border border-[#2A2D35] rounded-lg w-[500px] h-[500px] overflow-hidden shadow-xl pointer-events-auto"
            style={{ 
              left: popupPosition.x, 
              top: popupPosition.y,
              cursor: isDragging ? 'grabbing' : 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="p-4 flex justify-between items-center border-b border-[#2A2D35] drag-handle cursor-grab bg-gradient-to-r from-[#1A1D23] to-[#141619]">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#4D9CFF]" />
                <h2 className="text-xl font-bold text-[#4D9CFF]">AI Block Explorer</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white" 
                onClick={togglePopup}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-4 h-[440px]">
              <iframe 
                src="http://127.0.0.1:5500/nebula-block-explorer-main/index.html" 
                className="w-full h-full border-0" 
                title="Nebula Block Explorer"
              />
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6 max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-3/5">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img
                src="https://i.ibb.co/Mx6qrJ89/Full-Logo-Sonic-Black.png"
                alt="Logo Solar"
                className="w-[100px] h-[40px] invert"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00E67A] to-[#4D9CFF] bg-clip-text text-transparent">
                Solarmetrics Panel
              </h1>
            </div>

            {/* Theme Toggle Button */}
            <div className="flex justify-center mb-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleTheme}
                      className={`px-4 py-2 rounded-md ${
                        theme === "green" 
                          ? "bg-[#003300] text-[#00FF00] border border-[#00FF00]" 
                          : "bg-gradient-to-r from-[#00E67A] to-[#4D9CFF] text-white"
                      }`}
                    >
                      {theme === "green" ? "Terminal Mode" : "Default Mode"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle between default and terminal-styled mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Weather selection */}
            <div className="flex justify-center mb-6">
              <ToggleGroup 
                type="single" 
                value={weather} 
                onValueChange={handleWeatherChange}
              >
                <ToggleGroupItem value="sunny" className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Day</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="foggy" className="flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  <span>Foggy</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="night" className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Night</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Production / Balance info */}
            <div className="space-y-2 mb-6">
              <div className="text-center p-3 bg-[#1A1D23] rounded-lg border border-[#2A2D35]">
                <h2 className="text-lg font-medium text-[#00E67A]">
                  Net Energy Production per House: {production.toFixed(2)} kWh
                </h2>
              </div>
              <div className="text-center p-3 bg-[#1A1D23] rounded-lg border border-[#2A2D35]">
                <h2 className="text-lg font-medium text-[#4D9CFF]">
                  Net Energy Balance: {totalNetEnergy.toFixed(2)} kWh
                </h2>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6 mt-6">
              {/* PUBLIC GRID METER */}
              <div className="relative w-full md:w-auto">
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleReset}
                        size="icon"
                        className={`h-12 w-12 rounded-full ${
                          buttonCooldown
                            ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed"
                            : "bg-[#FF494A] hover:bg-[#FF6B6C]"
                        } relative`}
                        disabled={buttonCooldown}
                      >
                        <Dice className="h-6 w-6" />
                        {buttonCooldown && cooldownRemaining > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white text-xs font-bold">
                            {cooldownRemaining}
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Randomize Consumption</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

                <Card className="w-full md:w-[180px] bg-gradient-to-b from-[#1A1D23] to-[#141619] border-[#2A2D35]">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-full text-center border-b border-[#2A2D35] pb-2 pt-4">
                        <div className="flex items-center justify-center gap-2">
                          <Network className="h-5 w-5 text-[#00E67A]" />
                          <span className="font-bold text-sm">PUBLIC GRID METER</span>
                        </div>
                      </div>

                      <div className="w-full p-2 bg-[#0F1318] border border-[#2A2D35] rounded-md text-center">
                        <div className="text-sm font-medium">
                          {totalNetEnergy > 0
                            ? "I am Buying Energy"
                            : totalNetEnergy < 0
                              ? "I am Selling Energy"
                              : "System Balanced"}
                        </div>
                      </div>

                      <div className="text-sm text-center w-full">
                        <span className="font-medium">Balance:</span>{" "}
                        {houseBalances.PublicGrid !== null
                          ? `${houseBalances.PublicGrid.toLocaleString()} SOLARS`
                          : "N/A"}
                      </div>

                      {publicGridEnergyPurchase && (
                        <div className="text-xs text-center p-2 bg-[#0F1318] border border-[#2A2D35] rounded-md w-full">
                          Buying {publicGridEnergyPurchase} kWh
                          <br />
                          from{" "}
                          <span className="font-medium">
                            {AI_BUYER_ADDRESS.substring(0, 6)}...
                            {AI_BUYER_ADDRESS.substring(AI_BUYER_ADDRESS.length - 4)}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-center w-full mt-2">
                        <span className="font-medium">Agent Wallet:</span>
                        <br />
                        <span className="text-[#4D9CFF]">
                          {AI_BUYER_ADDRESS.substring(0, 10)}...
                          <br />
                          {AI_BUYER_ADDRESS.substring(AI_BUYER_ADDRESS.length - 10)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SONICMETER CARDS (H1..H4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {data.map((item) => {
                  const difference = item.generation - item.consumption
                  let balanceStatus = ""
                  let balanceColor = "#FF494A"

                  if (difference > 0) {
                    balanceStatus = `Surplus: ${difference.toFixed(2)} kWh`
                    balanceColor = "#00E67A"
                  } else if (difference < 0) {
                    balanceStatus = `Deficit: ${Math.abs(difference).toFixed(2)} kWh`
                    balanceColor = "#FF494A"
                  } else {
                    balanceStatus = "Balanced"
                    balanceColor = "#4D9CFF"
                  }

                  return (
                    <Card key={`${item.house}-${weather}`} className="bg-[#1A1D23] border-[#2A2D35] overflow-hidden">
                      <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-[#4D9CFF] to-[#00E67A] clip-triangle">
                        <div className="absolute top-1 right-1 w-3 h-3 bg-[#FFD700] rounded-full"></div>
                      </div>

                      <CardContent className="p-4">
                        <div className="relative border-b border-[#2A2D35] pb-2 mb-3">
                          <div className="absolute top-0 left-0">
                            <img
                              src="https://i.ibb.co/q3NJ22Hp/Ai-blanco.png"
                              alt="IA logo"
                              className="w-[40px] h-[40px]"
                            />
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-sm">SONICMETER</span>
                            <div className="text-xs text-[#9BA1A6]">SDM72DR-SOLAR</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Generation Display */}
                          <div className="p-3 bg-[#0F1318] border border-[#2A2D35] rounded-md text-center">
                            <div className="text-xl font-bold text-[#00E67A]">
                              {Number(item.generation).toFixed(1)} kWh
                            </div>
                            <div className="text-xs text-[#9BA1A6] mt-1">(Solar Generation)</div>
                          </div>

                          {/* Consumption Display */}
                          <div className="p-3 bg-[#0F1318] border border-[#2A2D35] rounded-md text-center">
                            <div className="text-xl font-bold text-[#FF9F1C]">
                              {Number(item.consumption).toFixed(1)} kWh
                            </div>
                            <div className="text-xs text-[#9BA1A6] mt-1">(Consumption)</div>
                          </div>

                          {/* Balance */}
                          <div className="flex justify-between text-xs p-2 bg-[#0F1318]/50 rounded-md">
                            <span>Balance:</span>
                            <span>
                              {houseBalances[item.house] === null ? "N/A" : houseBalances[item.house]?.toLocaleString()}{" "}
                              SOLARS
                            </span>
                          </div>

                          {/* Surplus / Deficit */}
                          <div
                            className="p-2 rounded-md text-center text-sm font-medium"
                            style={{ color: balanceColor, backgroundColor: `${balanceColor}10` }}
                          >
                            {balanceStatus}
                          </div>

                          {/* Wallet */}
                          <div className="text-xs text-[#9BA1A6] text-center pt-2 border-t border-[#2A2D35]">
                            Wallet:{" "}
                            <span className="text-[#4D9CFF]">
                              {walletAddresses[item.house].substring(0, 6)}...
                              {walletAddresses[item.house].substring(walletAddresses[item.house].length - 4)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-2/5">
            {/* Bar chart */}
            <div className="h-[300px] bg-[#1A1D23] p-4 rounded-lg border border-[#2A2D35] mb-6">
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Agent Thoughts panel */}
            <Card className="bg-[#1A1D23] border-[#2A2D35]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src="https://i.ibb.co/q3NJ22Hp/Ai-blanco.png" alt="logo" className="w-[50px] h-[50px]" />
                  <h3 className="font-bold text-sm">Main Agent Thoughts "It could take a while...mode:GPT-4"</h3>
                </div>

                <div
                  className={`min-h-[150px] p-3 bg-[#0F1318] border border-[#2A2D35] rounded-md whitespace-pre-wrap transition-opacity duration-300 ${
                    transitionState === "fade-out" ? "opacity-50" : "opacity-100"
                  }`}
                >
                  {transitionState === "fade-out" || !agentThoughts ? (
                    <div className="flex items-center gap-2">
                      <span>Thinking...</span>
                      <span role="img" aria-label="brain">
                        🧠
                      </span>
                    </div>
                  ) : (
                    agentThoughts
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Footer with Nebula Bot icon */}
            <div className="mt-6 text-center flex items-center justify-center gap-4">
              <a
                href="https://testnet.sonicscan.org/token/0xa77884fe9b83c678689b98e877b2a2d5baf53497"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4D9CFF] hover:text-[#00E67A] transition-colors font-medium"
              >
                Check TX on Sonic Blaze
              </a>
              <span className="text-gray-500">or</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#4D9CFF] hover:text-[#00E67A] bg-transparent hover:bg-[#1A1D23] h-8 w-8 rounded-full border border-[#2A2D35]"
                      onClick={togglePopup}
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Check with Nebula</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}