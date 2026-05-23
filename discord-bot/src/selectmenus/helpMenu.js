const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");

const pages = {
  economy: {
    title: "💳 Banco & Economia",
    color: 0x00d4aa,
    desc: "Gerencie sua vida financeira virtual — saldo, banco, extrato e investimentos.",
    fields: [
      { name: "!saldo [@user]", value: "💰 Ver carteira, banco e patrimônio total" },
      { name: "!banco", value: "🏦 Painel bancário completo (depositar/sacar/juros)" },
      { name: "!banco depositar <valor>", value: "💾 Depositar moedas no banco (rende 2%/dia)" },
      { name: "!banco sacar <valor>", value: "💳 Sacar dinheiro do banco para a carteira" },
      { name: "!banco juros", value: "📈 Ver rendimento pendente do banco" },
      { name: "!extrato", value: "📋 Histórico de ganhos e gastos recentes" },
      { name: "!cartao", value: "💎 Ver seu cartão virtual e categoria" },
      { name: "!patrimonio [@user]", value: "🏦 Visão geral de toda a riqueza (casa, banco, itens)" },
      { name: "!investir <valor> <tipo>", value: "📊 Investir em ações, crypto ou imóveis fictícios" },
      { name: "!pix @user <valor>", value: "⚡ Transferência estilizada para outro usuário" },
      { name: "!pagar @user <valor>", value: "💸 Enviar moedas para alguém" },
      { name: "!ranking ricos", value: "👑 Top 10 mais ricos do servidor" },
    ],
  },
  earn: {
    title: "🛒 Ganhar & Gastar",
    color: 0xffd700,
    desc: "Trabalhe, cometa crimes, compre na loja e gerencie seus itens.",
    fields: [
      { name: "!diario", value: "🎁 Recompensa diária (+ bônus de streak e casal!)" },
      { name: "!trabalhar", value: "💼 Trabalhe e ganhe 80-1000 💰 (cooldown: 1h)" },
      { name: "!crime", value: "🔫 Cometa um crime — alto risco, alta recompensa" },
      { name: "!roubar @user", value: "🦹 Tente roubar até 25% da carteira de alguém" },
      { name: "!tesouro", value: "🗺️ Procure o tesouro durante evento de Caça ao Tesouro" },
      { name: "!loja", value: "🛒 Ver todos os itens — use !loja <categoria>" },
      { name: "!loja status", value: "✨ Itens de status: auras, badges, coroa" },
      { name: "!loja pets", value: "🐾 Pets disponíveis para adotar" },
      { name: "!loja dark", value: "⛓️ Itens Dark Love: coleiras de ouro" },
      { name: "!comprar <id>", value: "✅ Comprar um item da loja pelo ID" },
      { name: "!usar <id>", value: "⚗️ Usar consumível do inventário" },
      { name: "!presente @user <id>", value: "🎁 Dar um presente para alguém (+vínculo)" },
      { name: "!inventario", value: "🎒 Ver seus itens, pets e equipamentos" },
    ],
  },
  dating: {
    title: "❤️ Social & Namoro",
    color: 0xff69b4,
    desc: "Interaja, flerte, case e construa relacionamentos no servidor.",
    fields: [
      { name: "!perfil [@user]", value: "👤 Perfil social completo: status, arquétipo, vínculos, casa" },
      { name: "!namoro [@user]", value: "💕 Convidar alguém para evoluir a relação (conhecendo→namorando)" },
      { name: "!namoro ver", value: "📊 Ver sua etapa atual do relacionamento" },
      { name: "!casar @user", value: "💍 Pedir em casamento (precisa de !comprar ring)" },
      { name: "!divorcio", value: "💔 Solicitar divórcio do parceiro atual" },
      { name: "!cantada @user", value: "😏 Enviar uma cantada para alguém" },
      { name: "!segredo @user", value: "💌 Admire alguém em segredo (anônimo)" },
      { name: "!segredo ver", value: "🔒 Ver quantos admiradores secretos você tem" },
      { name: "!segredo revelar", value: "💘 Revelar match de admiração mútua" },
      { name: "!vinculo [@user]", value: "⛓️ Ver seus vínculos de obsessão (nível por interações)" },
      { name: "!duo", value: "🎮 Procurar parceiro de jogo (matchmaking)" },
      { name: "!feed postar <texto>", value: "📱 Publicar no feed social do servidor" },
      { name: "!feed", value: "📱 Ver as últimas publicações do feed" },
      { name: "!reputacao @user", value: "⭐ Dar +1 reputação para alguém (1x/dia)" },
      { name: "!bio <texto>", value: "✏️ Definir sua bio do perfil" },
    ],
  },
  identity: {
    title: "🧠 Identidade & Psicologia",
    color: 0x9b59b6,
    desc: "Defina seu arquétipo, veja memórias, status de elite e calor social.",
    fields: [
      { name: "!personalidade", value: "🧠 Ver seu perfil psicológico e arquétipo" },
      { name: "!personalidade escolher", value: "🎭 Escolher seu arquétipo (muda a cada 7 dias)" },
      { name: "!personalidade @user", value: "🔍 Ver arquétipo de outro usuário" },
      { name: "!memorias [@user]", value: "📸 Álbum de memórias do relacionamento" },
      { name: "!status", value: "👑 Ver títulos de elite do servidor" },
      { name: "!status @user", value: "🏆 Ver título elite de um usuário" },
      { name: "!calor", value: "🌡️ Termômetro social: quanto mais quente, mais bônus!" },
      { name: "!niveis [@user]", value: "📈 Ver nível de XP e progresso" },
      { name: "!ranking xp", value: "⭐ Top XP do servidor" },
      { name: "!ranking msgs", value: "💬 Top mensagens" },
      { name: "!ranking casais", value: "💑 Casais mais antigos" },
      { name: "!ranking ativos", value: "🎙️ Mais tempo em call" },
    ],
  },
  darklove: {
    title: "🖤 Dark Love",
    color: 0x1a0a2e,
    desc: "Sistema de vínculos intensos, dominância e submissão — 100% consensual.",
    fields: [
      { name: "!darklove", value: "🖤 Painel Dark Love — definir seu papel" },
      { name: "!coleira @user", value: "⛓️ Propor colocar coleira digital (consensual)" },
      { name: "!tirarcoleira [@user]", value: "🔓 Remover coleira (dono ou coleirado podem usar)" },
      { name: "!contrato @user <tipo>", value: "📜 Propor contrato Dark Love (submissao/protecao/fidelidade...)" },
      { name: "!desafio [@user] [texto]", value: "🎯 Enviar desafio dark para alguém (ou sortear)" },
      { name: "!prova @user", value: "🔒 Enviar prova privada com auto-delete (DM + mensagem)" },
      { name: "!confissao", value: "🕵️ Confissão 100% anônima no servidor" },
    ],
  },
  life: {
    title: "🏠 Vida Virtual",
    color: 0x27ae60,
    desc: "Casa, filhos, pet, inventário e eventos — viva sua segunda vida!",
    fields: [
      { name: "!casa", value: "🏠 Ver e gerenciar sua casa virtual" },
      { name: "!casa tema <nome>", value: "🎨 Mudar tema: default, dark, neon, romantico, gamer, luxo" },
      { name: "!casa desc <texto>", value: "✏️ Definir descrição da casa" },
      { name: "!casa visitar @user", value: "👀 Visitar a casa de alguém" },
      { name: "!filhos", value: "👶 Ver seus filhos adotados" },
      { name: "!filhos adotar", value: "💕 Adotar um filho (custo: 2.000 💰 — casados)" },
      { name: "!filhos cuidar", value: "🍼 Cuidar dos filhos (+xp, +felicidade)" },
      { name: "!filhos ensinar", value: "📚 Ensinar os filhos (recompensas)" },
      { name: "!filhos brincar", value: "🎮 Brincar com os filhos (+felicidade)" },
      { name: "!pet", value: "🐾 Ver seu pet e status" },
      { name: "!evento", value: "🎉 Ver evento ativo no servidor" },
      { name: "!tesouro", value: "🗺️ Procurar tesouro (durante evento)" },
      { name: "!ranking", value: "🏆 Rankings gerais: ricos, xp, msgs, casais, ativos" },
    ],
  },
  info: {
    title: "ℹ️ Utilitários",
    color: 0x3498db,
    desc: "Informações gerais do bot, servidor e usuários.",
    fields: [
      { name: "!ping", value: "🏓 Latência do bot e do Discord" },
      { name: "!serverinfo", value: "🏠 Informações detalhadas do servidor" },
      { name: "!userinfo [@user]", value: "👤 Informações de um usuário" },
      { name: "!ticket", value: "🎫 Abrir ticket de suporte" },
      { name: "!bio <texto>", value: "✏️ Definir sua bio (aparece no !perfil)" },
      { name: "!apoie", value: "💖 Apoie o servidor com uma doação" },
      { name: "!ajuda <categoria>", value: "📚 Este menu de ajuda" },
    ],
  },
  moderation: {
    title: "🛡️ Moderação (Staff Only)",
    color: 0xe74c3c,
    desc: "Ferramentas exclusivas para staff e administradores.",
    fields: [
      { name: "!ban @user [motivo]", value: "🔨 Banir membro permanentemente" },
      { name: "!kick @user [motivo]", value: "👢 Expulsar membro do servidor" },
      { name: "!mute @user <tempo> [motivo]", value: "🔇 Silenciar (ex: 10m, 1h, 1d)" },
      { name: "!warn @user [motivo]", value: "⚠️ Advertir membro" },
      { name: "!warns [@user]", value: "📋 Ver advertências de um membro" },
      { name: "!unban <id>", value: "✅ Desbanir usuário por ID" },
      { name: "!softban @user", value: "🔄 Softban (bane e desbane, limpa msgs)" },
      { name: "!clear <1-100>", value: "🧹 Limpar mensagens do canal" },
      { name: "!config", value: "⚙️ Painel de configuração do servidor" },
    ],
  },
};

module.exports = {
  customId: "help_menu",
  async execute(interaction, client) {
    const value = interaction.values[0];
    const page = pages[value];
    if (!page) return interaction.reply({ content: "❌ Categoria inválida.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(page.color || config.colors.primary)
      .setTitle(page.title)
      .setDescription(page.desc)
      .addFields(
        page.fields.map((f) => ({
          name: `\`${f.name}\``,
          value: f.value,
          inline: true,
        }))
      )
      .setFooter({
        text: `Prefixo: ${config.prefix} • Use !ajuda para voltar ao menu`,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
