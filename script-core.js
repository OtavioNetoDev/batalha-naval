// ========================================
// BATALHA NAVAL - CORE
// Classes base, configurações e UI global
// ========================================

// ===== CONFIGURAÇÕES =====
const CONFIG = {
    BOARD_SIZE: 10,
    SHIPS: [
        { name: 'Porta-Aviões', size: 5, emoji: '🛩️', count: 1 },
        { name: 'Encouraçado', size: 4, emoji: '🚢', count: 1 },
        { name: 'Cruzador', size: 3, emoji: '⛴️', count: 1 },
        { name: 'Submarino', size: 3, emoji: '🔱', count: 1 },
        { name: 'Destroyer', size: 2, emoji: '🚤', count: 1 }
    ],
    POWERUPS: {
        radar: { name: 'Radar', icon: '🔍', uses: 2 },
        bomb: { name: 'Bomba', icon: '💣', uses: 1 },
        missile: { name: 'Míssil', icon: '🎯', uses: 1 }
    },
    THEMES: {
        ocean: { name: '🌊 Oceano', primary: '#0077be', secondary: '#005a8c' },
        sunset: { name: '🌅 Pôr do Sol', primary: '#ff6b6b', secondary: '#ee5a6f' },
        night: { name: '🌃 Noite', primary: '#4a5568', secondary: '#2d3748' },
        pirate: { name: '🏴‍☠️ Pirata', primary: '#8b4513', secondary: '#654321' },
        neon: { name: '⚡ Neon', primary: '#9333ea', secondary: '#7c3aed' },
        military: { name: '🎖️ Militar', primary: '#2f855a', secondary: '#276749' }
    }
};

// ===== CLASSES BASE =====

// Classe Ship
class Ship {
    constructor(name, size, emoji) {
        this.name = name;
        this.size = size;
        this.emoji = emoji;
        this.positions = [];
        this.hits = new Set();
        this.isVertical = false;
    }

    rotate() {
        this.isVertical = !this.isVertical;
    }

    isSunk() {
        return this.hits.size === this.size;
    }

    hit(position) {
        this.hits.add(position);
        return this.isSunk();
    }

    getPositions(startRow, startCol) {
        const positions = [];
        for (let i = 0; i < this.size; i++) {
            if (this.isVertical) {
                positions.push({ row: startRow + i, col: startCol });
            } else {
                positions.push({ row: startRow, col: startCol + i });
            }
        }
        return positions;
    }
}

// Classe Board
class Board {
    constructor(size = 10) {
        this.size = size;
        this.grid = this.createGrid();
        this.ships = [];
        this.shots = new Set();
        this.hits = new Set();
        this.misses = new Set();
    }

    createGrid() {
        const grid = [];
        for (let i = 0; i < this.size; i++) {
            grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                grid[i][j] = {
                    row: i,
                    col: j,
                    ship: null,
                    isHit: false,
                    isMiss: false
                };
            }
        }
        return grid;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    canPlaceShip(ship, startRow, startCol) {
        const positions = ship.getPositions(startRow, startCol);
        
        for (const pos of positions) {
            if (!this.isValidPosition(pos.row, pos.col)) {
                return false;
            }
            if (this.grid[pos.row][pos.col].ship !== null) {
                return false;
            }
        }
        
        return true;
    }

    placeShip(ship, startRow, startCol) {
        if (!this.canPlaceShip(ship, startRow, startCol)) {
            return false;
        }

        const positions = ship.getPositions(startRow, startCol);
        ship.positions = positions;

        for (const pos of positions) {
            this.grid[pos.row][pos.col].ship = ship;
        }

        this.ships.push(ship);
        return true;
    }

    removeShip(ship) {
        for (const pos of ship.positions) {
            if (this.isValidPosition(pos.row, pos.col)) {
                this.grid[pos.row][pos.col].ship = null;
            }
        }
        this.ships = this.ships.filter(s => s !== ship);
        ship.positions = [];
    }

