const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');
const { recordGame } = require('../../utils/profile');

const SUITS = { '♠️': 'black', '♥️': 'red', '♦️': 'red', '♣️': 'black' };
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUIT_LIST = ['♠️', '♥️', '♦️', '♣️'];

function createDeck() {
  const deck = [];
  for (const suit of SUIT_LIST) for (const val of VALUES) deck.push({ val, suit });
  return deck.sort(() => Math.random() - 0.5);
}

function cardVal(c) {
  if (['J','Q','K'].includes(c.val)) return 10;
  if (c.val === 'A') return 11;
  return parseInt(c.val);
}

function handVal(hand) {
  let t = hand.reduce((s,c) => s + cardVal(c), 0);
  let aces = hand.filter(c => c.val === 'A').length;
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return t;
}

function renderCard(c) {
  const color = SUITS[c.suit] === 'red' ? '🟥' : '⬛';
  return `${color}\`${c.val}${c.suit}\``;
}

function renderHand(hand, hideSecond = false) {
  return hand.map((c, i) => (hideSecond && i === 1) ? '🔲`?? `' : renderCard(c)).join(' ');
}

const games = new Map();

module.exports = {
  name: 'blackjack',
  async execute(message, args) {
    const mise = parseInt(args[0]);
    if (isNaN(mise) || mise <= 0) return message.reply('❌ Ex: `-blackjack 50`');
    const user = getUser(message.author.id);
    if (user.balance < mise) return message.reply(`❌ Solde insuffisant : **${user.balance}** 🪙`);

    const deck = createDeck();
    const pH = [deck.pop(), deck.pop()];
    const dH = [deck.pop(), deck.pop()];
    games.set(message.author.id, { pH, dH, deck, mise });

    const pVal = handVal(pH);
    const embed = new EmbedBuilder()
      .setColor(0x2c3e50)
      .setTitle('🃏 Blackjack — Kamori Casino')
      .setDescription(
        `**Mise :** \`${mise.toLocaleString('fr-FR')} 🪙\`\n\n` +
        `**Croupier**\n${renderHand(dH, true)}\n\`? pts\`\n\n` +
        `**Ta main**\n${renderHand(pH)}\n\`${pVal} pts\`` +
        (pVal === 21 ? '\n\n🎉 **BLACKJACK !**' : '')
      )
      .setFooter({ text: 'Kamori Casino • Blackjack' });

    if (pVal === 21) {
      user.balance += Math.floor(mise * 1.5);
      saveUser(message.author.id, user);
      recordGame(message.author.id, true, Math.floor(mise * 1.5));
      games.delete(message.author.id);
      embed.setColor(0xffd700).addFields({ name: '✅ Résultat', value: `Blackjack naturel ! **+${Math.floor(mise * 1.5).toLocaleString('fr-FR')}** 🪙\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙` });
      return message.reply({ embeds: [embed] });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bj_hit_${message.author.id}`).setLabel('🃏 Tirer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`bj_stand_${message.author.id}`).setLabel('✋ Rester').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bj_double_${message.author.id}`).setLabel('💰 Doubler').setStyle(ButtonStyle.Danger).setDisabled(user.balance < mise * 2),
    );

    message.reply({ embeds: [embed], components: [row] });
  },
};

async function handleBlackjack(interaction) {
  const parts = interaction.customId.split('_');
  const action = parts[1];
  const userId = parts[2];

  if (interaction.user.id !== userId) return interaction.reply({ content: '❌ Pas ton jeu !', ephemeral: true });
  const game = games.get(userId);
  if (!game) return interaction.reply({ content: '❌ Aucune partie en cours.', ephemeral: true });

  const { pH, dH, deck, mise } = game;
  const user = getUser(userId);

  const buildEmbed = (color, title, desc, result = null) => {
    const e = new EmbedBuilder().setColor(color).setTitle(title).setDescription(desc).setFooter({ text: 'Kamori Casino • Blackjack' });
    if (result) e.addFields({ name: '📊 Résultat', value: result });
    return e;
  };

  const endGame = async (won, draw = false) => {
    let gain = 0, resultText = '';
    if (draw) {
      resultText = `🤝 Égalité ! Mise remboursée.\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙`;
    } else if (won) {
      gain = mise;
      user.balance += gain;
      resultText = `🎉 Tu gagnes **+${gain.toLocaleString('fr-FR')}** 🪙 !\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙`;
    } else {
      gain = mise;
      user.balance -= gain;
      resultText = `😔 Tu perds **-${gain.toLocaleString('fr-FR')}** 🪙\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙`;
    }
    saveUser(userId, user);
    if (!draw) recordGame(userId, won, gain);
    games.delete(userId);

    const pVal = handVal(pH), dVal = handVal(dH);
    const desc =
      `**Croupier**\n${renderHand(dH)}\n\`${dVal} pts\`\n\n` +
      `**Ta main**\n${renderHand(pH)}\n\`${pVal} pts\``;

    const color = draw ? 0xf39c12 : won ? 0x2ecc71 : 0xe74c3c;
    const title = draw ? '🃏 Égalité' : won ? '🃏 Victoire !' : '🃏 Défaite';

    return interaction.update({ embeds: [buildEmbed(color, title, desc, resultText)], components: [] });
  };

  if (action === 'hit' || action === 'double') {
    if (action === 'double') {
      if (user.balance < mise) return interaction.reply({ content: '❌ Solde insuffisant pour doubler !', ephemeral: true });
      game.mise *= 2;
    }

    pH.push(deck.pop());
    const pVal = handVal(pH);

    if (pVal > 21) return endGame(false);

    if (action === 'double') {
      while (handVal(dH) < 17) dH.push(deck.pop());
      const dVal = handVal(dH);
      return endGame(dVal > 21 || pVal > dVal, pVal === dVal);
    }

    const desc =
      `**Mise :** \`${game.mise.toLocaleString('fr-FR')} 🪙\`\n\n` +
      `**Croupier**\n${renderHand(dH, true)}\n\`? pts\`\n\n` +
      `**Ta main**\n${renderHand(pH)}\n\`${pVal} pts\``;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('🃏 Tirer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('✋ Rester').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bj_double_${userId}`).setLabel('💰 Doubler').setStyle(ButtonStyle.Danger).setDisabled(true),
    );

    return interaction.update({ embeds: [buildEmbed(0x2c3e50, '🃏 Blackjack', desc)], components: [row] });
  }

  if (action === 'stand') {
    while (handVal(dH) < 17) dH.push(deck.pop());
    const pVal = handVal(pH), dVal = handVal(dH);
    return endGame(dVal > 21 || pVal > dVal, pVal === dVal);
  }
}

module.exports.handleBlackjack = handleBlackjack;
