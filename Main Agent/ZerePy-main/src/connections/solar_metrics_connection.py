import logging
import json
import websocket
import time
from typing import Dict, Any
from threading import Thread
from openai import OpenAI
from src.connections.base_connection import BaseConnection
from src.helpers.solar_transaction_manager import SolarTransactionManager

logger = logging.getLogger("connections.solar_metrics_connection")


class SolarMetricsConnection(BaseConnection):
    last_ai_decision = None
    ws_clients = []  

    house_wallets = {
        "H1": "0xE860ADA0513Cd6490684BC23e04B27E410DE84FC",
        "H2": "0x9ac8253474Ea11CcadE156324A4cD36B60773511",
        "H3": "0x5EFF96BE67aa638E17Fef1Aa682038E8B9F77CC6",
        "H4": "0xEa35dE96dAC85be0BE9af15EC71a4978a3070b46",
        "PublicGrid": "0x2BD22357d36c99EF3aE117D7cD4170A2Ea30B98A"
    }

    def __init__(self, config: Dict[str, Any]):
        logger.info("🌍 Initializing SolarMetrics connection...")
        self.backend_url = config.get("backend_url", "https://fronandbackend-d6h7.onrender.com/")
        self.ws_url = self.backend_url.replace("https", "wss")
        self.tx_manager = SolarTransactionManager(config)

        super().__init__(config)

        self._start_backend_websocket()
        self._start_output_websocket_server()
        self.register_actions()

    def _start_backend_websocket(self):
        """Establish WebSocket connection with backend and retry if it fails."""

        def connect():
            while True:
                try:
                    logger.info("🔗 Connecting to backend WebSocket...")
                    self.ws = websocket.WebSocketApp(
                        f"{self.ws_url}/",
                        on_message=self._on_message,
                        on_error=self._on_error,
                        on_close=self._on_close)
                    self.ws.run_forever()
                except Exception as e:
                    logger.error(f"❌ WebSocket backend error: {e}")

                logger.warning("⚠️ Backend connection lost. Retrying in 5 seconds...")
                time.sleep(5)

        thread = Thread(target=connect, daemon=True)
        thread.start()

    def _on_message(self, ws, message):
        logger.info(f"📩 Message received from backend: {message}")
        self.process_energy_data(message)

    def _on_error(self, ws, error):
        logger.error(f"❌ WebSocket backend error: {error}")

    def _on_close(self, ws, close_status_code, close_msg):
        logger.warning(f"⚠️ WebSocket backend closed: {close_msg}")

    def _start_output_websocket_server(self):
        """Launch a WebSocket server to send AI decisions in real time."""
        import asyncio
        import websockets

        async def handler(websocket, path):
            self.ws_clients.append(websocket)
            logger.info("🟢 WebSocket client connected")
            try:
                async for message in websocket:
                    pass  
            except:
                logger.warning("🔴 WebSocket client disconnected")
                self.ws_clients.remove(websocket)

        async def run_server():
            while True:
                try:
                    server = await websockets.serve(handler, "0.0.0.0", 8765, origins=None)
                    logger.info("✅ WebSocket output started at ws://0.0.0.0:8765")
                    await server.wait_closed()
                except Exception as e:
                    logger.error(f"❌ Error in WebSocket output: {e}")

                logger.warning("⚠️ WebSocket output closed. Retrying in 5 seconds...")
                await asyncio.sleep(5)

        thread = Thread(target=lambda: asyncio.run(run_server()), daemon=True)
        thread.start()

    def _broadcast_ai_decision(self, ai_decision):
        """Send AI decision to all connected WebSocket clients."""
        import asyncio
        import websockets

        async def send_message():
            if self.ws_clients:
                logger.info(f"📡 Sending Solametrics AI decisions to {len(self.ws_clients)} peers...")
                for client in self.ws_clients:
                    try:
                        await client.send(json.dumps({"ai_decision": ai_decision}))
                    except websockets.exceptions.ConnectionClosed:
                        self.ws_clients.remove(client)

        asyncio.run(send_message())

    def process_energy_data(self, data: str):
        """Process energy data with AI and structure transactions with correct wallet mappings."""
        try:
            logger.info("⚡ Processing energy data with AI...")

            ai_response = OpenAI().chat.completions.create(
                model="gpt-4",
                messages=[{
                    "role": "system",
                    "content": (
                        "You are an AI agent responsible for handling SOLAR token transactions in an energy marketplace.\n"
                        "You must correctly process transactions ensuring that:\n"
                        "- The receiver of kWh **ALWAYS** sends SOLAR tokens in return.\n"
                        "- The sender of kWh **ALWAYS** receives SOLAR tokens.\n"
                        "- If a house has extra energy, it receives SOLAR tokens from the Public Grid.\n"
                        "- If a house needs energy, it **sends** SOLAR tokens to the seller.\n"
                        "- Your final output must only contain SOLAR token transactions formatted as follows:\n"
                        "   - 'Wallet [Sender Wallet] sends [Token Amount] SOLAR to [Receiver Wallet] on Sonic Network.'\n"
                    )
                }, {
                    "role": "user",
                    "content": f"Analyze the energy flow and structure transactions using the following wallets:\n\n"
                    f"{json.dumps(self.house_wallets, indent=2)}\n\n"
                    "Example format:\n"
                    "- Wallet 0x... sends 3 SOLAR to Wallet 0x... on Sonic Network.\n"
                    "- Wallet 0x... sends 5 SOLAR to Wallet 0x... on Sonic Network.\n\n"
                    f"Analyze and generate transactions for: {data}"
                }]
            )

            ai_decision = ai_response.choices[0].message.content
            logger.info(f"🧠 AI Decision:\n{ai_decision}")

            SolarMetricsConnection.last_ai_decision = ai_decision
            self._broadcast_ai_decision(ai_decision)

            return ai_decision

        except Exception as e:
            logger.error(f"❌ OpenAI API call failed: {e}")
            return {"error": str(e)}

    def configure(self) -> bool:
        logger.info("⚙️ Configuring SolarMetrics connection...")
        return True

    def is_configured(self, verbose=False) -> bool:
        logger.info("🔍 Checking if SolarMetrics is configured...")
        return True

    @property
    def is_llm_provider(self) -> bool:
        return False

    def validate_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        required = ["backend_url"]
        missing = [field for field in required if field not in config]
        if missing:
            raise ValueError(f"Missing configuration parameters: {', '.join(missing)}")
        return config

    def register_actions(self):
        self.actions = {}
        logger.info(f"✅ Registered actions: {list(self.actions.keys())}")
