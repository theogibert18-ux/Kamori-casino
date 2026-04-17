const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');
const { getProfile, saveProfile } = require('../../utils/profile');
const { load, save } = require('../../utils/db');

// ─── CATALOGUE ───
const SHOP_ITEMS = {
  // 🎭 Cosmétiques
  badge_casino:   { name: '🎰 Badge Casino',        price: 5000,   type: 'badge',   value: '🎰', desc: 'Badge exclusif affiché sur ton profil' },
  badge_elite:    { name: '⚡ Badge Élite',          price: 15000,  type: 'badge',   value: '⚡', desc: 'Badge rare pour les meilleurs joueurs' },
  badge_legend:   { name: '💎 Badge Légende',        price: 50000,  type: 'badge',   value: '💎', desc: 'Badge ultra-rare pour les légendes' },
  title_gambler:  { name: '🎲 Titre "Le Flambeur"', price: 8000,   type: 'title',   value: '🎲 Le Flambeur', desc: 'Titre affiché sur ton profil' },
  title_king:     { name: '👑 Titre "Roi du Casino"', price: 25000, type: 'title',   value: '👑 Roi du Casino', desc: 'Titre prestigieux' },
  title_legend:   { name: '🌌 Titre "Transcendant"', price: 100000, type: 'title',  value: '🌌 Transcendant', desc: 'Le titre ultime' },

  // 🚀 Boosts Casino
  boost_x2:      { name: '🚀 Boost x2 (1h)',        price: 3000,   type: 'boost',   value: 'x2_1h', desc: 'Double tes gains au casino pendant 1h' },
  boost_x3:      { name: '🔥 Boost x3 (30min)',     price: 7500,   type: 'boost',   value: 'x3_30m', desc: 'Triple tes gains pendant 30min' },
  boost_lucky:   { name: '🍀 Boost Chance (1h)',    price: 5000,   type: 'boost',   value: 'lucky_1h', desc: '+15% de chance de gagner pendant 1h' },

  // 🎟️ Tirages Spéciaux
  tirage_or:     { name: '🥇 Tirage Or',            price: 10000,  type: 'tirage',  value: 'gold', desc: 'Tirage spécial avec gains x5' },
  tirage_platine:{ name: '💠 Tirage Platine',       price: 30000,  type: 'tirage',  value: 'platine', desc: 'Tirage ultra avec gains x15' },

  // 💰 Coins Bonus
  coins_500:     { name: '💰 500 Kamori Coins',     price: 2500,   type: 'coins',   value: 500, desc: 'Achat de Kamori Coins bonus' },
  coins_2000:    { name: '💰 2000 Kamori Coins',    price: 8000,   type: 'coins',   value: 2000, desc: 'Pack de Kamori Coins' },
};

module.exports = {
  name: 'shop',
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const user = getUser(message.author.id);

    // -shop (voir catalogue)
    if (!sub) {
      const embed = new EmbedBuilder()
        .setColor(0xff6b35)
        .setTitle('🛒 Kamori Shop')
        .setDescription(`💳 Ton solde : **${user.balance.toLocaleString('fr-FR')}** 🪙\n\nUtilise \`-shop acheter <id>\` pour acheter.`)
        .addFields(
          {
            name: '🎭 Cosmétiques',
            value: Object.entries(SHOP_ITEMS)
              .filter(([,i]) => i.type === 'badge' || i.type === 'title')
              .map(([id, i]) => `\`${id}\` — **${i.name}** — ${i.price.toLocaleString('fr-FR')} 🪙\n> ${i.desc}`)
              .join('\n'),
          },
          {
            name: '🚀 Boosts Casino',
            value: Object.entries(SHOP_ITEMS)
              .filter(([,i]) => i.type === 'boost')
              .map(([id, i]) => `\`${id}\` — **${i.name}** — ${i.price.toLocaleString('fr-FR')} 🪙\n> ${i.desc}`)
              .join('\n'),
          },
          {
            name: '🎟️ Tirages Spéciaux',
            value: Object.entries(SHOP_ITEMS)
              .filter(([,i]) => i.type === 'tirage')
              .map(([id, i]) => `\`${id}\` — **${i.name}** — ${i.price.toLocaleString('fr-FR')} 🪙\n> ${i.desc}`)
              .join('\n'),
          },
          {
            name: '💰 Coins Bonus',
            value: Object.entries(SHOP_ITEMS)
              .filter(([,i]) => i.type === 'coins')
              .map(([id, i]) => `\`${id}\` — **${i.name}** — ${i.price.toLocaleString('fr-FR')} 🪙\n> ${i.desc}`)
              .join('\n'),
          },
        )
        .setFooter({ text: 'Kamori Casino • Shop' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // -shop acheter <id>
    if (sub === 'acheter') {
      const itemId = args[1]?.toLowerCase();
      const item = SHOP_ITEMS[itemId];
      if (!item) return message.reply(`❌ Article introuvable. Utilise \`-shop\` pour voir le catalogue.`);
      if (user.balance < item.price) return message.reply(`❌ Solde insuffisant ! Il faut **${item.price.toLocaleString('fr-FR')}** 🪙`);

      user.balance -= item.price;
      saveUser(message.author.id, user);

      const profile = getProfile(message.author.id);
      const inventory = load('inventory');
      if (!inventory[message.author.id]) inventory[message.author.id] = [];

      if (item.type === 'badge') {
        profile.badge = item.value;
        saveProfile(message.author.id, profile);
      } else if (item.type === 'title') {
        profile.title = item.value;
        saveProfile(message.author.id, profile);
      } else if (item.type === 'coins') {
        user.balance += item.value;
        saveUser(message.author.id, user);
      } else if (item.type === 'boost') {
        const durations = { 'x2_1h': 3600000, 'x3_30m': 1800000, 'lucky_1h': 3600000 };
        inventory[message.author.id].push({
          type: 'boost',
          value: item.value,
          expiresAt: Date.now() + (durations[item.value] || 3600000),
          name: item.name,
        });
        save('inventory', inventory);
      } else if (item.type === 'tirage') {
        inventory[message.author.id].push({
          type: 'tirage',
          value: item.value,
          name: item.name,
        });
        save('inventory', inventory);
      }

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('✅ Achat effectué !')
        .setDescription(`Tu as acheté **${item.name}** pour **${item.price.toLocaleString('fr-FR')}** 🪙 !\n\n${item.desc}\n\nSolde restant : **${user.balance.toLocaleString('fr-FR')}** 🪙`)
        .setTimestamp()
      ]});
    }

    // -shop inventaire
    if (sub === 'inventaire') {
      const inventory = load('inventory');
      const items = inventory[message.author.id] || [];
      const profile = getProfile(message.author.id);

      if (!items.length && !profile.badge && !profile.title) {
        return message.reply('❌ Ton inventaire est vide. Achète des articles avec `-shop acheter <id>`');
      }

      const lines = [];
      if (profile.badge) lines.push(`🎭 Badge actif : **${profile.badge}**`);
      if (profile.title) lines.push(`📛 Titre actif : **${profile.title}**`);

      for (const item of items) {
        if (item.type === 'boost') {
          const remaining = item.expiresAt - Date.now();
          if (remaining > 0) {
            lines.push(`🚀 **${item.name}** — Expire dans ${Math.round(remaining / 60000)}min`);
          }
        } else if (item.type === 'tirage') {
          lines.push(`🎟️ **${item.name}** — Non utilisé`);
        }
      }

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0xff6b35)
        .setTitle('🎒 Inventaire')
        .setDescription(lines.join('\n') || 'Vide')
        .setTimestamp()
      ]});
    }
  },
};