    receiveAttack(row, col) {
        const shotKey = `${row},${col}`;
        
        if (this.shots.has(shotKey)) {
            return { valid: false, result: 'already-shot' };
        }

        this.shots.add(shotKey);
        const cell = this.grid[row][col];

        if (cell.ship) {
            cell.isHit = true;
            this.hits.add(shotKey);
            const sunk = cell.ship.hit(shotKey);
            
            return {
                valid: true,
                result: 'hit',
                ship: cell.ship,
                sunk: sunk
            };
        } else {
            cell.isMiss = true;
            this.misses.add(shotKey);
            
            return {
                valid: true,
                result: 'miss'
            };
        }
    }

    allShipsSunk() {
        return this.ships.every(ship => ship.isSunk());
    }

    getCell(row, col) {
        if (!this.isValidPosition(row, col)) return null;
        return this.grid[row][col];
    }

    placeShipsRandomly(ships) {
        this.ships = [];
        this.grid = this.createGrid();

        for (const shipData of ships) {
            for (let count = 0; count < shipData.count; count++) {
                const ship = new Ship(shipData.name, shipData.size, shipData.emoji);
                let placed = false;
                let attempts = 0;

                while (!placed && attempts < 100) {
                    ship.isVertical = Math.random() < 0.5;
                    const row = Math.floor(Math.random() * this.size);
                    const col = Math.floor(Math.random() * this.size);

                    if (this.placeShip(ship, row, col)) {
                        placed = true;
                    }
                    attempts++;
                }

                if (!placed) {
                    console.error(`Não foi possível posicionar ${ship.name}`);
                }
            }
        }
    }
}

// ===== VARIÁVEIS GLOBAIS =====
const GameState = {
    currentMode: null,
    currentScreen: 'mainMenu',
    difficulty: 'medium',
    powerupsEnabled: true,
    currentTheme: 'ocean',
    isDarkMode: false,
    soundEnabled: true,
    isPaused: false
};

const GameStats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    totalShots: 0,
    totalHits: 0,
    gamesHistory: []
};

// Elementos DOM
const screens = {
    mainMenu: document.getElementById('mainMenu'),
    selection: document.getElementById('selectionScreen'),
    setup: document.getElementById('setupScreen'),
    battle: document.getElementById('battleScreen'),
    transition: document.getElementById('transitionScreen'),
    result: document.getElementById('resultScreen')
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('🚢 Batalha Naval Iniciando...');
    createSplashScreen();
    
    setTimeout(() => {
        setupGlobalEventListeners();
        loadPreferences();
        loadStats();
        applyTheme(GameState.currentTheme);
        showScreen('mainMenu');
    }, 2500);
}

// Versão corrigida para não injetar lixo visual, mas não quebrar a lógica
function createSplashScreen() {
    console.log("🚀 Lógica de Splash iniciada...");
    
    // Se você já colocou o HTML do radar manualmente no index.html,
    // esta função não precisa criar nada novo, apenas garantir que 
    // o fluxo do jogo continue.
    
    const splash = document.getElementById('splashScreen');
    if (!splash) {
        console.warn("Aviso: A nova Splash Screen (id='splashScreen') não foi encontrada no HTML.");
    }
}

