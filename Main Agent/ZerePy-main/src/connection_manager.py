import logging
from typing import Any, List, Optional, Type, Dict
from src.connections.base_connection import BaseConnection
from src.connections.anthropic_connection import AnthropicConnection
from src.connections.eternalai_connection import EternalAIConnection
from src.connections.goat_connection import GoatConnection
from src.connections.openai_connection import OpenAIConnection
from src.connections.twitter_connection import TwitterConnection
from src.connections.farcaster_connection import FarcasterConnection
from src.connections.ollama_connection import OllamaConnection
from src.connections.echochambers_connection import EchochambersConnection
from src.connections.solana_connection import SolanaConnection
from src.connections.hyperbolic_connection import HyperbolicConnection
from src.connections.galadriel_connection import GaladrielConnection
from src.connections.sonic_connection import SonicConnection
from src.connections.discord_connection import DiscordConnection
from src.connections.allora_connection import AlloraConnection
from src.connections.xai_connection import XAIConnection
from src.connections.ethereum_connection import EthereumConnection
from src.connections.solar_metrics_connection import SolarMetricsConnection

logger = logging.getLogger("connection_manager")


class ConnectionManager:
    def _init_(self, agent_config):
        self.connections: Dict[str, BaseConnection] = {}
        for config in agent_config:
            self._register_connection(config)

    def _register_connection(self, config_dic: Dict[str, Any]) -> None:
        try:
            name = config_dic["name"]
            logger.info(f"🔍 Attempting to register connection: {name}")
            connection_class = self._class_name_to_type(name)

            if connection_class is None:
                logger.error(f"❌ Unsupported connection type: {name}")
                return

            connection = connection_class(config_dic)
            self.connections[name] = connection
            logger.info(f"✅ Successfully registered connection: {name}")

        except Exception as e:
            logger.error(f"❌ Failed to initialize connection {name}: {e}")

    def _class_name_to_type(self, class_name: str) -> Optional[Type[BaseConnection]]:
        connection_map = {
            "twitter": TwitterConnection,
            "anthropic": AnthropicConnection,
            "openai": OpenAIConnection,
            "farcaster": FarcasterConnection,
            "eternalai": EternalAIConnection,
            "ollama": OllamaConnection,
            "echochambers": EchochambersConnection,
            "goat": GoatConnection,
            "solana": SolanaConnection,
            "hyperbolic": HyperbolicConnection,
            "galadriel": GaladrielConnection,
            "sonic": SonicConnection,
            "discord": DiscordConnection,
            "allora": AlloraConnection,
            "xai": XAIConnection,
            "ethereum": EthereumConnection,
            "solar_metrics": SolarMetricsConnection,
        }
        return connection_map.get(class_name)

    def get_model_providers(self) -> List[str]:
        """Get a list of all configured LLM provider connections."""
        try:
            return [
                name
                for name, conn in self.connections.items()
                if conn.is_configured() and getattr(conn, "is_llm_provider", False)
            ]
        except Exception as e:
            logger.error(f"❌ Error retrieving model providers: {e}")
            return []

    def list_actions(self, connection_name: str) -> List[str]:
        """List available actions for a given connection."""
        if connection_name not in self.connections:
            logger.error(f"❌ Connection '{connection_name}' not found.")
            return []

        connection = self.connections[connection_name]
        if hasattr(connection, "actions"):
            return list(connection.actions.keys())

        logger.warning(f"⚠️ Connection '{connection_name}' does not expose actions.")
        return []