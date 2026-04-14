# ⚓ Batalha Naval

> Afunde a Frota Inimiga! Um jogo completo de Batalha Naval desenvolvido em HTML, CSS e JavaScript puro — com múltiplos modos de jogo, sons, tema educacional e multiplayer local.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Demonstração](#-demonstração)
- [Funcionalidades](#-funcionalidades)
- [Modos de Jogo](#-modos-de-jogo)
- [Navios](#-navios)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Jogar](#-como-jogar)
- [Configurações](#-configurações)
- [Tecnologias](#-tecnologias)
- [Como Executar](#-como-executar)
- [Autor](#-autor)

---

## 🎮 Sobre o Projeto

**Batalha Naval** é uma versão completa do clássico jogo de tabuleiro, desenvolvida inteiramente com tecnologias web nativas (HTML5, CSS3 e JavaScript ES6+). O projeto conta com 5 modos de jogo distintos, inteligência artificial com 4 níveis de dificuldade, sistema de sons, dois temas visuais e um modo educacional baseado em plano cartesiano — ideal para uso em sala de aula.

---

## 🖥️ Demonstração

```
⚓ BATALHA NAVAL ⚓
Afunde a Frota Inimiga!
```

Splash screen animada com radar → Menu de modos → Posicionamento de navios → Batalha → Fim de jogo.

---

## ✨ Funcionalidades

- 🎯 **5 modos de jogo** distintos
- 🤖 **IA com 4 níveis** de dificuldade (Fácil, Médio, Difícil, Impossível)
- 👥 **Multiplayer local** para 2 jogadores no mesmo dispositivo
- 📐 **Modo educacional** com plano cartesiano (eixos X e Y de -5 a 5)
- 🔊 **Sistema de sons** — clique, acerto, explosão e erro
- 🌙☀️ **Dois temas visuais** — Escuro (Oceano) e Claro (Céu)
- 📊 **Estatísticas globais** salvas em localStorage
- 🏆 **Progresso de campanha** persistente entre sessões
- 🚢 **Pré-visualização de posicionamento** com indicador de orientação
- 🔄 **Posicionamento aleatório** de navios
- 📱 **Layout responsivo** para desktop e mobile
- ⚓ **Splash screen** animada com radar
- 🎨 **Animações CSS** em acertos, erros, afundamentos e explosões

---

## 🕹️ Modos de Jogo

### 🎯 Modo Clássico
Batalha 1v1 contra a Inteligência Artificial num tabuleiro 10×10 (colunas A–J, linhas 1–10). O objetivo é afundar todos os 5 navios inimigos antes que a IA afunde os seus.

### 🏆 Modo Campanha (10 Níveis)
Progressão de 10 níveis com dificuldade crescente. A IA evolui automaticamente — do nível 1 (fácil) ao nível 8+ (impossível). No **nível 10** aparece o boss final: o lendário **🛳️ TITANIC** com 6 partes. O progresso é salvo entre sessões.

| Nível | Dificuldade da IA |
|-------|------------------|
| 1–2   | Fácil             |
| 3–4   | Médio             |
| 5–7   | Difícil           |
| 8–9   | Impossível        |
| 10    | Impossível + Boss TITANIC |

### 👥 Multiplayer Local
Dois jogadores se alternam no mesmo dispositivo. Cada jogador posiciona seus navios em segredo antes da batalha. Entre os turnos, um modal de troca garante que nenhum jogador veja o tabuleiro do outro.

### 🆘 Modo SOS — Resgate de Náufragos
Modo completamente diferente: em vez de batalha, o objetivo é **resgatar náufragos** espalhados pelo oceano antes que o tempo acabe. Obstáculos (tubarões 🦈, tempestades ⛈️, icebergs 🧊, minas 💣, redemoinhos 🌀) causam penalidades de -5 segundos.

| Missão  | Tabuleiro | Náufragos | Tempo | Obstáculos |
|---------|-----------|-----------|-------|------------|
| Fácil   | 8×8       | 3         | 90s   | Poucos     |
| Média   | 10×10     | 5         | 120s  | Moderados  |
| Difícil | 12×12     | 8         | 150s  | Muitos     |

### 📐 Modo Plano Cartesiano (Educacional)
Tabuleiro baseado em coordenadas cartesianas — **eixo X e Y de -5 a 5** — totalizando uma grade 11×11. Os eixos zero são destacados em vermelho. Disponível em dois sub-modos:

- **vs IA** — ideal para prática individual
- **Multiplayer Local** — ideal para atividades em sala de aula

Ao atirar numa célula do eixo zero (X=0 ou Y=0), o marcador exibe o indicador especial ✕ vermelho (erro) ou contorno vermelho (acerto), sinalizando visualmente a importância dos eixos.

---

## 🚢 Navios

| Navio           | Tamanho | Emoji |
|-----------------|---------|-------|
| Porta-Aviões    | 5       | 🛩️   |
| Encouraçado     | 4       | 🚢   |
| Cruzador        | 3       | ⛴️   |
| Submarino       | 3       | 🔱   |
| Destroyer       | 2       | 🚤   |
| **TITANIC** *(boss)* | **6** | 🛳️ |

---

## 📁 Estrutura do Projeto

```
📁 batalha-naval/
├── index.html              # Estrutura principal da aplicação
├── style.css               # Estilização completa (temas, animações, responsividade)
├── script.js               # Lógica do jogo (classes, IA, modos, sons)
├── README.md               # Documentação do projeto
└── assets/
    └── sounds/
        ├── ClickSound.wav          # Som de clique nos botões
        ├── HitSound.wav            # Som de acerto em navio
        ├── ExplosionShipSound.wav  # Som de navio afundado
        └── MissSound.wav           # Som de tiro na água
```

---

## 🎮 Como Jogar

### Posicionamento
1. Selecione um navio clicando nele na lista lateral
2. Passe o mouse sobre o tabuleiro para ver a **pré-visualização** (amarelo = válido, vermelho = inválido)
3. Clique para posicionar
4. Use **🔄 Rotacionar** para alternar entre horizontal ↔ e vertical ↕
5. Use **🎲 Posicionar Aleatório** para posicionamento automático
6. Quando todos os navios estiverem posicionados, clique em **✓ Confirmar**

### Durante o Jogo
- Clique nas células do **tabuleiro inimigo** para atirar
- 💥 = Acerto | Água = Erro | ☠️ = Navio afundado
- No modo cartesiano, as células dos eixos X=0 e Y=0 têm marcação especial
- Aguarde o turno da IA antes de atirar novamente

### Sons
| Evento | Som |
|--------|-----|
| Clicar em botão | ClickSound.wav |
| Acertar parte de um navio | HitSound.wav |
| Afundar um navio completamente | ExplosionShipSound.wav |
| Tiro na água | MissSound.wav |

---

## ⚙️ Configurações

Acessível pelo botão **⚙️ Configurações** no menu:

| Opção | Valores |
|-------|---------|
| Dificuldade da IA | Fácil / Médio / Difícil / Impossível |
| Tema | Escuro (Oceano) / Claro (Céu) |
| Sons | Ativado / Desativado |
| Nome do Jogador | Texto livre (máx. 20 caracteres) |

As configurações são salvas automaticamente no `localStorage`.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **HTML5** | Estrutura semântica, Canvas-free |
| **CSS3** | Grid Layout, animações, variáveis CSS, temas |
| **JavaScript ES6+** | Classe `BattleshipGame`, localStorage, Web Audio API |
| **Google Fonts** | Oswald, Rajdhani, Press Start 2P |
| **Web Audio API** | Sistema de sons com pré-carregamento e desbloqueio de autoplay |

Sem frameworks, sem dependências externas — **100% vanilla**.

---

## 🚀 Como Executar

### 🌐 Acesso Online — GitHub Pages
O jogo está disponível online, sem instalação:

> **[▶️ Jogar agora](https://otavionetodev.github.io/batalha-naval/)**

---

### 💻 Rodar Localmente

**Opção 1 — Abrir direto no navegador**
```bash
# Clone o repositório
git clone https://github.com/OtavioNetoDev/batalha-naval.git

cd batalha-naval

# Abra o index.html no navegador (duplo clique no arquivo)
```
> ⚠️ Alguns navegadores bloqueiam sons ao abrir arquivos locais. Use um servidor local para garantir que os sons funcionem.

**Opção 2 — Servidor local**
```bash
# Com Python
python -m http.server 8000

# Com Node.js
npx serve .

# Com VS Code — extensão "Live Server" → clique em "Go Live"
```
Acesse `http://localhost:8000` no navegador.

---

### ☁️ Outros serviços de deploy compatíveis

Por ser um projeto **100% estático** (HTML + CSS + JS), funciona em qualquer serviço de hospedagem de arquivos estáticos:

| Serviço | Como usar |
|---------|-----------|
| **GitHub Pages** | `Settings → Pages → Branch: main` |
| **Vercel** | Importe o repositório, deploy automático |
| **Netlify** | Arraste a pasta do projeto ou conecte o repositório |
| **Render** | Novo site estático → conecte o repositório |

---

## 👤 Autor

<div align="center">

**Otávio Neto**

[![GitHub](https://img.shields.io/badge/GitHub-OtavioNetoDev-181717?style=for-the-badge&logo=github)](https://github.com/OtavioNetoDev)
[![Instagram](https://img.shields.io/badge/Instagram-@euotavioneto__-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/euotavioneto_)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Otávio_Neto-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/otavionetodev/)

</div>

---

<div align="center">
  <p>⚓ Feito com dedicação por <strong>Otávio Neto</strong></p>
  <p><em>© 2025 Batalha Naval · Todos os direitos reservados</em></p>
</div>