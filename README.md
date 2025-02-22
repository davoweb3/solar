```markdown
# Solarmetrics ✨🏡🌌 - Sonic DeFAi Hackathon 2025

**Decentralized Energy Trading for a Sustainable Future**

###There is Motivation behind this project. Latam has a severe problem with drought and most countries as:Colombia, Ecuador, Brasil and others are encouraging private initiatives for solar generation in houses, buildings and living sites. The lack of rains produced a continuous energy shortage that could be easy to solve with descentralized units of solar energy generation. Each house easily can produce between 3 to 5 Kw/h with a small investment in solar panels and batteries during the day, and when the night comes the public energy grid supply the energy ( this depends either the system is On or Off-Grid) , in this case the model is an On-Grid.
These systems are not new and they trade energy in a centralized way, until now that we have the tools to make it descentralized, transparent and accesible. Now the houseowners are empowered to sell energy ( and get that reward) or buy cheap energy when other houses in the condo has surplus, Even they can sell energy to the Public Utility Company and use the earned tokens when they need power back.

The idea is to inject cleaner energy as much as possible to the grid and this way contribute with green energy and with the environment. Last but not least all this can be done using AI agents that will take care of everything. Each Solar Meter can be integrated with an AI agent ( small factor as a Raspeberry Pi?).and be connected to a Bidirectional NetMeter that sends/receives energy. Solarmetrics aims to be a system for metering these consumptions in a future. 

## Overview for This Project.
Solarmetrics is a **DeFi-powered, AI-enhanced decentralized energy trading platform** designed to optimize solar energy consumption and distribution within local communities. Built on the **Sonic blockchain**, Solarmetrics enables households to **buy, sell, and monitor energy in real-time**, ensuring **fair pricing, efficiency, and sustainability**. This project is being developed as part of the **Sonic DeFAi Hackathon**.

## Key Features ✨
- ⚡ **Decentralized Energy Marketplace**: Peer-to-peer (P2P) energy trading using **ERC-20 SOLAR tokens**.
- 🔄 **AI-Powered Energy Optimization**: Predicts surplus/deficit energy using **real-time consumption data from energy meters**.
- ⌚ **Automated Energy Settlement**: Secure, trustless transactions on the **Sonic blockchain**.
- 🛠 **Real-Time Monitoring**: AI agents **monitor** energy production, consumption, and transactions via an intuitive Web3 dashboard.
- 🔗 **AI-Driven Social Impact**: Whenever the system injects clean energy into the public grid, an **AI-generated tweet** raises awareness about decentralized renewable energy.

## How It Works ⚛
1. **Energy Tokenization**: Each house receives **SOLAR tokens** based on energy contribution. (The swap process is not developed here, but it can be easily implemented.)
2. **Decentralized Trading**: Users trade excess energy using smart contracts on Sonic.
3. **AI & Automation**: The **ZerePy AI agent** monitors and optimizes energy allocation.
4. **Social Engagement**: AI generates real-time **tweets announcing clean energy injections** to the public grid.

## Architecture ⚖️
Solarmetrics integrates **DeFi, AI, and blockchain** to enable **transparent, decentralized energy trading**:
- **Frontend**: React + Web3 (ThirdWeb for wallet integration, Chakra UI for styling).
- **Backend**: AI agent powered by **ZerePy**, running on a server to handle energy analytics.
- **Smart Contracts**: ERC-20 SOLAR token built on **Sonic blockchain**, managed via ThirdWeb API.
- **Energy Data Simulation**: Uses real-world energy patterns to **simulate grid behavior**, built on Node.js.
- **LLM Integration**: GPT-4 and GPT-3.5-turbo from OpenAI.

## What You Will See in the Demo ⚖️
Solarmetrics provides a dashboard that showcases how AI agents manage decentralized energy transactions.

- **Main Agent**: The main ZerePy-based AI agent receives raw data from simulated energy sensors, communicates with OpenAI, and makes optimal trading decisions. It determines whether households trade energy among themselves or interact with the public grid.
- **Meter Agents**: Each **Sonic Meter** is a real AI agent powered by **ZerePy**, which listens to and interprets data, then executes transactions on the Sonic Blaze testnet.
  - There are **four AI meters**, each representing a household.
  - One **public AI meter** represents the Public Energy Company/Public Grid.
  - Each AI agent has its own wallet address.
- **Energy Data Simulation**: Uses real-world energy patterns to **simulate grid behavior**.

Example Data Format:
```json
{"weather":"sunny","houses":[
  {"house":"H1","generation":5,"consumption":0,"voltage":"110.0","powerFactor":"1.00"},
  {"house":"H2","generation":5,"consumption":0,"voltage":"110.0","powerFactor":"1.00"},
  {"house":"H3","generation":5,"consumption":0,"voltage":"110.0","powerFactor":"1.00"},
  {"house":"H4","generation":5,"consumption":0,"voltage":"110.0","powerFactor":"1.00"}
]}
```

## Project Stack ⚙️
| Component         | Technology            |
|------------------|----------------------|
| **Blockchain**   | Sonic Blaze          |
| **Smart Contracts** | Solidity (ERC-20)  |
| **Frontend**     | React, ThirdWeb, Chakra UI |
| **Backend**      | Python (ZerePy AI Agent), Node.js (Sensor Simulation) |
| **Monitoring**   | Real-time Web3 analytics |

## Getting Started 🚀
### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/solar.git
cd solarmetrics
```
**Note:** Each folder has its own deployment instructions. You can use Replit for one-click deployment of ZerePy.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Application
```bash
npm start
```

### 4. Connect Your AI Agents to the Sonic Network
Ensure your wallet is connected to **Sonic testnet** before interacting with the platform.

## Live Demo 🌐
A working prototype is available at:
[Solarmetrics Web App](https://solarmetricspanel.netlify.app/)
###Important Note:Due to this a real app connected to IA using OpenAi apis and needs to be tested by the hackathon, due to the cost of working on GPT-4 model(expensive, but works better), it's likely I downgrade the model to GPT-3.5Turbo without advice and probably the responses be not so accurate as they are now. 

## Roadmap 👀
- [x] Implement **real-time energy monitoring**
- [x] Develop **ERC-20 SOLAR token**
- [x] Integrate **AI-generated social impact tweets**
- [ ] Implement **token pricing based on supply/demand**
- [ ] Launch **mainnet version**
- [ ] Expand to **IoT-powered metering systems and real hardware integration** (for real-world applications and PoC).
- [ ]  Train the model with OpenAi advanced technics for ultimate accuracy.

## Contributors 💪
- **David Ramirez** (Blockchain & AI Integration, Frontend, Smart Contracts, Energy Simulation)

## Diagram
[Solarmetrics System Architecture](https://excalidraw.com/#json=U9uBkMeVXYZ7JxOHymt4D,QF_Lug3uT7agX39285TUnQ)

## Future Enhancements: Real-Life Demo Integration
Would you like to build and automate a real-life demo? Check out this hardware proposal:
[Hardware Configuration for Solarmetrics](https://docs.google.com/document/d/1MXyi0dFkNqQx9yAEfJavzVgUdmMIsmqafII8h_IaXHI/edit?usp=sharing)

## Join Us! 🌟
Follow our progress and contribute to the future of **decentralized energy trading**:
- Twitter: [@solarmetrics](https://twitter.com/solarmetrics)
- GitHub: [Solarmetrics Repo](https://github.com/your-repo/solarmetrics)

## License ⚖️
MIT License - Free to use and contribute!

---
**Solarmetrics: Powering a decentralized and sustainable future!** ✨🚀
```