// ===== EVENT LISTENERS GLOBAIS =====
function setupGlobalEventListeners() {
    // Botões do menu principal
    document.querySelectorAll('.btn-menu').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.currentTarget.dataset.mode;
            GameState.currentMode = mode;
            playSoundEffect('click');
            
            console.log('🎮 Modo selecionado:', mode);
            
            // Redirecionar para o modo apropriado
            switch(mode) {
                case 'classic':
                    if (window.ClassicMode) {
                        ClassicMode.start();
                    } else {
                        console.error('ClassicMode não carregado');
                    }
                    break;
                case 'sos':
                    if (window.SOSMode) {
                        SOSMode.start();
                    } else {
                        console.error('SOSMode não carregado');
                    }
                    break;
                case 'campaign':
                    if (window.CampaignMode) {
                        CampaignMode.start();
                    } else {
                        console.error('CampaignMode não carregado');
                        alert('Modo Campanha em desenvolvimento!');
                    }
                    break;
                case 'multiplayer':
                    if (window.MultiplayerMode) {
                        MultiplayerMode.start();
                    } else {
                        console.error('MultiplayerMode não carregado');
                        alert('Modo Multiplayer em desenvolvimento!');
                    }
                    break;
                default:
                    console.error('Modo não encontrado:', mode);
            }
        });
    });

    // Dificuldade
    document.getElementById('difficultySelect').addEventListener('change', (e) => {
        GameState.difficulty = e.target.value;
        playSoundEffect('click');
    });

    // Tema
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            GameState.currentTheme = e.target.value;
            applyTheme(GameState.currentTheme);
            playSoundEffect('click');
        });
    }

    // Power-ups toggle
    const powerupsToggle = document.getElementById('powerupsEnabled');
    if (powerupsToggle) {
        powerupsToggle.addEventListener('change', (e) => {
            GameState.powerupsEnabled = e.target.checked;
            playSoundEffect('click');
        });
    }

    // Controles do header - NÃO SUBSTITUIR
    const themeToggleBtn = document.getElementById('themeToggle');
    const soundToggleBtn = document.getElementById('soundToggle');
    const helpBtnEl = document.getElementById('helpBtn');
    const statsBtnEl = document.getElementById('statsBtn');

    // Remover listeners antigos e adicionar novos
    themeToggleBtn.replaceWith(themeToggleBtn.cloneNode(true));
    soundToggleBtn.replaceWith(soundToggleBtn.cloneNode(true));
    helpBtnEl.replaceWith(helpBtnEl.cloneNode(true));
    if (statsBtnEl) statsBtnEl.replaceWith(statsBtnEl.cloneNode(true));

    // Readicionar listeners
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    document.getElementById('helpBtn').addEventListener('click', openHelp);
    
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', openStats);
    }

    // Modais
    document.getElementById('closeHelp').addEventListener('click', closeHelp);
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', closeHelp);
    }

    const closeStats = document.getElementById('closeStats');
    if (closeStats) {
        closeStats.addEventListener('click', closeStatsModal);
    }

    // Fechar modais clicando fora
    document.getElementById('helpModal').addEventListener('click', (e) => {
        if (e.target.id === 'helpModal') closeHelp();
    });

    const statsModal = document.getElementById('statsModal');
    if (statsModal) {
        statsModal.addEventListener('click', (e) => {
            if (e.target.id === 'statsModal') closeStatsModal();
        });
    }

    // Botões de resultado
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            playSoundEffect('click');
            // Cada modo define sua própria lógica de "jogar novamente"
            if (GameState.currentMode === 'classic' && window.ClassicMode) {
                ClassicMode.start();
            } else if (GameState.currentMode === 'sos' && window.SOSMode) {
                SOSMode.start();
            } else if (GameState.currentMode === 'campaign' && window.CampaignMode) {
                CampaignMode.playAgain();
            } else if (GameState.currentMode === 'multiplayer' && window.MultiplayerMode) {
                MultiplayerMode.start();
            }
        });
    }

    const mainMenuBtn = document.getElementById('mainMenuBtn');
    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', () => {
            playSoundEffect('click');
            showScreen('mainMenu');
        });
    }
}

// ===== NAVEGAÇÃO DE TELAS =====
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        GameState.currentScreen = screenName;
    }
}

// ===== SISTEMA DE TEMAS =====
function applyTheme(themeName) {
    const theme = CONFIG.THEMES[themeName];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    
    localStorage.setItem('currentTheme', themeName);
    console.log(`🎨 Tema aplicado: ${theme.name}`);
}

