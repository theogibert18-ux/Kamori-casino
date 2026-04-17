const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');
const { load, save } = require('../../utils/db');

// ─── CONFIG DIFFICILE ───
const BASE_PRODUCTION = 0.05;   // Très lent
const BASE_STOCK = 300;
const SELL_BASE_PRICE = 0.8;
const MARKET_INTERVAL = 3 * 60 * 1000;

const UPGRADES = {
  niveau:   { label: '⬆️ Niveau',       baseCost: 200,   mult: 2.0, desc: '+0.03/s production' },
  stockage: { label: '📦 Capacité+300', baseCost: 1500,  mult: 2.5, desc: '+300 stockage' },
  prestige: { label: '💎 Prestige',     baseCost: 50000, mult: 3.5, desc: '+0.08/s bonus permanent' },
};

function getPlayer(userId) {
  const tycoon = load('tycoon');
  if (!tycoon[userId]) {
    tycoon[userId] = {
      level: 1, prestige: 0,
      productionPerSec: BASE_PRODUCTION,
      stock: 0, maxStock: BASE_STOCK,
      lastTick: Date.now(),
      upgradeCosts: { niveau: 200, stockage: 1500, prestige: 50000 },
      modules: 0, synergy: 1.0,
    };
    save('tycoon', tycoon);
  }
  return tycoon[userId];
}

function savePlayer(userId, data) {
  const tycoon = load('tycoon');
  tycoon[userId] = data;
  save('tycoon', tycoon);
}

function updateProduction(data) {
  const now = Date.now();
  const elapsed = (now - (data.lastTick || now)) / 1000;
  data.stock = Math.min(data.stock + data.productionPerSec * elapsed * data.synergy, data.maxStock);
  data.lastTick = now;
  return data;
}

function getMarket() {
  const market = load('market');
  const now = Date.now();
  if (!market.price || now - market.lastUpdate > MARKET_INTERVAL) {
    const v = (Math.random() * 2 - 1) * 0.4;
    market.price = Math.max(0.3, Math.min(3.0, (market.price || SELL_BASE_PRICE) + v));
    market.lastUpdate = now;
    market.status = market.price < 0.6 ? '🔴 Effondré' : market.price > 2.0 ? '🟢 Excellent' : '🟡 Normal';
    market.advice = market.price < 0.6 ? '❌ Attendez!' : market.price > 2.0 ? '✅ Vendez!' : '➡️ Correct';
    save('market', market);
  }
  return market;
}

function buildEmbed(userId, data, market) {
  const prodPerHour = data.productionPerSec * 3600 * data.synergy;
  const gainPerHour = prodPerHour * market.price;
  const stockPct = ((data.stock / data.maxStock) * 100).toFixed(1);
  const fillLen = Math.round((data.stock / data.maxStock) * 10);
  const bar = '🟩'.repeat(fillLen) + '⬛'.repeat(10 - fillLen);
  const pleinDans = data.productionPerSec > 0 ? Math.round((data.maxStock - data.stock) / (data.productionPerSec * data.synergy)) : '∞';
  const costs = data.upgradeCosts;

  return new EmbedBuilder()
    .setColor(0xff6b35)
    .setTitle('🏭 Kamori Tycoon')
    .addFields(
      { name: '📊 PRODUCTION', value:
        `\`\`\`\n⚡ ${data.productionPerSec.toFixed(3)} res/sec\n⏰ ${Math.round(prodPerHour).toLocaleString('fr-FR')} res/heure\n💵 ~${Math.round(gainPerHour).toLocaleString('fr-FR')} 🪙/heure\n\n⚙️ Multiplicateur: x${(data.productionPerSec / BASE_PRODUCTION).toFixed(2)}\n   Base: ${BASE_PRODUCTION}/s | Niv: +${((data.level-1)*0.03).toFixed(3)}/s\n   Prestige: +${(data.prestige*0.08).toFixed(3)}/s\n\`\`\``, inline: false },
      { name: '📦 Stockage', value: `${bar}\n${stockPct}%\n**${Math.floor(data.stock).toLocaleString('fr-FR')} / ${data.maxStock}**\n⏱️ Plein dans **${pleinDans < 60 ? `< ${pleinDans}s` : `${Math.round(pleinDans/60)}m`}**`, inline: true },
      { name: '💰 Trésorerie', value: `${getUser(userId).balance.toLocaleString('fr-FR')} 🪙\n\nValeur stock : **${Math.floor(data.stock * market.price).toLocaleString('fr-FR')}** 🪙\n(à **${market.price.toFixed(2)}** 🪙/res)`, inline: true },
      { name: `📈 Marché ${market.status}`, value: `${market.advice}`, inline: true },
      { name: '🛒 AMÉLIORATIONS', value:
        `⬆️ **Niveau ${data.level+1}** — ${costs.niveau.toLocaleString('fr-FR')} 🪙 — +0.03/s\n` +
        `📦 **Capacité+300** — ${costs.stockage.toLocaleString('fr-FR')} 🪙 — +300 stock\n` +
        `💎 **Prestige ${data.prestige+1}** — ${costs.prestige.toLocaleString('fr-FR')} 🪙 — Bonus permanent`, inline: false },
    )
    .setFooter({ text: `${data.modules} modules | Niv.${data.level} | Prestige ${data.prestige} | Kamori Tycoon` })
    .setTimestamp();
}

