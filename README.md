# 🎰 Kamori Casino Bot

Bot Casino & Tycoon complet pour le serveur Kamori.

---

## 📦 Installation

```bash
npm install
cp .env.example .env
# Colle ton token dans .env
```

## 🚀 Lancement

```bash
npm start
```

---

## ⚙️ Intents à activer sur Discord Developer Portal

- ✅ Server Members Intent
- ✅ Message Content Intent

---

## 📋 Commandes

### 💰 Économie
| Commande | Description |
|---|---|
| `+balance [@user]` | Voir son solde |
| `+daily` | 100 🪙 par jour |
| `+transfert @user <montant>` | Envoyer des pièces |
| `+leaderboard` | Top 10 |
| `+helpall` | Liste des commandes |

### 🎮 Casino
| Commande | Description |
|---|---|
| `+slots <mise>` | Machine à sous |
| `+coinflip <pile/face> <mise>` | Pile ou face |
| `+blackjack <mise>` | Blackjack |
| `+roulette <choix> <mise>` | Roulette |

### 🎟️ Tirages
| Commande | Description |
|---|---|
| `+loterie` | Voir le pot |
| `+loterie acheter` | Acheter un ticket (50 🪙) |
| `+loterie tirer` | Tirer le gagnant (Admin) |
| `+giveaway <durée> <nb> <prix>` | Lancer un giveaway |

### 🏭 Tycoon
| Commande | Description |
|---|---|
| `+tycoon` | Ouvrir son empire |

---

## 📁 Structure

```
kamori-casino/
├── index.js
├── package.json
├── .env
├── commands/
│   ├── casino/     → slots, coinflip, blackjack, roulette, loterie, giveaway
│   ├── tycoon/     → tycoon
│   └── economy/    → balance, daily, leaderboard, transfert, helpall
├── events/
│   ├── ready.js
│   ├── messageCreate.js
│   └── interactionCreate.js
├── utils/
│   ├── db.js
│   ├── economy.js
│   └── duration.js
└── data/           → auto-généré
```
