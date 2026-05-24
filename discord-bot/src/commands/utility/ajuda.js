const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const { checkPermission } = require("../../utils/permissions");

const PAGES = [
  {
    title: "💳 Banco & Economia",
    color: 0x00d4aa,
    desc: "Gerencie sua vida financeira — saldo, banco, extrato e investimentos.",
    fields: [
      { name: "!saldo [@user]", value: "💰 Ver carteira, banco e patrimônio" },
      { name: "!banco", value: "🏦 Painel bancário (depositar/sacar/juros)" },
      { name: "!extrato", value: "📋 Histórico de transações recentes" },
      { name: "!cartao", value: "💎 Ver seu cartão e categoria" },
      { name: "!patrimonio [@user]", value: "🏦 Visão geral de toda sua riqueza" },
      { name: "!investir <valor> <tipo>", value: "📊 Investir em ações, crypto ou imóveis" },
      { name: "!pix @user <valor>", value: "⚡ Transferência instantânea" },
      { name: "!pagar @user <valor>", value: "💸 Enviar moedas para alguém" },
      { name: "!ranking ricos", value: "👑 Top 10 mais ricos do servidor" },
    ],
  },
  {
    title: "🛒 Ganhar & Trabalho",
    color: 0xffd700,
    desc: "Trabalhe, estude, escolha uma profissão e ganhe dinheiro.",
    fields: [
      { name: "!diario", value: "🎁 Recompensa diária (+ streak e bônus casal)" },
      { name: "!trabalhar", value: "💼 Trabalhe na sua profissão e ganhe moedas" },
      { name: "!emprego", value: "🏢 Ver sua carreira atual e mudar de emprego" },
      { name: "!emprego lista", value: "📋 Ver todos os empregos disponíveis" },
      { name: "!emprego escolher <id>", value: "✅ Escolher ou mudar de profissão (1x/semana)" },
      { name: "!faculdade", value: "🎓 Ver seu curso universitário atual" },
      { name: "!faculdade listar", value: "📚 Ver cursos disponíveis na faculdade" },
      { name: "!faculdade entrar <curso>", value: "📝 Se matricular em um curso" },
      { name: "!faculdade estudar", value: "✏️ Sessão de estudos (cooldown: 2h)" },
      { name: "!crime", value: "🔫 Cometa um crime — alto risco, alta recompensa" },
      { name: "!roubar @user", value: "🦹 Tente roubar até 25% da carteira de alguém" },
      { name: "!tesouro", value: "🗺️ Procurar tesouro durante evento" },
    ],
  },
  {
    title: "🛒 Loja & Itens",
    color: 0xff9900,
    desc: "Compre itens, use consumíveis e dê presentes.",
    fields: [
      { name: "!loja", value: "🛒 Ver todos os itens disponíveis" },
      { name: "!loja status", value: "✨ Auras, badges e títulos de status" },
      { name: "!loja pets", value: "🐾 Pets para adotar" },
      { name: "!loja dark", value: "⛓️ Itens Dark Love" },
      { name: "!comprar <id>", value: "✅ Comprar um item da loja" },
      { name: "!usar <id>", value: "⚗️ Usar item consumível do inventário" },
      { name: "!presente @user <id>", value: "🎁 Dar um presente para alguém (+vínculo)" },
      { name: "!inventario", value: "🎒 Ver seus itens e equipamentos" },
    ],
  },
  {
    title: "❤️ Social & Relacionamentos",
    color: 0xff69b4,
    desc: "Namore, case, flerte e construa relacionamentos no servidor.",
    fields: [
      { name: "!perfil [@user]", value: "👤 Perfil social completo" },
      { name: "!namoro @user", value: "💕 Evoluir relação (conhecendo → namorando → casado)" },
      { name: "!namoro ver", value: "📊 Ver sua etapa atual de relacionamento" },
      { name: "!casar @user", value: "💍 Pedir em casamento" },
      { name: "!divorcio", value: "💔 Solicitar divórcio" },
      { name: "!web", value: "💻 Perfil de namoro online — apareça nas buscas" },
      { name: "!web criar [bio]", value: "✅ Ativar perfil web e aparecer online" },
      { name: "!web ver", value: "🔍 Ver perfis de namoro online" },
      { name: "!gf", value: "💌 Procurar parceiro(a) ou se oferecer" },
      { name: "!gf quero [mensagem]", value: "💕 Aparecer na lista de disponíveis" },
      { name: "!gf ver", value: "👀 Ver quem está disponível" },
      { name: "!cantada @user", value: "😏 Enviar uma cantada" },
      { name: "!segredo @user", value: "💌 Admirar alguém em segredo (anônimo)" },
      { name: "!vinculo [@user]", value: "⛓️ Ver seus vínculos de obsessão" },
    ],
  },
  {
    title: "🧠 Identidade & Psicologia",
    color: 0x9b59b6,
    desc: "Arquétipo, personalidade dinâmica, memórias, reputação e status social.",
    fields: [
      { name: "!personalidade", value: "🧠 Ver perfil psicológico e arquétipo dinâmico" },
      { name: "!personalidade escolher", value: "🎭 Escolher arquétipo (muda com suas ações)" },
      { name: "!memorias [@user]", value: "📸 Álbum de memórias do relacionamento" },
      { name: "!status", value: "👑 Ver títulos de elite do servidor" },
      { name: "!calor", value: "🌡️ Termômetro social do servidor" },
      { name: "!niveis [@user]", value: "📈 Nível de XP e progresso" },
      { name: "!bio <texto>", value: "✏️ Definir sua bio do perfil" },
      { name: "!reputacao @user", value: "⭐ Dar +1 reputação para alguém (1x/dia)" },
      { name: "!ranking xp", value: "⭐ Top XP do servidor" },
      { name: "!ranking msgs", value: "💬 Top mensagens enviadas" },
      { name: "!ranking casais", value: "💑 Casais mais antigos" },
    ],
  },
  {
    title: "🖤 Dark Love",
    color: 0x1a0a2e,
    desc: "Sistema de vínculos intensos, dominância e submissão — 100% consensual.",
    fields: [
      { name: "!darklove", value: "🖤 Painel Dark Love — definir papel" },
      { name: "!coleira @user", value: "⛓️ Propor colocar coleira (consensual)" },
      { name: "!tirarcoleira [@user]", value: "🔓 Remover coleira" },
      { name: "!controlar @user <ação>", value: "🎮 Controlar pessoa com coleira (nick/mute/mover)" },
      { name: "!contrato @user <tipo>", value: "📜 Propor contrato Dark Love" },
      { name: "!contrato tipos", value: "📋 Ver todos os tipos de contrato e regras" },
      { name: "!contrato ver", value: "🔍 Ver seu contrato ativo" },
      { name: "!contrato resetar @user", value: "💀 Punição máxima — reset do personagem" },
      { name: "!intimar", value: "🔥 Sessão de intimidade diária (pode gerar filhos!)" },
      { name: "!desafio @user <texto>", value: "🎯 Enviar desafio personalizado" },
      { name: "!prova @user", value: "🔒 Enviar prova privada (auto-delete)" },
      { name: "!confissao", value: "🕵️ Confissão 100% anônima" },
    ],
  },
  {
    title: "🏠 Vida Virtual",
    color: 0x27ae60,
    desc: "Casa, filhos naturais/adotados, pet, duo e eventos — viva sua segunda vida!",
    fields: [
      { name: "!casa", value: "🏠 Ver e gerenciar sua casa virtual" },
      { name: "!casa tema <nome>", value: "🎨 Mudar tema da casa" },
      { name: "!casa visitar @user", value: "👀 Visitar a casa de alguém" },
      { name: "!filhos", value: "👶 Ver seus filhos (naturais e adotados)" },
      { name: "!filhos adotar", value: "💕 Adotar um filho (2.000 💰 — casados)" },
      { name: "!intimar", value: "🔥 Intimidade com parceiro — chance de bebê natural!" },
      { name: "!filhos cuidar", value: "🍼 Cuidar dos filhos e ver evolução" },
      { name: "!filhos ensinar", value: "📚 Ensinar — aumenta XP e ganho de moedas" },
      { name: "!pet", value: "🐾 Ver seu pet e cuidar dele" },
      { name: "!duo", value: "🎮 Criar perfil de duo gamer" },
      { name: "!evento", value: "🎉 Ver evento ativo no servidor" },
      { name: "!feed <texto>", value: "📱 Publicar no feed social" },
      { name: "!feed ver", value: "📱 Ver o feed social do servidor" },
      { name: "!ranking", value: "🏆 Rankings gerais" },
    ],
  },
  {
    title: "ℹ️ Utilitários & Suporte",
    color: 0x3498db,
    desc: "Informações gerais, ticket, ping e recursos do servidor.",
    fields: [
      { name: "!ping", value: "🏓 Latência do bot" },
      { name: "!serverinfo", value: "🏠 Informações do servidor" },
      { name: "!userinfo [@user]", value: "👤 Informações de um usuário" },
      { name: "!ticket", value: "🎫 Abrir ticket de suporte" },
      { name: "!apoie", value: "💖 Apoie o servidor" },
      { name: "!ajuda", value: "📚 Este menu de ajuda" },
    ],
  },
];

