const { handleBlackjack } = require('../commands/casino/blackjack');
const { handleGiveaway } = require('../commands/casino/giveaway');
const { handleTycoonButtons } = require('../commands/tycoon/tycoon');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('bj_')) await handleBlackjack(interaction);
    if (interaction.customId === 'giveaway_join') await handleGiveaway(interaction);
    if (interaction.customId.startsWith('tycoon_')) await handleTycoonButtons(interaction);
  },
};