function buildButtons() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tycoon_sell').setLabel('💰 Vendre').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tycoon_upgrade_niveau').setLabel('⬆️ Niveau').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tycoon_upgrade_stockage').setLabel('📦 Stockage').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tycoon_upgrade_prestige').setLabel('💎 Prestige').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('tycoon_refresh').setLabel('🔄').setStyle(ButtonStyle.Secondary),
  )];
}

module.exports = {
  name: 'tycoon',
  async execute(message) {
    let data = getPlayer(message.author.id);
    data = updateProduction(data);
    savePlayer(message.author.id, data);
    message.reply({ embeds: [buildEmbed(message.author.id, data, getMarket())], components: buildButtons() });
  },
};

async function handleTycoonButtons(interaction) {
  const userId = interaction.user.id;
  let data = getPlayer(userId);
  data = updateProduction(data);
  const market = getMarket();
  const user = getUser(userId);
  const action = interaction.customId.replace('tycoon_', '');

  if (action === 'sell') {
    if (data.stock < 1) return interaction.reply({ content: '❌ Stock insuffisant !', ephemeral: true });
    const gain = Math.floor(data.stock * market.price);
    user.balance += gain;
    saveUser(userId, user);
    data.stock = 0;
    savePlayer(userId, data);
    await interaction.reply({ content: `✅ Stock vendu pour **${gain.toLocaleString('fr-FR')}** 🪙 !`, ephemeral: true });
    return interaction.message.edit({ embeds: [buildEmbed(userId, data, market)], components: buildButtons() }).catch(() => {});
  }

  if (action === 'refresh') {
    savePlayer(userId, data);
    return interaction.update({ embeds: [buildEmbed(userId, data, market)], components: buildButtons() });
  }

  if (action.startsWith('upgrade_')) {
    const key = action.replace('upgrade_', '');
    const cost = data.upgradeCosts[key];
    if (user.balance < cost) return interaction.reply({ content: `❌ Il faut **${cost.toLocaleString('fr-FR')}** 🪙 !`, ephemeral: true });
    user.balance -= cost;
    if (key === 'niveau') { data.level++; data.productionPerSec += 0.03; data.upgradeCosts.niveau = Math.round(cost * 2.0); }
    if (key === 'stockage') { data.maxStock += 300; data.upgradeCosts.stockage = Math.round(cost * 2.5); }
    if (key === 'prestige') { data.prestige++; data.productionPerSec += 0.08; data.stock = 0; data.upgradeCosts.prestige = Math.round(cost * 3.5); }
    saveUser(userId, user);
    savePlayer(userId, data);
    await interaction.reply({ content: `✅ Amélioration achetée !`, ephemeral: true });
    return interaction.message.edit({ embeds: [buildEmbed(userId, data, market)], components: buildButtons() }).catch(() => {});
  }
}

module.exports.handleTycoonButtons = handleTycoonButtons;
