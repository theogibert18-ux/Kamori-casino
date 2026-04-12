const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');
const { load, save } = require('../../utils/db');

// ─────────────────────────────────────────
// CONFIG DE BASE
// ─────────────────────────────────────────
const BASE_PRODUCTION = 0.50;
const BASE_STOCK = 500;
const SELL_BASE_PRICE = 1.50;
const MARKET_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────
// AMÉLIORATIONS DISPONIBLES
// ─────────────────────────────────────────
const UPGRADES = {
  niveau: { label: '⬆️ Niveau', baseCost: 50, costMult: 1.5, desc: '+0.10/s production', effect: (d) => { d.level++; d.productionPerSec += 0.10; } },
  stockage: { label: '📦 Capacité +500', baseCost: 500, costMult: 2, desc: '+500 stockage', effect: (d) => { d.maxStock += 500; } },
  prestige: { label: '💎 Prestige', baseCost: 10000, costMult: 3, desc: 'Bonus permanent +0.16/s', effect: (d) => { d.prestige++; d.productionPerSec += 0.16; d.stock = 0; } },
};

// ─────────────────────────────────────────
// INIT JOUEUR
// ─────────────────────────────────────────
function getPlayer(userId) {
  const tycoon = load('tycoon');
  if (!tycoon[userId]) {
    tycoon[userId] = {
      level: 1,
      prestige: 0,
      productionPerSec: BASE_PRODUCTION,
      stock: 0,
      maxStock: BASE_STOCK,
      lastTick: Date.now(),
      upgradeCosts: { niveau: 50, stockage: 500, prestige: 10000 },
      modules: 0,
      synergy: 1.0,
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

// ─────────────────────────────────────────
// CALCUL PRODUCTION
// ─────────────────────────────────────────
function updateProduction(data) {
  const now = Date.now();
  const elapsed = (now - (data.lastTick || now)) / 1000;
  const produced = data.productionPerSec * elapsed * data.synergy;
  data.stock = Math.min(data.stock + produced, data.maxStock);
  data.lastTick = now;
  return data;
}

// ─────────────────────────────────────────
// MARCHÉ
// ─────────────────────────────────────────
function getMarket() {
  const market = load('market');
  const now = Date.now();

  if (!market.price || now - market.lastUpdate > MARKET_UPDATE_INTERVAL) {
    const variation = (Math.random() * 2 - 1) * 0.5;
    market.price = Math.max(0.5, Math.min(5.0, (market.price || SELL_BASE_PRICE) + variation));
    market.lastUpdate = now;
    market.status = market.price < 1.0 ? '🔴 Effondré' : market.price > 3.0 ? '🟢 Excellent' : '🟡 Normal';
    market.advice = market.price < 1.0 ? '❌ Attendez!' : market.price > 3.0 ? '✅ Vendez!' : '➡️ Correct';
    save('market', market);
  }
  return market;
}

// ─────────────────────────────────────────
// EMBED PRINCIPAL
// ─────────────────────────────────────────
function buildEmbed(userId, data, market) {
  const prodPerHour = data.productionPerSec * 3600 * data.synergy;
  const gainPerHour = prodPerHour * market.price;
  const stockPct = ((data.stock / data.maxStock) * 100).toFixed(1);
  const fillLen = Math.round((data.stock / data.maxStock) * 10);
  const bar = '🟩'.repeat(fillLen) + '⬛'.repeat(10 - fillLen);
  const pleinDans = data.productionPerSec > 0 ? Math.round((data.maxStock - data.stock) / data.productionPerSec) : '∞';

  const costs = data.upgradeCosts;

  return new EmbedBuilder()
    .setColor(0xff6b35)
    .addFields(
      {
        name: '📊 PRODUCTION',
        value:
          `\`\`\`\n` +
          `⚡ ${data.productionPerSec.toFixed(2)} ressources/sec\n` +
          `⏰ ${Math.round(prodPerHour).toLocaleString('fr-FR')} ressources/heure\n` +
          `💵 ~${Math.round(gainPerHour).toLocaleString('fr-FR')} 🪙/heure\n\n` +
          `⚙️ Multiplicateur total: x${(data.productionPerSec * data.synergy / BASE_PRODUCTION).toFixed(2)}\n` +
          `   Base: ${BASE_PRODUCTION}/s | Niv: +${((data.level-1)*0.10).toFixed(2)}/s\n` +
          `   Prestige: +${(data.prestige*0.16).toFixed(2)}/s\n` +
          `   Modules: x${data.modules > 0 ? (1 + data.modules * 0.1).toFixed(2) : '1.00'} | 🔗 Synergies: x${data.synergy.toFixed(2)}\n` +
          `\`\`\``,
        inline: false,
      },
      {
        name: '📦 Stockage',
        value: `${bar}\n${stockPct}%\n**${Math.floor(data.stock).toLocaleString('fr-FR')} / ${data.maxStock.toLocaleString('fr-FR')}**\n⏱️ Plein dans **${pleinDans < 60 ? `< ${pleinDans}s` : `${Math.round(pleinDans/60)}m`}**`,
        inline: true,
      },
      {
        name: '💰 Trésorerie',
        value: `${getUser(userId).balance.toLocaleString('fr-FR')} 🪙\n\nStock = **${Math.floor(data.stock * market.price).toLocaleString('fr-FR')}** 🪙\n(à **${market.price.toFixed(2)}** 🪙/res)`,
        inline: true,
      },
      {
        name: `📈 Marché ${market.status}`,
        value: `${market.advice}`,
        inline: true,
      },
      {
        name: '🛒 AMÉLIORATIONS',
        value:
          `⬆️ **Niveau ${data.level + 1}**\n${costs.niveau.toLocaleString('fr-FR')} 🪙 — +0.10/s production\n\n` +
          `📦 **Capacité +500**\n${costs.stockage.toLocaleString('fr-FR')} 🪙 — +500 stockage\n\n` +
          `💎 **Prestige ${data.prestige + 1}**\n${costs.prestige.toLocaleString('fr-FR')} 🪙 — Bonus permanent`,
        inline: false,
      },
    )
    .setFooter({ text: `${data.modules} modules actifs | Kamori Tycoon` })
    .setTimestamp();
}

// ─────────────────────────────────────────
// BOUTONS
// ─────────────────────────────────────────
function buildButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('tycoon_sell').setLabel('💰 Vendre').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('tycoon_upgrade_niveau').setLabel('⬆️ Niveau').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('tycoon_upgrade_stockage').setLabel('📦 Stockage').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('tycoon_upgrade_prestige').setLabel('💎 Prestige').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('tycoon_refresh').setLabel('🔄 Actualiser').setStyle(ButtonStyle.Secondary),
    ),
  ];
}

