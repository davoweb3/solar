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
    The following energy report contains data on energy generation and consumption for each house. 
    Houses that generate more than they consume have surplus energy.
    Houses that consume more than they generate have a deficit.

    Houses should first trade energy among themselves before buying or selling from the Public Grid.
    The Public Grid **buys** excess energy from houses by transferring SOLAR tokens to them.
    Houses **pay** SOLAR tokens when purchasing energy from the Public Grid.

    Your task is to determine the **correct blockchain transactions** to be executed.
    Format your response as follows:

    - House A sends X SOLAR to House B
    - Public Grid sends X SOLAR to House A (for surplus energy sold)
    - House A sends X SOLAR to Public Grid (for energy bought)

    Here is the data:
    {json.dumps(energy_data, indent=2)}

    Provide only the necessary transactions.
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
