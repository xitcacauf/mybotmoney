const logger = require("../utils/logger");
const { errorEmbed } = require("../utils/embed");

// Dedup: Discord can occasionally deliver the same interaction twice.
// We claim each interaction ID once — subsequent deliveries are silently dropped.
const processedInteractions = new Set();

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Layer 1: interaction ID dedup (synchronous, before any await)
    if (processedInteractions.has(interaction.id)) {
      logger.warn(`[DEDUP] interaction ${interaction.id} already processed — dropped`);
      return;
    }
    processedInteractions.add(interaction.id);
    setTimeout(() => processedInteractions.delete(interaction.id), 15_000);

    // Layer 2: guard against already-acknowledged interactions
    if (interaction.replied || interaction.deferred) return;

    logger.info(`[INTERACTION] id=${interaction.id} type=${interaction.type} customId=${interaction.customId || "?"} user=${interaction.user?.id}`);

    try {
      if (interaction.isButton()) {
        // Check registered handlers first (exact match)
        let handler = client.buttons.get(interaction.customId);

        // Check regex-pattern handlers
        if (!handler && client._buttonPatterns) {
          const match = client._buttonPatterns.find((p) => p.pattern.test(interaction.customId));
          if (match) handler = match.handler;
        }

        // No registered handler — silently return so any active collector can handle it
        if (!handler) return;

        await handler.execute(interaction, client);
        return;
      }

      if (interaction.isModalSubmit()) {
        let handler = client.modals.get(interaction.customId);
        if (!handler && client._modalPatterns) {
          const match = client._modalPatterns.find((p) => p.pattern.test(interaction.customId));
          if (match) handler = match.handler;
        }
        if (!handler) return;
        await handler.execute(interaction, client);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        const menu = client.selectMenus.get(interaction.customId);
        if (!menu) return;
        await menu.execute(interaction, client);
        return;
      }
    } catch (err) {
      logger.error(`[INTERACTION ERROR] id=${interaction.id} customId=${interaction.customId || "?"}: ${err.message}`);
      try {
        const embed = errorEmbed("Erro", "Ocorreu um erro ao processar esta interação.");
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed] }).catch(() => {});
        } else if (!interaction.replied) {
          await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }
      } catch {}
    }
  },
};