// ─────────────────────────────────────────
// COMMANDE +tycoon
// ─────────────────────────────────────────
module.exports = {
  name: 'tycoon',
  async execute(message) {
    let data = getPlayer(message.author.id);
    data = updateProduction(data);
    savePlayer(message.author.id, data);
    const market = getMarket();

    const embed = buildEmbed(message.author.id, data, market);
    message.reply({ embeds: [embed], components: buildButtons() });
  },
};

// ─────────────────────────────────────────
// GESTION DES BOUTONS
// ─────────────────────────────────────────
async function handleTycoonButtons(interaction) {
  const userId = interaction.user.id;
  let data = getPlayer(userId);
  data = updateProduction(data);
  const market = getMarket();
  const user = getUser(userId);

  const action = interaction.customId.replace('tycoon_', '');

  // 💰 Vendre
  if (action === 'sell') {
    if (data.stock < 1) {
      return interaction.reply({ content: '❌ Tu n\'as pas assez de stock à vendre !', ephemeral: true });
    }
    const gain = Math.floor(data.stock * market.price);
    user.balance += gain;
    saveUser(userId, user);
    data.stock = 0;
    savePlayer(userId, data);

    await interaction.reply({ content: `✅ Tu as vendu ton stock pour **${gain.toLocaleString('fr-FR')}** 🪙 !`, ephemeral: true });
    return interaction.message.edit({ embeds: [buildEmbed(userId, data, market)], components: buildButtons() }).catch(() => {});
  }

  // 🔄 Actualiser
  if (action === 'refresh') {
    savePlayer(userId, data);
    return interaction.update({ embeds: [buildEmbed(userId, data, market)], components: buildButtons() });
  }

  // ⬆️ Améliorations
  if (action.startsWith('upgrade_')) {
    const upgradeKey = action.replace('upgrade_', '');
    const upgrade = UPGRADES[upgradeKey];
    if (!upgrade) return interaction.reply({ content: '❌ Amélioration inconnue.', ephemeral: true });

    const cost = data.upgradeCosts[upgradeKey];
    if (user.balance < cost) {
      return interaction.reply({ content: `❌ Tu n'as pas assez de 🪙 ! Il faut **${cost.toLocaleString('fr-FR')}** 🪙`, ephemeral: true });
    }

    user.balance -= cost;
    upgrade.effect(data);

    // Augmente le coût pour la prochaine fois
    data.upgradeCosts[upgradeKey] = Math.round(cost * (upgradeKey === 'niveau' ? 1.5 : upgradeKey === 'stockage' ? 2 : 3));

    saveUser(userId, user);
    savePlayer(userId, data);

    await interaction.reply({ content: `✅ **${upgrade.label}** acheté ! ${upgrade.desc}`, ephemeral: true });
    return interaction.message.edit({ embeds: [buildEmbed(userId, data, market)], components: buildButtons() }).catch(() => {});
  }
}

module.exports.handleTycoonButtons = handleTycoonButtons;
