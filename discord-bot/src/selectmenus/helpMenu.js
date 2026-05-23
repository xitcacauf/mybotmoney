const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");

const pages = {
  economy: {
    title: "💳 Banco & Economia",
    color: 0x00d4aa,
    desc: "Gerencie sua vida financeira — saldo, banco, extrato e investimentos.",
    fields: [
      { name: "!saldo [@user]", value: "💰 Ver carteira, banco e patrimônio total" },
      { name: "!banco", value: "🏦 Painel bancário completo (depositar/sacar/juros)" },
      { name: "!extrato", value: "📋 Histórico de ganhos e gastos recentes" },
      { name: "!cartao", value: "💎 Ver seu cartão virtual e categoria" },
      { name: "!patrimonio [@user]", value: "🏦 Visão geral de toda a riqueza" },
      { name: "!investir <valor> <tipo>", value: "📊 Investir em ações, crypto ou imóveis fictícios" },
      { name: "!pix @user <valor>", value: "⚡ Transferência instantânea para outro usuário" },
      { name: "!pagar @user <valor>", value: "💸 Enviar moedas para alguém" },
      { name: "!ranking ricos", value: "👑 Top 10 mais ricos do servidor" },
    ],
  },
  earn: {
    title: "🛒 Ganhar & Trabalho",
    color: 0xffd700,
    desc: "Trabalhe, estude, escolha uma profissão e ganhe dinheiro.",
    fields: [
      { name: "!diario", value: "🎁 Recompensa diária (+ bônus de streak e casal!)" },
      { name: "!trabalhar", value: "💼 Trabalhe na sua profissão e ganhe moedas" },
      { name: "!emprego", value: "🏢 Ver sua carreira atual" },
      { name: "!emprego lista", value: "📋 Ver todos os empregos disponíveis" },
      { name: "!emprego escolher <id>", value: "✅ Escolher ou mudar de profissão (1x/semana)" },
      { name: "!faculdade", value: "🎓 Ver seu curso universitário atual" },
      { name: "!faculdade listar", value: "📚 Ver cursos disponíveis" },
      { name: "!faculdade entrar <curso>", value: "📝 Matricular em um curso" },
      { name: "!faculdade estudar", value: "✏️ Estudar (cooldown: 2h, precisa de 20 sessões)" },
      { name: "!crime", value: "🔫 Cometa um crime — alto risco, alta recompensa" },
      { name: "!roubar @user", value: "🦹 Tente roubar até 25% da carteira de alguém" },
    ],
  },
  dating: {
    title: "❤️ Social & Namoro",
    color: 0xff69b4,
    desc: "Namore, case, flerte e construa relacionamentos no servidor.",
    fields: [
      { name: "!perfil [@user]", value: "👤 Perfil social completo: status, vínculos, casa" },
      { name: "!namoro @user", value: "💕 Evoluir relação (conhecendo→namorando)" },
      { name: "!casar @user", value: "💍 Pedir em casamento" },
      { name: "!divorcio", value: "💔 Solicitar divórcio" },
      { name: "!web", value: "💻 Perfil de namoro online — apareça nas buscas" },
      { name: "!web criar [bio]", value: "✅ Ativar perfil web de namoro" },
      { name: "!web ver", value: "🔍 Ver perfis online disponíveis" },
      { name: "!gf", value: "💌 Procurar parceiro(a) ou se oferecer" },
      { name: "!gf quero [mensagem]", value: "💕 Aparecer na lista de disponíveis" },
      { name: "!gf ver", value: "👀 Ver quem está disponível" },
      { name: "!cantada @user", value: "😏 Enviar uma cantada para alguém" },
      { name: "!segredo @user", value: "💌 Admirar alguém em segredo" },
      { name: "!vinculo [@user]", value: "⛓️ Ver seus vínculos de obsessão" },
      { name: "!duo", value: "🎮 Procurar parceiro de jogo (matchmaking)" },
      { name: "!feed <texto>", value: "📱 Publicar no feed social do servidor" },
      { name: "!feed ver", value: "📱 Ver as últimas publicações do feed" },
      { name: "!reputacao @user", value: "⭐ Dar +1 reputação para alguém (1x/dia)" },
    ],
  },
  identity: {
    title: "🧠 Identidade & Psicologia",
    color: 0x9b59b6,
    desc: "Arquétipo, memórias, reputação e status social.",
    fields: [
      { name: "!personalidade", value: "🧠 Ver perfil psicológico e arquétipo" },
      { name: "!personalidade escolher", value: "🎭 Escolher arquétipo (muda a cada 7 dias)" },
      { name: "!memorias [@user]", value: "📸 Álbum de memórias do relacionamento" },
      { name: "!status", value: "👑 Ver títulos de elite do servidor" },
      { name: "!calor", value: "🌡️ Termômetro social: quanto mais quente, mais bônus!" },
      { name: "!niveis [@user]", value: "📈 Ver nível de XP e progresso" },
      { name: "!bio <texto>", value: "✏️ Definir sua bio do perfil" },
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
      { name: "!tirarcoleira [@user]", value: "🔓 Remover coleira" },
      { name: "!contrato @user <tipo>", value: "📜 Propor contrato Dark Love" },
      { name: "!desafio @user <texto>", value: "🎯 Enviar desafio — você escreve o texto!" },
      { name: "!prova @user", value: "🔒 Enviar prova privada (auto-delete)" },
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
      { name: "!pet", value: "🐾 Ver seu pet e status" },
      { name: "!evento", value: "🎉 Ver evento ativo no servidor" },
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
      { name: "!ajuda", value: "📚 Menu de ajuda com navegação ◀ ▶" },
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
      { name: "!vip @user [dias]", value: "💎 Conceder status VIP (padrão: 30 dias)" },
      { name: "!vip remover @user", value: "❌ Remover VIP de um membro" },
      { name: "!vip lista", value: "📋 Ver todos os VIPs ativos" },
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
        text: `Prefixo: ${config.prefix} • Use !ajuda para navegar por todas as páginas`,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