const MOD_PAGE = {
  title: "🛡️ Moderação (Staff Only)",
  color: 0xe74c3c,
  desc: "Ferramentas exclusivas para staff e administradores.",
  fields: [
    { name: "!ban @user [motivo]", value: "🔨 Banir membro permanentemente" },
    { name: "!kick @user [motivo]", value: "👢 Expulsar membro" },
    { name: "!mute @user <tempo>", value: "🔇 Silenciar (10m, 1h, 1d)" },
    { name: "!warn @user [motivo]", value: "⚠️ Advertir membro" },
    { name: "!warns [@user]", value: "📋 Ver advertências" },
    { name: "!unban <id>", value: "✅ Desbanir por ID" },
    { name: "!clear <1-100>", value: "🧹 Limpar mensagens do canal" },
    { name: "!vip @user [dias]", value: "💎 Conceder status VIP (padrão 30 dias)" },
    { name: "!vip remover @user", value: "❌ Remover VIP de um membro" },
    { name: "!vip lista", value: "📋 Ver todos os VIPs ativos" },
    { name: "!config", value: "⚙️ Painel de configuração do servidor" },
  ],
};

function buildEmbed(page, index, total, prefix) {
  return new EmbedBuilder()
    .setColor(page.color)
    .setTitle(page.title)
    .setDescription(page.desc)
    .addFields(page.fields.map((f) => ({ name: `\`${prefix}${f.name}\``, value: f.value, inline: true })))
    .setFooter({ text: `Página ${index + 1} de ${total} • Use ◀ ▶ para navegar • Fecha em 3 minutos` })
    .setTimestamp();
}

