const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');

const CARDS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUITS = ['♠️','♥️','♦️','♣️'];

function draw() { return { value: CARDS[Math.floor(Math.random()*CARDS.length)], suit: SUITS[Math.floor(Math.random()*SUITS.length)] }; }
function cardVal(c) { if (['J','Q','K'].includes(c.value)) return 10; if (c.value==='A') return 11; return parseInt(c.value); }
function handVal(hand) { let t=hand.reduce((s,c)=>s+cardVal(c),0),a=hand.filter(c=>c.value==='A').length; while(t>21&&a>0){t-=10;a--;} return t; }
function fmt(hand) { return hand.map(c=>`${c.value}${c.suit}`).join(' '); }

const games = new Map();

module.exports = {
  name: 'blackjack',
  async execute(message, args) {
    const mise = parseInt(args[0]);
    if (isNaN(mise)||mise<=0) return message.reply('❌ Ex: `+blackjack 50`');
    const user = getUser(message.author.id);
    if (user.balance<mise) return message.reply(`❌ Solde insuffisant : **${user.balance}** 🪙`);

    const pH=[draw(),draw()], dH=[draw(),draw()];
    games.set(message.author.id, {pH,dH,mise});

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bj_hit_${message.author.id}`).setLabel('🃏 Tirer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`bj_stand_${message.author.id}`).setLabel('✋ Rester').setStyle(ButtonStyle.Secondary),
    );

    message.reply({ embeds: [new EmbedBuilder().setColor(0x2c3e50).setTitle('🃏 Blackjack').addFields({name:'Ta main',value:`${fmt(pH)} (${handVal(pH)})`,inline:true},{name:'Croupier',value:`${pH[0].value}${pH[0].suit} ❓`,inline:true}).setFooter({text:`Mise : ${mise} 🪙`})], components: [row] });
  },
};

async function handleBlackjack(interaction) {
  const [,action,userId] = interaction.customId.split('_');
  if (interaction.user.id!==userId) return interaction.reply({content:'❌ Pas ton jeu !',ephemeral:true});
  const game = games.get(userId);
  if (!game) return interaction.reply({content:'❌ Aucune partie.',ephemeral:true});
  const {pH,dH,mise} = game;

  if (action==='hit') {
    pH.push(draw());
    const t=handVal(pH);
    if (t>21) {
      const user=getUser(userId); user.balance-=mise; saveUser(userId,user); games.delete(userId);
      return interaction.update({embeds:[new EmbedBuilder().setColor(0xe74c3c).setTitle('🃏 Bust !').setDescription(`Ta main : ${fmt(pH)} (${t})\n😔 Perdu ! **-${mise}** 🪙\nSolde : **${user.balance}** 🪙`)],components:[]});
    }
    return interaction.update({embeds:[new EmbedBuilder().setColor(0x2c3e50).setTitle('🃏 Blackjack').addFields({name:'Ta main',value:`${fmt(pH)} (${t})`,inline:true},{name:'Croupier',value:`${dH[0].value}${dH[0].suit} ❓`,inline:true}).setFooter({text:`Mise : ${mise} 🪙`})],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('🃏 Tirer').setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('✋ Rester').setStyle(ButtonStyle.Secondary))]});
  }

  if (action==='stand') {
    while(handVal(dH)<17) dH.push(draw());
    const pT=handVal(pH),dT=handVal(dH);
    const user=getUser(userId);
    let color,result;
    if (dT>21||pT>dT) { user.balance+=mise; color=0x2ecc71; result=`🎉 Gagné ! **+${mise}** 🪙`; }
    else if (pT===dT) { color=0xf39c12; result=`🤝 Égalité !`; }
    else { user.balance-=mise; color=0xe74c3c; result=`😔 Perdu ! **-${mise}** 🪙`; }
    saveUser(userId,user); games.delete(userId);
    return interaction.update({embeds:[new EmbedBuilder().setColor(color).setTitle('🃏 Résultat').addFields({name:'Ta main',value:`${fmt(pH)} (${pT})`,inline:true},{name:'Croupier',value:`${fmt(dH)} (${dT})`,inline:true}).setDescription(`\n${result}\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙`)],components:[]});
  }
}

module.exports.handleBlackjack = handleBlackjack;
