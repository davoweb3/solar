import logging
import json
import os
from web3 import Web3
from src.connections.sonic_connection import SonicConnection

logger = logging.getLogger("solar_transaction_manager")

SOLAR_TOKEN_ADDRESS = "0xA77884FE9B83C678689b98E877B2A2D5bAF53497"  # Ensure this is correct for testnet


class SolarTransactionManager:

    def __init__(self, config):
        self.config = config
        self.sonic = SonicConnection({"network":
                                      "testnet"})  # ✅ Force Testnet Blaze
        self.web3 = self.sonic._web3  # ✅ Ensure Web3 connection is initialized

    def get_token_balance(self, participant_name):
        """Fetch SOLAR Token balance of a participant"""
        try:
            # Load wallet info
            wallet_path = os.path.expanduser(
                f"~/.zerepy_keystore/{participant_name}_wallet.json")
            if not os.path.exists(wallet_path):
                raise FileNotFoundError(
                    f"Wallet file not found for {participant_name}")

            with open(wallet_path, "r") as wallet_file:
                wallet_data = json.load(wallet_file)
                wallet_address = wallet_data["address"]

            logger.info(
                f"🔍 Fetching balance for {participant_name} ({wallet_address}) on Sonic Testnet"
            )

            # Connect to ERC-20 contract
            contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(SOLAR_TOKEN_ADDRESS),
                abi=self.sonic.ERC20_ABI)

            # Call `balanceOf` function
            balance_raw = contract.functions.balanceOf(wallet_address).call()
            decimals = contract.functions.decimals().call()
            balance = balance_raw / (10**decimals)

            return balance

        except Exception as e:
            logger.error(
                f"❌ Error fetching token balance for {participant_name}: {e}")
            return None

    def execute_transaction(self, seller, buyer, amount):
        """Executes a token transfer from seller to buyer."""
        try:
            seller_wallet_path = os.path.expanduser(
                f"~/.zerepy_keystore/{seller}_wallet.json")
            buyer_wallet_path = os.path.expanduser(
                f"~/.zerepy_keystore/{buyer}_wallet.json")

            if not os.path.exists(seller_wallet_path) or not os.path.exists(
                    buyer_wallet_path):
                raise FileNotFoundError(
                    "❌ Wallet file not found for one or both participants")

            with open(seller_wallet_path,
                      "r") as seller_file, open(buyer_wallet_path,
                                                "r") as buyer_file:
                seller_data = json.load(seller_file)
                buyer_data = json.load(buyer_file)
                seller_address = seller_data["address"]
                seller_private_key = seller_data["private_key"]
                buyer_address = buyer_data["address"]

            contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(SOLAR_TOKEN_ADDRESS),
                abi=self.sonic.ERC20_ABI)
            decimals = contract.functions.decimals().call()
            amount_wei = int(amount * (10**decimals))

            # Build and send transaction
            nonce = self.web3.eth.get_transaction_count(seller_address)
            txn = contract.functions.transfer(
                Web3.to_checksum_address(buyer_address),
                amount_wei).build_transaction({
                    "chainId":
                    self.web3.eth.chain_id,
                    "gas":
                    100000,
                    "gasPrice":
                    self.web3.to_wei("5", "gwei"),
                    "nonce":
                    nonce,
                })

            signed_txn = self.web3.eth.account.sign_transaction(
                txn, private_key=seller_private_key)
            txn_hash = self.web3.eth.send_raw_transaction(
                signed_txn.rawTransaction)
            return self.web3.to_hex(txn_hash)

        except Exception as e:
            logger.error(
                f"❌ Error executing transaction from {seller} to {buyer}: {e}")
            return None
