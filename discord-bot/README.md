# 🤖 Bot Discord Completo — Comunidade Gamer & Social

Bot Discord profissional com sistemas de namoro, dark love, economia The Sims, matchmaking, tickets, moderação avançada e muito mais.

## 📦 Sistemas Incluídos

| Sistema | Comandos |
|---|---|
| 🛡️ Moderação | `!ban` `!kick` `!mute` `!warn` `!clear` `!softban` `!unban` |
| ❤️ Web Namoro | `!namoro` `!perfil` `!casar` `!divorcio` `!cantada` |
| 🎮 Duo Gamer | `!duo` |
| 🖤 Dark Love | `!darklove` `!coleira` `!confissao` |
| 💰 Economia | `!saldo` `!diario` `!trabalhar` `!crime` `!pagar` `!loja` `!inventario` |
| 🏠 Vida | `!casa` `!ranking` `!bio` |
| ℹ️ Info | `!ajuda` `!ping` `!serverinfo` `!userinfo` `!nivel` |
| 🎫 Tickets | `!ticket` — com botões, claims, calls privadas |

---

## 🚀 GUIA COMPLETO DE DEPLOY

### PASSO 1 — Criar o Bot no Discord

1. Acesse [discord.com/developers](https://discord.com/developers/applications)
2. Clique em **New Application** → dê um nome
3. Vá em **Bot** → clique em **Add Bot**
4. Em **Privileged Gateway Intents**, ative **TUDO**:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copie o **TOKEN** (guarde com segurança!)
6. Vá em **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Administrator`
7. Copie o link gerado e convide o bot ao seu servidor

---

### PASSO 2 — Criar o Banco de Dados (MongoDB Atlas — GRÁTIS)

1. Acesse [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um **Cluster M0 (FREE)**
4. Em **Database Access** → Add User:
   - Username: `botuser`
   - Password: (gere uma senha)
   - Role: `Atlas Admin`
5. Em **Network Access** → Add IP Address → `0.0.0.0/0` (aceita de qualquer lugar)
6. Clique em **Connect** no cluster → **Connect your application**
7. Copie a URI (ex: `mongodb+srv://botuser:SENHA@cluster0.xxxxx.mongodb.net/discordbot`)

---

### PASSO 3 — Subir no GitHub

```bash
# 1. Crie um repositório em github.com (New Repository)
# 2. No terminal do Replit ou localmente:

git init
git add .
git commit -m "feat: bot discord completo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

### PASSO 4 — Deploy no Railway ✅ (RECOMENDADO)

#### O que você precisa instalar:
- ✅ Conta no [Railway.app](https://railway.app) (login com GitHub)
- Não precisa instalar nada localmente!

#### Passo a passo Railway:

1. Acesse [railway.app](https://railway.app) e faça login com sua conta GitHub
2. Clique em **New Project**
3. Selecione **Deploy from GitHub repo**
4. Autorize o Railway e selecione seu repositório
5. Railway detectará o `Dockerfile` automaticamente ✅

#### Configurar Variáveis de Ambiente no Railway:

6. No painel do projeto, clique na sua aplicação
7. Vá em **Variables** → clique em **+ New Variable**
8. Adicione **uma por uma** (ou use o botão RAW para colar todas de uma vez):

```
DISCORD_TOKEN=seu_token_aqui
MONGODB_URI=sua_uri_mongodb_aqui
PREFIX=!
OWNER_ID=seu_discord_id
GUILD_ID=id_do_seu_servidor
STAFF_ROLES=id_cargo_mod,id_cargo_suporte
ADMIN_ROLES=id_cargo_admin
LOG_CHANNEL=id_canal
MOD_LOG_CHANNEL=id_canal
WELCOME_CHANNEL=id_canal
DATING_CHANNEL=id_canal
DUO_CHANNEL=id_canal
DARK_LOVE_CHANNEL=id_canal
CONFESSIONS_CHANNEL=id_canal
TICKET_CATEGORY=id_categoria
PRIVATE_CALL_CATEGORY=id_categoria
```

9. Clique em **Deploy** → aguarde o build (≈ 3-5 minutos)
10. Verifique os logs — você deve ver:
```
✅ MongoDB conectado com sucesso!
✅ Bot iniciado com sucesso!
✅ Bot online como SeuBot#1234
```

#### Como pegar os IDs no Discord:
- Ative o **Modo Desenvolvedor**: Configurações → Avançado → Modo Desenvolvedor
- Clique com botão direito em qualquer canal/cargo/servidor → **Copiar ID**

---

### PASSO 5 — Configurar o Bot no Servidor

Após o bot estar online, use os seguintes comandos de configuração:

```
!config  ← Abre o painel de configuração completo (admin only)
```

Configure via menu interativo:
- 👋 **Boas-vindas** — canal, cargo automático, mensagem
- 🎫 **Tickets** — categoria, cargo staff
- 🔊 **Calls Privadas** — categoria, canal de entrada
- 📝 **Logs** — canais de log geral e moderação
- 💰 **Economia** — nome e emoji da moeda

---

## 🔐 Checklist de Segurança

- [x] Token apenas via variável de ambiente (nunca no código)
- [x] Anti-spam automático (silencia após 5+ msgs em 5s)
- [x] Anti-nuke (bane quem deleta canais/bane em massa)
- [x] Cooldowns em todos os comandos
- [x] Sanitização de todas as entradas do usuário
- [x] Validação de permissões em comandos admin/staff
- [x] Tratamento global de erros (não crasha)
- [x] Logs de todas as ações de moderação
- [x] Comandos de moderação invisíveis para usuários normais
- [x] DMs automáticas em punições (ban, mute, warn)
- [x] Tickets com transcripts automáticos
- [x] Calls privadas com auto-delete quando vazias

---

## 📂 Estrutura do Projeto

```
src/
├── commands/
│   ├── admin/      ← ban, kick, mute, warn, clear, config...
│   ├── economy/    ← saldo, diario, trabalhar, crime, loja...
│   ├── dating/     ← namoro, duo, perfil, casar, cantada...
│   ├── dark/       ← darklove, coleira, confissao...
│   ├── social/     ← reputacao, nivel, ticket, casa, bio...
│   └── utility/    ← ajuda, ping, serverinfo, userinfo...
├── events/         ← ready, messageCreate, interactionCreate...
├── handlers/       ← command, event, button, modal, select
├── systems/        ← AntiSpam, AntiNuke, CompatibilityEngine, LevelSystem
├── models/         ← User, Ticket, GuildConfig, Match, Shop
├── buttons/        ← ticketCreate, ticketActions, dating, match...
├── modals/         ← datingModal, confessionModal, duoModal, configSave...
├── selectmenus/    ← helpMenu, darkLoveRole, duoSelectGame, configMenu...
├── utils/          ← logger, cooldown, permissions, sanitize, embed
└── config/         ← config.js
```

---

## ⚠️ Solução de Erros Comuns

### ❌ "Invalid token"
→ Verifique se `DISCORD_TOKEN` está correto no Railway. Regenere o token no Discord Developer Portal.

### ❌ "MongoServerError: Authentication failed"
→ Verifique username/senha na URI do MongoDB Atlas. Confira se o IP `0.0.0.0/0` está liberado.

### ❌ Bot online mas não responde comandos
→ Verifique se **Message Content Intent** está ativado no Discord Developer Portal.

### ❌ "Missing Permissions" em moderação
→ O cargo do bot deve estar **acima** dos membros no servidor. Arraste o cargo do bot para cima.

### ❌ Erro no Dockerfile (build falha)
→ Verifique se o `railway.json` está na raiz do repositório. Confirme que `Dockerfile` está presente.

### ❌ Calls privadas não criam
→ Configure `PRIVATE_CALL_CATEGORY` com o ID da categoria onde as calls devem ser criadas.

---

## 🎯 Comandos Rápidos de Referência

```
!ajuda           → Menu principal interativo
!config          → Painel de configuração (admin)
!ticket          → Sistema de tickets
!namoro          → Perfil de web namoro
!duo             → Procurar duo gamer
!darklove        → Sistema dark love
!saldo           → Ver carteira
!diario          → Recompensa diária
!perfil          → Seu perfil completo
!casar @user     → Pedido de casamento
!coleira @user   → Coleira digital
!ranking         → Rankings do servidor
```

---

## 📊 Variáveis de Ambiente — Referência Completa

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DISCORD_TOKEN` | ✅ SIM | Token do bot |
| `MONGODB_URI` | ✅ SIM | URI do MongoDB |
| `PREFIX` | ❌ Não | Prefixo (padrão: `!`) |
| `OWNER_ID` | ✅ SIM | Seu Discord ID |
| `GUILD_ID` | ❌ Não | ID do servidor principal |
| `STAFF_ROLES` | ❌ Não | IDs cargos staff (vírgula) |
| `ADMIN_ROLES` | ❌ Não | IDs cargos admin (vírgula) |
| `LOG_CHANNEL` | ❌ Não | Canal de logs |
| `MOD_LOG_CHANNEL` | ❌ Não | Canal de logs de moderação |
| `WELCOME_CHANNEL` | ❌ Não | Canal de boas-vindas |
| `DATING_CHANNEL` | ❌ Não | Canal de namoro |
| `DUO_CHANNEL` | ❌ Não | Canal de duo |
| `DARK_LOVE_CHANNEL` | ❌ Não | Canal dark love |
| `CONFESSIONS_CHANNEL` | ❌ Não | Canal de confissões |
| `TICKET_CATEGORY` | ❌ Não | Categoria de tickets |
| `PRIVATE_CALL_CATEGORY` | ❌ Não | Categoria de calls privadas |

---

## 📱 Testando Localmente (Replit)

```bash
# No Replit, crie um arquivo .env com suas variáveis:
DISCORD_TOKEN=...
MONGODB_URI=...
PREFIX=!
OWNER_ID=...

# Instale as dependências:
npm install

# Inicie o bot:
npm start
```

---

*Bot criado com discord.js v14 • MongoDB • Node.js 20*