function toggleTheme() {
    GameState.isDarkMode = !GameState.isDarkMode;
    
    // ESTA É A LINHA PRINCIPAL: Ela adiciona ou remove a classe que criamos no CSS
    document.body.classList.toggle('dark-mode', GameState.isDarkMode);
    
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = GameState.isDarkMode ? '☀️' : '🌙';
        btn.title = GameState.isDarkMode ? 'Modo Claro' : 'Modo Escuro';
    }
    
    localStorage.setItem('darkMode', GameState.isDarkMode);
    playSoundEffect('click');
}

function toggleSound() {
    GameState.soundEnabled = !GameState.soundEnabled;
    
    const btn = document.getElementById('soundToggle');
    btn.textContent = GameState.soundEnabled ? '🔊' : '🔇';
    btn.title = GameState.soundEnabled ? 'Desativar Som' : 'Ativar Som';
    
    localStorage.setItem('soundEnabled', GameState.soundEnabled);
    
    if (GameState.soundEnabled) {
        playSoundEffect('click');
    }
}

// ===== MODAIS =====
function openHelp() {
    const modal = document.getElementById('helpModal');
    modal.classList.add('active');
    playSoundEffect('click');
}

function closeHelp() {
    const modal = document.getElementById('helpModal');
    modal.classList.remove('active');
    playSoundEffect('click');
}

function openStats() {
    const modal = document.getElementById('statsModal');
    if (!modal) return;
    
    updateStatsDisplay();
    modal.classList.add('active');
    playSoundEffect('click');
}

function closeStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateStatsDisplay() {
    const winRate = GameStats.totalGames > 0 
        ? ((GameStats.wins / GameStats.totalGames) * 100).toFixed(1) 
        : 0;
    
    const avgAccuracy = GameStats.totalShots > 0
        ? ((GameStats.totalHits / GameStats.totalShots) * 100).toFixed(1)
        : 0;

    const totalGamesEl = document.getElementById('totalGames');
    const totalWinsEl = document.getElementById('totalWins');
    const winRateEl = document.getElementById('winRate');
    const avgAccuracyEl = document.getElementById('avgAccuracy');

    if (totalGamesEl) totalGamesEl.textContent = GameStats.totalGames;
    if (totalWinsEl) totalWinsEl.textContent = GameStats.wins;
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    if (avgAccuracyEl) avgAccuracyEl.textContent = `${avgAccuracy}%`;
}

// ===== PREFERÊNCIAS E ESTATÍSTICAS =====
function loadPreferences() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        GameState.isDarkMode = true;
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
    }
    
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound === 'false') {
        GameState.soundEnabled = false;
        document.getElementById('soundToggle').textContent = '🔇';
    }

    const savedTheme = localStorage.getItem('currentTheme');
    if (savedTheme && CONFIG.THEMES[savedTheme]) {
        GameState.currentTheme = savedTheme;
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }
}

function loadStats() {
    const saved = localStorage.getItem('battleshipStats');
    if (saved) {
        Object.assign(GameStats, JSON.parse(saved));
    }
}

function saveStats() {
    localStorage.setItem('battleshipStats', JSON.stringify(GameStats));
}

// ===== EFEITOS SONOROS =====
function playSoundEffect(type) {
    if (!GameState.soundEnabled) return;
    console.log(`🔊 Som: ${type}`);
    // Aqui você pode adicionar Web Audio API ou Howler.js
}

// ===== UTILIDADES =====
function showMessage(message) {
    const msgEl = document.getElementById('messageDisplay');
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.style.animation = 'none';
        setTimeout(() => msgEl.style.animation = 'pulse 0.5s ease', 10);
    }
}

window.addEventListener('load', () => {
    document.body.classList.add('loading');
    
    const splash = document.getElementById('splashScreen');
    
    setTimeout(() => {
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
                document.body.classList.remove('loading');
            }, 800); // Garante que a transição de opacidade termine antes de sumir
        }
        
        if (typeof showScreen === 'function') {
            showScreen('mainMenu'); 
        } else {
            console.error("Função 'showScreen' não encontrada. O menu pode não aparecer.");
        }
    }, 4000); // Aumentei o tempo para 4 segundos para as animações rodarem
});

console.log('✅ Core do jogo carregado!');