function buildRow(index, total, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("help_prev")
      .setLabel("◀ Anterior")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || index === 0),
    new ButtonBuilder()
      .setCustomId("help_page_indicator")
      .setLabel(`${index + 1} / ${total}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("help_next")
      .setLabel("Próximo ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || index === total - 1)
  );
}

module.exports = {
  name: "ajuda",
  aliases: ["help", "h", "menu", "comandos"],
  description: "Painel de comandos — navegue com os botões ◀ ▶",
  cooldown: 5,
  async execute(message, args, client) {
    const isStaff = checkPermission(message, "staff");
    const prefix = config.prefix;

    const allPages = isStaff ? [...PAGES, MOD_PAGE] : PAGES;
    let currentPage = 0;

    const msg = await message.reply({
      embeds: [buildEmbed(allPages[0], 0, allPages.length, prefix)],
      components: [buildRow(0, allPages.length)],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 3 * 60 * 1000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "help_prev") currentPage = Math.max(0, currentPage - 1);
      if (i.customId === "help_next") currentPage = Math.min(allPages.length - 1, currentPage + 1);
      await i.update({
        embeds: [buildEmbed(allPages[currentPage], currentPage, allPages.length, prefix)],
        components: [buildRow(currentPage, allPages.length)],
      });
    });

    collector.on("end", () => {
      msg.edit({ components: [buildRow(currentPage, allPages.length, true)] }).catch(() => {});
    });
  },
};
