import json
import os
import sys
import asyncio
import websockets
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account
import re

# Función para guardar las transacciones en un archivo JSON local
LOG_FILE = os.path.join(os.path.dirname(_file_), "transactions_log.json")

def save_transaction_local(tx_result):
    try:
        with open(LOG_FILE, 'r') as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    data.append(tx_result)
    with open(LOG_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# -- Resto de tu configuración y lógica --

load_dotenv()

# Verifica si se especificó el archivo de configuración
if len(sys.argv) < 2:
    print("❌ Error: Debes especificar el archivo JSON de config del agente.")
    sys.exit(1)

AGENT_CONFIG_FILE = sys.argv[1]
CONFIG_PATH = os.path.abspath(AGENT_CONFIG_FILE)

if not os.path.exists(CONFIG_PATH):
    print(f"❌ Error: Config file {CONFIG_PATH} no encontrado.")
    sys.exit(1)

with open(CONFIG_PATH, "r") as f:
    config = json.load(f)

AGENT_NAME = config["name"]
PRIVATE_KEY_ENV = config["private_key_env"]
RPC_URL = config["rpc_url"]
SOLAR_TOKEN_ADDRESS = config["solar_contract"]

PRIVATE_KEY = os.getenv(PRIVATE_KEY_ENV)
if not PRIVATE_KEY:
    print(f"❌ Error: Private key {PRIVATE_KEY_ENV} no encontrada.")
    sys.exit(1)

web3 = Web3(Web3.HTTPProvider(RPC_URL))
if not web3.is_connected():
    raise ConnectionError(f"❌ {AGENT_NAME}: No se pudo conectar al RPC.")

account = web3.eth.account.from_key(PRIVATE_KEY)
AGENT_WALLET = account.address.lower()
PUBLIC_GRID_WALLET = "0x2BD22357d36c99EF3aE117D7cD4170A2Ea30B98A".lower()

SOLAR_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"}, 
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": False,
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

solar_contract = web3.eth.contract(
    address=Web3.to_checksum_address(SOLAR_TOKEN_ADDRESS), 
    abi=SOLAR_ABI
)

WEBSOCKET_URL = "ws://127.0.0.1:8765"
WEBSOCKET_URL = WEBSOCKET_URL.replace("https://", "wss://").replace("http://", "ws://")


def get_adjusted_gas_price():
    base_gas_price = web3.eth.gas_price
    return int(base_gas_price * 1.2)

def send_solar_tokens(to_address, amount):
    transaction_result = {
        "success": False,
        "txHash": None,
        "blockNumber": None,
        "gasUsed": None,
        "error": None
    }

    try:
        if not Web3.is_address(to_address):
            error_msg = f"❌ {AGENT_NAME}: Dirección inválida '{to_address}'"
            print(error_msg)
            transaction_result["error"] = error_msg
            return transaction_result

        print(f"🔄 {AGENT_NAME}: Sending {amount} SOLAR to {to_address}...")

        amount_raw = int(float(amount) * (10**18))

        tx = solar_contract.functions.transfer(
            Web3.to_checksum_address(to_address),
            amount_raw
        ).build_transaction({
            "chainId": web3.eth.chain_id,
            "nonce": web3.eth.get_transaction_count(account.address, "pending"),
            "gasPrice": get_adjusted_gas_price(),
            "from": account.address
        })

        signed_tx = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        transaction_result["txHash"] = tx_hash.hex()
        print(f"✅ {AGENT_NAME}: TX SENT OK - TxHash: {tx_hash.hex()}")

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        if receipt["status"] == 1:
            transaction_result["success"] = True
            transaction_result["blockNumber"] = receipt["blockNumber"]
            transaction_result["gasUsed"] = receipt["gasUsed"]
            print(f"✅ {AGENT_NAME}: TX confirmada - Block {receipt['blockNumber']}")
            print(f"📜 Success! - Used Gas : {receipt['gasUsed']} - Block: {receipt['blockNumber']}")
        else:
            transaction_result["error"] = "Transacción fallida en la red"
            print(f"⚠️ {AGENT_NAME}: Failed TX - Block {receipt['blockNumber']}")

    except Exception as e:
        error_msg = f"❌ {AGENT_NAME}: Error sending SOLAR - {e}"
        print(error_msg)
        transaction_result["error"] = str(e)

    return transaction_result


async def receive_orders():
    """Escucha las decisiones de IA por WebSocket."""
    async with websockets.connect(WEBSOCKET_URL) as websocket:
        print(f"🔌 {AGENT_NAME} conectado a {WEBSOCKET_URL}, waiting for IA instructions...")
        while True:
            message = await websocket.recv()
            process_transactions(message)


def process_transactions(message):
    """Procesa las transacciones indicadas por la IA."""
    try:
        data = json.loads(message)
        ai_decision = data.get("ai_decision", "")

        print(f"🔍 {AGENT_NAME} busca transacciones en la decisión IA...")
        print(f"🔍 RAW AI Decision Text: {ai_decision}")

        transactions = re.findall(
            r"Wallet (0x[a-fA-F0-9]+) sends (\d+) SOLAR to Wallet (0x[a-fA-F0-9]+) on Sonic Network\.",
            ai_decision
        )

        if not transactions:
            print(f"⚠️ {AGENT_NAME} No valid tx found.")
            return

        for sender, amount, recipient in transactions:
            sender = sender.lower()
            recipient = recipient.lower()

            if recipient == AGENT_WALLET:
                print(f"💰 {AGENT_NAME} recibe {amount} SOLAR de {sender}")

            elif sender == AGENT_WALLET:
                print(f"📩 {AGENT_NAME} inicia transacción: {amount} SOLAR → {recipient}")
                tx_result = send_solar_tokens(recipient, int(amount))

                # Crea el diccionario para la transacción
                result_data = {
                    "agent": AGENT_NAME,
                    "sender": sender,
                    "recipient": recipient,
                    "amount": amount,
                    "txHash": tx_result["txHash"],
                    "success": tx_result["success"],
                    "error": tx_result["error"],
                    "blockNumber": tx_result["blockNumber"],
                    "gasUsed": tx_result["gasUsed"]
                }
                
                # Guarda la transacción localmente en transactions_log.json
                save_transaction_local(result_data)

            elif sender == PUBLIC_GRID_WALLET and recipient == AGENT_WALLET:
                print(f"🏦 Public Grid sent {amount} SOLAR to {AGENT_NAME}")

    except json.JSONDecodeError:
        print(f"❌ {AGENT_NAME} Error: JSON inválido recibido.")


async def main():
    """Función principal del agente."""
    await receive_orders()


if _name_ == "_main_":
    print(f"🤖 Iniciando {AGENT_NAME}, waiting for IA decisions...")
    asyncio.run(main())
