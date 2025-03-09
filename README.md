# Solarmetrics ✨🏡🌌 - Sonic DeFAi Hackathon 2025

**Decentralized Energy Trading for a Sustainable Future**

## Motivation 🌞🌍
Latin America faces a severe drought crisis, affecting countries like **Colombia, Ecuador, and Brazil**. Many governments are encouraging private initiatives for **solar energy generation** in homes, buildings, and residential communities. The **lack of rainfall** has led to continuous energy shortages, which could be mitigated with decentralized solar energy units.

Each household can **generate between 2 to 5 kWh** daily with minimal investment in **solar panels and inverters**. During the **day**, houses can produce and trade surplus energy, while at **night**, they rely on the public grid (assuming an **on-grid system**). Existing centralized energy trading models **lack transparency and accessibility**, but now, **blockchain technology enables decentralized, fair, and automated trading**.

With **Solarmetrics**, homeowners can:
- **Sell excess energy** and earn **SOLAR tokens**.
- **Buy affordable energy** when others in their community have a surplus.
- **Trade energy with public utility companies**, storing tokens for future use.

The goal is to **maximize clean energy injection into the grid**, promoting **sustainability** while leveraging **AI agents** to automate the entire process. Each solar meter could be integrated with an **AI agent** (e.g., running on a **Raspberry Pi**) and connected to a **bidirectional net meter** with some tweaking ( not covered in this demo)  that tracks energy flow and it will become a solar power meter into an intelligent AI meter!.

## Overview 🌐
Solarmetrics is a **DeFi-powered, AI-enhanced decentralized energy trading platform** designed to optimize solar energy **consumption and distribution** within local communities. Built on the **Sonic blockchain**, Solarmetrics enables households to **buy, sell, and monitor energy in real-time**, ensuring **fair pricing, efficiency, and sustainability**. This project is part of the **Sonic DeFAi Hackathon**.

## System Architecture Diagram 📊
[View our system architecture diagram](https://excalidraw.com/#json=KvqR5Zp6o7EIWcVWYvVAP,xqbENKX0M9ZD5B0GPEtgmQ)

## Key Features ✨
- ⚡ **Decentralized Energy Marketplace**: Peer-to-peer (P2P) energy trading using **ERC-20 SOLAR tokens**.
- 🔄 **AI-Powered Energy Optimization**: Predicts surplus/deficit energy using **real-time consumption data from energy meters**.
- ⌚ **Automated Energy Settlement**: Secure, trustless transactions on the **Sonic blockchain**.
- 🛠 **Real-Time Monitoring**: AI agents **monitor** energy production, consumption, and transactions via an intuitive Web3 dashboard.

## How It Works ⚛
1. **Energy Tokenization**: Each house receives **SOLAR tokens** based on energy contribution. *(The swap process is not developed here, but it can be easily implemented.)*
2. **Decentralized Trading**: Users trade excess energy using **smart contracts on Sonic**.
3. **AI & Automation**: The **ZerePy AI agent** monitors and optimizes energy allocation.

## Project Images & Implementation 📸
### Main Dashboard Interface
![Solarmetrics Dashboard Interface](https://i.ibb.co/TDskyDrk/Whats-App-Image-2025-03-09-at-15-57-22.jpg)
*Block Explorer transactions on Sonic*

### Energy Trading Platform
![Energy Trading Platform](https://i.ibb.co/RTyPVRkQ/Whats-App-Image-2025-03-09-at-15-59-51.jpg)
*The decentralized marketplace interface where households can monitor and execute energy trades using SOLAR tokens.*

### AI Agent Network Visualization
![AI Agent Network](https://i.ibb.co/j2zPyTg/Whats-App-Image-2025-03-09-at-15-58-13.jpg)
*Visualization of the ZerePy AI agent network showing inter-agent communication and decision-making processes.*

### Energy Production Analytics
![Energy Analytics Dashboard](https://i.ibb.co/ch9S9yHn/Whats-App-Image-2025-03-09-at-15-57-56.jpg)
*Detailed analytics dashboard displaying household energy production and consumption patterns over time.*

### Smart Contract Architecture
![Smart Contract Architecture](https://i.ibb.co/nM8S6sD6/Whats-App-Image-2025-03-09-at-15-57-41.jpg)
*Technical overview of the Sonic blockchain integration and SOLAR token smart contract implementation.*

## Architecture ⚖️
Solarmetrics integrates **DeFi, AI, and blockchain** to enable **transparent, decentralized energy trading**:

### Tech Stack
- **Frontend**: Next + Web3 (Vercel).
- **AI Agent Infrastructure**: **ZerePy** framework for building and managing AI agent network.
- **LLM Engine**: **OpenAI** (GPT-4 and GPT-3.5-turbo) for intelligent decision-making and natural language processing.
- **Blockchain Data Queries**: **Nebula AI** for efficient querying of on-chain data and analytics.
- **Smart Contracts**: **ERC-20 SOLAR token** built on **Sonic blockchain**, managed via **ThirdWeb API**.
- **Energy Data Simulation**: Uses real-world energy patterns to **simulate grid behavior**, built on **Node.js**.

## What You Will See in the Demo 🎥
Solarmetrics provides a **dashboard** showcasing how **AI agents manage decentralized energy transactions**.

### Components
- **Main Agent**: The **ZerePy-based AI agent** receives **raw data** from **simulated energy sensors**, communicates with **OpenAI's LLM**, and makes optimal trading decisions. It determines whether **households trade among themselves or interact with the public grid**. **Nebula AI** is used to query on-chain data for real-time analytics.
- **Meter Agents**: Each **Sonic Meter** is a real **AI agent powered by ZerePy**, which listens to and interprets data, then **executes transactions** on the **Sonic Blaze testnet**.
  - **Four AI meters** represent individual households.
  - **One public AI meter** represents the **Public Energy Company/Public Grid**.
  - Each AI agent has its **own wallet address**.
- **Energy Data Simulation**: Uses real-world energy patterns to **simulate grid behavior**.

## There is plenty of room for improvement, this is a probable Roadmap 👀
- [x] Implement **real-time energy monitoring, buying and selling**
- [x] Develop **ERC-20 SOLAR token**
- [x] Integrate **AI-agents in a descentralized way that comunicates with each other**
- [ ] Implement **token pricing based on supply/demand**
- [ ] Launch **mainnet version**
- [ ] Expand to **IoT-powered metering systems and real hardware integration**.
- [ ] Integrate a **"comitee-model" with 2 or more LLMs for advanced energy forecasting**.

## Contributors 💪
- **David Ramirez** (Blockchain & AI Integration, Frontend, Smart Contracts, Energy Simulation)

## Join Us! 🌟
Follow our progress and contribute to the future of **decentralized energy trading**:
- Twitter: [@solarmetrics](https://twitter.com/solarmetrics)
- GitHub: [Solarmetrics Repo](https://github.com/your-repo/solar-git)

## License ⚖️
MIT License - Free to use and contribute!

---
**Solarmetrics: Powering a decentralized and sustainable future!** ✨🚀
