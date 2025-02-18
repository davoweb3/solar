from src.server.client import ZerePyClient

client = ZerePyClient("https://68d9866a-1538-480e-be0c-46ed068365af-00-3gc9i41hvoaqm.riker.replit.dev/agentscd..")

# List available agents
agents = client.list_agents()

# Load an agent
client.load_agent("house1")

# List connections
connections = client.list_connections()

# Execute an action
client.perform_action(
    connection="anthropic",
    action="generate-text",
    params=["Tell me a joke", "You are a helpful AI assistant"]
)

# Start/stop agent loop
client.start_agent()
client.stop_agent()