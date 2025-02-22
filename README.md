# Solarmetrics ✨🏡🌌 - Sonic DeFAi Hackathon 2025

**Decentralized Energy Trading for a Sustainable Future**

## Motivation 🌞🌍
Latin America faces a severe drought crisis, affecting countries like **Colombia, Ecuador, and Brazil**. Many governments are encouraging private initiatives for **solar energy generation** in homes, buildings, and residential communities. The **lack of rainfall** has led to continuous energy shortages, which could be mitigated with decentralized solar energy units.

Each household can **generate between 3 to 5 kWh** daily with minimal investment in **solar panels and batteries**. During the **day**, houses can produce and trade surplus energy, while at **night**, they rely on the public grid (assuming an **on-grid system**). Existing centralized energy trading models **lack transparency and accessibility**, but now, **blockchain technology enables decentralized, fair, and automated trading**.

With **Solarmetrics**, homeowners can:
- **Sell excess energy** and earn **SOLAR tokens**.
- **Buy affordable energy** when others in their community have a surplus.
- **Trade energy with public utility companies**, storing tokens for future use.

The goal is to **maximize clean energy injection into the grid**, promoting **sustainability** while leveraging **AI agents** to automate the entire process. Each solar meter can be integrated with an **AI agent** (e.g., running on a **Raspberry Pi**) and connected to a **bidirectional net meter** that tracks energy flow.

## Overview 🌐
Solarmetrics is a **DeFi-powered, AI-enhanced decentralized energy trading platform** designed to optimize solar energy **consumption and distribution** within local communities. Built on the **Sonic blockchain**, Solarmetrics enables households to **buy, sell, and monitor energy in real-time**, ensuring **fair pricing, efficiency, and sustainability**. This project is part of the **Sonic DeFAi Hackathon**.

## Key Features ✨
- ⚡ **Decentralized Energy Marketplace**: Peer-to-peer (P2P) energy trading using **ERC-20 SOLAR tokens**.
- 🔄 **AI-Powered Energy Optimization**: Predicts surplus/deficit energy using **real-time consumption data from energy meters**.
- ⌚ **Automated Energy Settlement**: Secure, trustless transactions on the **Sonic blockchain**.
- 🛠 **Real-Time Monitoring**: AI agents **monitor** energy production, consumption, and transactions via an intuitive Web3 dashboard.


## How It Works ⚛
1. **Energy Tokenization**: Each house receives **SOLAR tokens** based on energy contribution. *(The swap process is not developed here, but it can be easily implemented.)*
2. **Decentralized Trading**: Users trade excess energy using **smart contracts on Sonic**.
3. **AI & Automation**: The **ZerePy AI agent** monitors and optimizes energy allocation.


## Architecture ⚖️
Solarmetrics integrates **DeFi, AI, and blockchain** to enable **transparent, decentralized energy trading**:

### Tech Stack
- **Frontend**: React + Web3 (**ThirdWeb** for wallet integration, **Chakra UI** for styling).
- **Backend**: AI agent powered by **ZerePy**, running on a server to handle energy analytics.
- **Smart Contracts**: **ERC-20 SOLAR token** built on **Sonic blockchain**, managed via **ThirdWeb API**.
- **Energy Data Simulation**: Uses real-world energy patterns to **simulate grid behavior**, built on **Node.js**.
- **LLM Integration**: GPT-4 and GPT-3.5-turbo from OpenAI.

## What You Will See in the Demo 🎥
Solarmetrics provides a **dashboard** showcasing how **AI agents manage decentralized energy transactions**.

### Components
- **Main Agent**: The **ZerePy-based AI agent** receives **raw data** from **simulated energy sensors**, communicates with OpenAI, and makes optimal trading decisions. It determines whether **households trade among themselves or interact with the public grid**.
- **Meter Agents**: Each **Sonic Meter** is a real **AI agent powered by ZerePy**, which listens to and interprets data, then **executes transactions** on the **Sonic Blaze testnet**.
  - **Four AI meters** represent individual households.
  - **One public AI meter** represents the **Public Energy Company/Public Grid**.
  - Each AI agent has its **own wallet address**.
- **Energy Data Simulation**: Uses real-world energy patterns to **simulate grid behavior**.

## Roadmap 👀
- [x] Implement **real-time energy monitoring**
- [x] Develop **ERC-20 SOLAR token**
- [x] Integrate **AI-generated social impact tweets**
- [ ] Implement **token pricing based on supply/demand**
- [ ] Launch **mainnet version**
- [ ] Expand to **IoT-powered metering systems and real hardware integration**.

## Contributors 💪
- **David Ramirez** (Blockchain & AI Integration, Frontend, Smart Contracts, Energy Simulation)

## Join Us! 🌟
Follow our progress and contribute to the future of **decentralized energy trading**:
- Twitter: [@solarmetrics](https://twitter.com/solarmetrics)
- GitHub: [Solarmetrics Repo](https://github.com/your-repo/solarmetrics)

## License ⚖️
MIT License - Free to use and contribute!

---
**Solarmetrics: Powering a decentralized and sustainable future!** ✨🚀
