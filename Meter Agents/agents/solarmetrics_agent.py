import json
import requests

# Load agent configuration
with open("agent.json", "r") as config_file:
    config = json.load(config_file)

OPENAI_API_KEY = config["config"][1]["api_key"]


def process_energy_data(energy_data):
    """
    Process the received energy data and send it to OpenAI API for decision-making.
    """
    prompt = f"""
    The following energy report contains data on energy generation and consumption for each house:
    - Houses that generate more than they consume have a **surplus**.
    - Houses that consume more than they generate have a **deficit**.

    **⚡ Energy Trading Rules:**
    1️⃣ Houses with a **deficit** (`consumption > generation`) **MUST buy** energy.
    2️⃣ Houses **first try to buy** energy from other houses that have a surplus.
    3️⃣ If **no house has surplus energy**, then they **must buy from the Public Grid**.
    4️⃣ **Public Grid sells energy** to houses in need, and they **pay in SOLAR tokens**.
    5️⃣ **Public Grid NEVER receives SOLAR tokens unless it is SELLING energy**.
    6️⃣ Houses **MUST pay SOLAR tokens equal to the amount of energy purchased**.
    7️⃣ **If all houses have a deficit**, they **ALL must buy energy from the Public Grid**.

    ---

    **📌 Transaction Priorities:**
    - **First:** House-to-house energy trading.
    - **Then:** Houses buy from the Public Grid if no house has excess.
    - **Finally:** Houses with excess can sell energy to the Public Grid.

    ---

    📜 **Generate Transactions Using This Format:**
    - `'Wallet [BUYER] sends X SOLAR to Wallet [SELLER] on Sonic Network'`  (for house-to-house trades)
    - `'Wallet [BUYER] sends X SOLAR to Wallet Public Grid on Sonic Network'`  (if buying from the Public Grid)

    🚨 **IMPORTANT RULES:**
    - **DO NOT make deficit houses send SOLAR tokens to the Public Grid without receiving energy!**
    - **DO NOT invent unnecessary transactions.**
    - **DO NOT create circular trades unless required.**

    ---

    💡 **Now, analyze the energy data and generate ONLY the necessary transactions:**
    {json.dumps(energy_data, indent=2)}
    """


    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
        json={
            "model": "gpt-4",
            "messages": [{"role": "system", "content": prompt}],
        },
    )

    decision = response.json().get("choices", [{}])[0].get("message", {}).get("content", "No decision made")
    return decision


if __name__ == "__main__":
    # Simulated incoming data
    energy_data = {
        "weather": "sunny",
        "houses": [
            {"house": "H1", "generation": 5, "consumption": 0},
            {"house": "H2", "generation": 5, "consumption": 0},
            {"house": "H3", "generation": 5, "consumption": 7},
            {"house": "H4", "generation": 5, "consumption": 0},
        ],
    }

    transactions = process_energy_data(energy_data)
    print("\n🧠 AI Decision:")
    print(transactions)
