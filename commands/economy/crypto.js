const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');
const { load, save } = require('../../utils/db');

// Simulation marché crypto
function getKcoinMarket() {
  const market = load('cryptoMarket');
  const now = Date.now();

  if (!market.price || now - (market.lastUpdate || 0) > 2 * 60 * 1000) {
    const old = market.price || 10;
    const change = (Math.random() * 2 - 1) * 0.15;
    market.price = Math.max(1, Math.round(old * (1 + change) * 100) / 100);
    market.change24h = ((market.price - old) / old * 100).toFixed(2);
    market.lastUpdate = now;
    market.history = [...(market.history || []).slice(-23), market.price];
    save('cryptoMarket', market);
  }
  return market;
}

function getWallet(userId) {
  const wallets = load('cryptoWallets');
  if (!wallets[userId]) {
    wallets[userId] = { kcoins: 0, totalInvested: 0 };
    save('cryptoWallets', wallets);
  }
  return wallets[userId];
}

function saveWallet(userId, data) {
  const wallets = load('cryptoWallets');
  wallets[userId] = data;
  save('cryptoWallets', wallets);
}

module.exports = {
  name: 'crypto',
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const market = getKcoinMarket();
    const wallet = getWallet(message.author.id);
    const user = getUser(message.author.id);

    // -crypto (voir marché)
    if (!sub || sub === 'marché' || sub === 'marche') {
      const change = parseFloat(market.change24h);
      const trend = change >= 0 ? '📈' : '📉';
      const color = change >= 0 ? 0x2ecc71 : 0xe74c3c;

      // Mini graphique historique
      const hist = market.history || [];
      const max = Math.max(...hist);
      const min = Math.min(...hist);
      const graph = hist.slice(-10).map(p => {
        const pct = max === min ? 0.5 : (p - min) / (max - min);
        if (pct > 0.8) return '▇';
        if (pct > 0.6) return '▅';
        if (pct > 0.4) return '▃';
        if (pct > 0.2) return '▂';
        return '▁';
      }).join('');

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('🪙 KCoin — Marché Crypto Kamori')
        .setDescription(
          `\`${graph}\`\n\n` +
          `**Prix actuel :** \`${market.price.toLocaleString('fr-FR')} 🪙\`\n` +
          `**Variation :** ${trend} \`${change >= 0 ? '+' : ''}${market.change24h}%\`\n\n` +
          `**Ton portefeuille :** \`${wallet.kcoins.toFixed(4)} KC\`\n` +
          `**Valeur :** \`${Math.floor(wallet.kcoins * market.price).toLocaleString('fr-FR')} 🪙\``
        )
        .addFields(
          { name: '📖 Commandes', value: '`-crypto acheter <montant>` — Acheter des KCoins\n`-crypto vendre <quantité>` — Vendre des KCoins\n`-crypto portefeuille` — Voir ton wallet', inline: false },
        )
        .setFooter({ text: 'Kamori Crypto • Mis à jour toutes les 2min' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // -crypto acheter <montant en coins>
    if (sub === 'acheter') {
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return message.reply('❌ Ex: `-crypto acheter 1000`');
      if (user.balance < amount) return message.reply(`❌ Solde insuffisant : **${user.balance.toLocaleString('fr-FR')}** 🪙`);

      const kcoins = amount / market.price;
      user.balance -= amount;
      wallet.kcoins += kcoins;
      wallet.totalInvested += amount;

      saveUser(message.author.id, user);
      saveWallet(message.author.id, wallet);

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('✅ Achat KCoin')
        .setDescription(
          `Tu as acheté **${kcoins.toFixed(4)} KC** pour **${amount.toLocaleString('fr-FR')}** 🪙\n` +
          `Prix unitaire : **${market.price}** 🪙/KC\n\n` +
          `💳 Solde restant : **${user.balance.toLocaleString('fr-FR')}** 🪙\n` +
          `🪙 Total KC : **${wallet.kcoins.toFixed(4)} KC**`
        )
        .setTimestamp()
      ]});
    }

    // -crypto vendre <quantité de kcoins>
    if (sub === 'vendre') {
      const qty = parseFloat(args[1]);
      if (isNaN(qty) || qty <= 0) return message.reply('❌ Ex: `-crypto vendre 0.5`');
      if (wallet.kcoins < qty) return message.reply(`❌ Tu n'as que **${wallet.kcoins.toFixed(4)} KC**`);

      const gain = Math.floor(qty * market.price);
      wallet.kcoins -= qty;
      user.balance += gain;

      saveUser(message.author.id, user);
      saveWallet(message.author.id, wallet);

      const profit = gain - Math.floor(qty * (wallet.totalInvested / Math.max(wallet.kcoins + qty, 0.0001)));

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('💸 Vente KCoin')
        .setDescription(
          `Tu as vendu **${qty.toFixed(4)} KC** pour **${gain.toLocaleString('fr-FR')}** 🪙\n` +
          `Prix unitaire : **${market.price}** 🪙/KC\n\n` +
          `💳 Nouveau solde : **${user.balance.toLocaleString('fr-FR')}** 🪙\n` +
          `🪙 KC restant : **${wallet.kcoins.toFixed(4)} KC**`
        )
        .setTimestamp()
      ]});
    }

    // -crypto portefeuille
    if (sub === 'portefeuille') {
      const valeur = Math.floor(wallet.kcoins * market.price);
      const pnl = valeur - wallet.totalInvested;
      const pnlPct = wallet.totalInvested > 0 ? ((pnl / wallet.totalInvested) * 100).toFixed(2) : '0.00';

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(pnl >= 0 ? 0x2ecc71 : 0xe74c3c)
        .setTitle('👛 Portefeuille Crypto')
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: '🪙 KCoins', value: `**${wallet.kcoins.toFixed(4)} KC**`, inline: true },
          { name: '💰 Valeur actuelle', value: `**${valeur.toLocaleString('fr-FR')} 🪙**`, inline: true },
          { name: `${pnl >= 0 ? '📈' : '📉'} P&L`, value: `**${pnl >= 0 ? '+' : ''}${pnl.toLocaleString('fr-FR')} 🪙** (${pnlPct}%)`, inline: true },
          { name: '💳 Portefeuille', value: `**${user.balance.toLocaleString('fr-FR')} 🪙**`, inline: true },
        )
        .setFooter({ text: `Prix KC : ${market.price} 🪙` })
        .setTimestamp()
      ]});
    }
  },
};
