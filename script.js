// ========================================
// BATALHA NAVAL - JAVASCRIPT COMPLETO
// Sistema completo com todas as funcionalidades
// ========================================

// Configurações do Jogo
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

// ========================================
// CLASSES
// ========================================

// Classe Ship (Navio)
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

// Classe Board (Tabuleiro)
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

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================

let game = null;
let playerBoard = null;
let enemyBoard = null;
let currentScreen = 'mainMenu';
let gameMode = 'classic';
let difficulty = 'medium';
let isPlayerTurn = true;

// Setup
let setupBoard = null;
let shipsToPlace = [];
let currentShipIndex = 0;
let currentOrientation = false;

// Controles
let isDarkMode = false;
let soundEnabled = true;
let powerupsEnabled = true;
let currentTheme = 'ocean';

// Estatísticas
let gameStats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    totalShots: 0,
    totalHits: 0,
    gamesHistory: []
};

// Batalha
let battleStats = {
    shots: 0,
    hits: 0,
    startTime: null,
    endTime: null
};

// Timer
let gameTimer = null;
let elapsedSeconds = 0;

// ========================================
// ELEMENTOS DOM
// ========================================

const screens = {
    mainMenu: document.getElementById('mainMenu'),
    setup: document.getElementById('setupScreen'),
    battle: document.getElementById('battleScreen'),
    result: document.getElementById('resultScreen')
};

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('🚢 Batalha Naval Iniciando...');
    
    // Criar splash screen
    createSplashScreen();
    
    // Após splash, inicializar
    setTimeout(() => {
        setupEventListeners();
        loadPreferences();
        loadStats();
        applyTheme(currentTheme);
        showScreen('mainMenu');
    }, 2500);
}

// ========================================
// SPLASH SCREEN
// ========================================

function createSplashScreen() {
    const splash = document.createElement('div');
    splash.className = 'splash-screen';
    splash.innerHTML = `
        <div class="splash-content">
            <div class="splash-icon">⚓</div>
            <h1 class="splash-title">BATALHA NAVAL</h1>
            <p class="splash-subtitle">Prepare-se para a batalha!</p>
        </div>
    `;
    document.body.appendChild(splash);
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Botões do menu principal
    document.querySelectorAll('.btn-menu').forEach(btn => {
        btn.addEventListener('click', (e) => {
            gameMode = e.currentTarget.dataset.mode;
            playSoundEffect('click');
            startSetup();
        });
    });

    // Dificuldade
    document.getElementById('difficultySelect').addEventListener('change', (e) => {
        difficulty = e.target.value;
        playSoundEffect('click');
    });

    // Tema
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            currentTheme = e.target.value;
            applyTheme(currentTheme);
            playSoundEffect('click');
        });
    }

    // Power-ups toggle
    const powerupsToggle = document.getElementById('powerupsEnabled');
    if (powerupsToggle) {
        powerupsToggle.addEventListener('change', (e) => {
            powerupsEnabled = e.target.checked;
            playSoundEffect('click');
        });
    }

    // Botões de controle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    document.getElementById('helpBtn').addEventListener('click', openHelp);
    
    // Botão de estatísticas
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', openStats);
    }

    // Fechar modais
    document.getElementById('closeHelp').addEventListener('click', closeHelp);
    
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', closeHelp);
    }

    const closeStats = document.getElementById('closeStats');
    if (closeStats) {
        closeStats.addEventListener('click', closeStatsModal);
    }

    // Fechar clicando fora
    document.getElementById('helpModal').addEventListener('click', (e) => {
        if (e.target.id === 'helpModal') closeHelp();
    });

    const statsModal = document.getElementById('statsModal');
    if (statsModal) {
        statsModal.addEventListener('click', (e) => {
            if (e.target.id === 'statsModal') closeStatsModal();
        });
    }

    // Botões de voltar
    const backToMenuFromSetup = document.getElementById('backToMenuFromSetup');
    if (backToMenuFromSetup) {
        backToMenuFromSetup.addEventListener('click', () => {
            if (confirm('Deseja realmente voltar ao menu? O progresso será perdido.')) {
                playSoundEffect('click');
                showScreen('mainMenu');
            }
        });
    }

    const backToMenuFromBattle = document.getElementById('backToMenuFromBattle');
    if (backToMenuFromBattle) {
        backToMenuFromBattle.addEventListener('click', () => {
            if (confirm('Deseja realmente desistir da batalha?')) {
                playSoundEffect('click');
                stopTimer();
                showScreen('mainMenu');
            }
        });
    }

    // Botões de resultado
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            playSoundEffect('click');
            startSetup();
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

// ========================================
// SISTEMA DE TEMAS
// ========================================

function applyTheme(themeName) {
    const theme = CONFIG.THEMES[themeName];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    
    localStorage.setItem('currentTheme', themeName);
    console.log(`🎨 Tema aplicado: ${theme.name}`);
}

// ========================================
// CONTROLES
// ========================================

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const btn = document.getElementById('themeToggle');
    btn.textContent = isDarkMode ? '☀️' : '🌙';
    btn.title = isDarkMode ? 'Modo Claro' : 'Modo Escuro';
    
    localStorage.setItem('darkMode', isDarkMode);
    playSoundEffect('click');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    
    const btn = document.getElementById('soundToggle');
    btn.textContent = soundEnabled ? '🔊' : '🔇';
    btn.title = soundEnabled ? 'Desativar Som' : 'Ativar Som';
    
    localStorage.setItem('soundEnabled', soundEnabled);
    
    if (soundEnabled) {
        playSoundEffect('click');
    }
}

// ========================================
// MODAL DE AJUDA
// ========================================

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

// ========================================
// MODAL DE ESTATÍSTICAS
// ========================================

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
    const winRate = gameStats.totalGames > 0 
        ? ((gameStats.wins / gameStats.totalGames) * 100).toFixed(1) 
        : 0;
    
    const avgAccuracy = gameStats.totalShots > 0
        ? ((gameStats.totalHits / gameStats.totalShots) * 100).toFixed(1)
        : 0;

    const totalGamesEl = document.getElementById('totalGames');
    const totalWinsEl = document.getElementById('totalWins');
    const winRateEl = document.getElementById('winRate');
    const avgAccuracyEl = document.getElementById('avgAccuracy');

    if (totalGamesEl) totalGamesEl.textContent = gameStats.totalGames;
    if (totalWinsEl) totalWinsEl.textContent = gameStats.wins;
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    if (avgAccuracyEl) avgAccuracyEl.textContent = `${avgAccuracy}%`;
}

// ========================================
// PREFERÊNCIAS E ESTATÍSTICAS
// ========================================

function loadPreferences() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
    }
    
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound === 'false') {
        soundEnabled = false;
        document.getElementById('soundToggle').textContent = '🔇';
    }

    const savedTheme = localStorage.getItem('currentTheme');
    if (savedTheme && CONFIG.THEMES[savedTheme]) {
        currentTheme = savedTheme;
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }
}

function loadStats() {
    const saved = localStorage.getItem('battleshipStats');
    if (saved) {
        gameStats = JSON.parse(saved);
    }
}

function saveStats() {
    localStorage.setItem('battleshipStats', JSON.stringify(gameStats));
}

// ========================================
// SETUP (POSICIONAMENTO)
// ========================================

function startSetup() {
    console.log(`Iniciando modo: ${gameMode}, dificuldade: ${difficulty}`);
    showScreen('setup');
    
    setupBoard = new Board(CONFIG.BOARD_SIZE);
    playerBoard = new Board(CONFIG.BOARD_SIZE);
    
    shipsToPlace = [];
    CONFIG.SHIPS.forEach(shipData => {
        for (let i = 0; i < shipData.count; i++) {
            shipsToPlace.push(new Ship(shipData.name, shipData.size, shipData.emoji));
        }
    });
    
    currentShipIndex = 0;
    currentOrientation = false;
    
    renderSetupBoard();
    renderShipsList();
    setupSetupControls();
}

function renderSetupBoard() {
    const boardElement = document.getElementById('setupBoard');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
        for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            cell.addEventListener('click', () => placeShipAtPosition(row, col));
            cell.addEventListener('mouseenter', () => previewShipPlacement(row, col));
            cell.addEventListener('mouseleave', () => clearPreview());
            
            const boardCell = setupBoard.getCell(row, col);
            if (boardCell.ship) {
                cell.classList.add('ship');
                cell.textContent = boardCell.ship.emoji;
            }
            
            boardElement.appendChild(cell);
        }
    }
}

function renderShipsList() {
    const shipsListElement = document.getElementById('shipsToPlace');
    shipsListElement.innerHTML = '';
    
    shipsToPlace.forEach((ship, index) => {
        const shipItem = document.createElement('div');
        shipItem.className = 'ship-item';
        if (ship.positions.length > 0) {
            shipItem.classList.add('placed');
        }
        if (index === currentShipIndex && ship.positions.length === 0) {
            shipItem.classList.add('selected');
        }
        
        shipItem.innerHTML = `
            <span class="ship-name">${ship.emoji} ${ship.name}</span>
            <span class="ship-size">Tamanho: ${ship.size}</span>
        `;
        
        shipItem.addEventListener('click', () => {
            if (ship.positions.length === 0) {
                currentShipIndex = index;
                renderShipsList();
            }
        });
        
        shipsListElement.appendChild(shipItem);
    });
    
    updateSetupProgress();
    updateStartButton();
}

function updateSetupProgress() {
    const placed = shipsToPlace.filter(s => s.positions.length > 0).length;
    const total = shipsToPlace.length;
    
    const placedEl = document.getElementById('shipsPlaced');
    const fillEl = document.getElementById('progressBarFill');
    
    if (placedEl) placedEl.textContent = placed;
    if (fillEl) fillEl.style.width = `${(placed / total) * 100}%`;
}

function previewShipPlacement(row, col) {
    clearPreview();
    
    const ship = shipsToPlace[currentShipIndex];
    if (!ship || ship.positions.length > 0) return;
    
    ship.isVertical = currentOrientation;
    const positions = ship.getPositions(row, col);
    
    positions.forEach(pos => {
        const cell = document.querySelector(`#setupBoard [data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            const canPlace = setupBoard.canPlaceShip(ship, row, col);
            cell.style.background = canPlace ? '#90EE90' : '#FFB6C6';
            cell.style.opacity = '0.7';
        }
    });
}

function clearPreview() {
    document.querySelectorAll('#setupBoard .cell').forEach(cell => {
        if (!cell.classList.contains('ship')) {
            cell.style.background = '';
            cell.style.opacity = '';
        }
    });
}

function placeShipAtPosition(row, col) {
    const ship = shipsToPlace[currentShipIndex];
    if (!ship || ship.positions.length > 0) return;
    
    ship.isVertical = currentOrientation;
    
    if (setupBoard.placeShip(ship, row, col)) {
        playSoundEffect('place');
        renderSetupBoard();
        
        // Avançar para próximo navio
        do {
            currentShipIndex++;
        } while (currentShipIndex < shipsToPlace.length && 
                 shipsToPlace[currentShipIndex].positions.length > 0);
        
        if (currentShipIndex >= shipsToPlace.length) {
            currentShipIndex = 0;
        }
        
        renderShipsList();
    }
}

function setupSetupControls() {
    document.getElementById('rotateBtn').onclick = () => {
        currentOrientation = !currentOrientation;
        playSoundEffect('click');
    };
    
    document.getElementById('randomBtn').onclick = () => {
        setupBoard.placeShipsRandomly(CONFIG.SHIPS);
        shipsToPlace.forEach(ship => ship.positions = [1]);
        renderSetupBoard();
        renderShipsList();
        playSoundEffect('place');
    };
    
    document.getElementById('clearBtn').onclick = () => {
        setupBoard = new Board(CONFIG.BOARD_SIZE);
        shipsToPlace.forEach(ship => {
            ship.positions = [];
            ship.hits = new Set();
        });
        currentShipIndex = 0;
        renderSetupBoard();
        renderShipsList();
        playSoundEffect('click');
    };
    
    document.getElementById('startBattleBtn').onclick = () => {
        if (allShipsPlaced()) {
            startBattle();
        }
    };
}

function allShipsPlaced() {
    return shipsToPlace.every(ship => ship.positions.length > 0);
}

function updateStartButton() {
    const btn = document.getElementById('startBattleBtn');
    btn.disabled = !allShipsPlaced();
}

// ========================================
// BATALHA (PLACEHOLDER - SERÁ IMPLEMENTADO)
// ========================================

function startBattle() {
    console.log('⚔️ Iniciando batalha!');
    showScreen('battle');
    
    // Copiar navios do setup para o tabuleiro do jogador
    playerBoard = setupBoard;
    
    // Criar e posicionar navios inimigos
    enemyBoard = new Board(CONFIG.BOARD_SIZE);
    enemyBoard.placeShipsRandomly(CONFIG.SHIPS);
    
    // Resetar estatísticas de batalha
    battleStats = {
        shots: 0,
        hits: 0,
        startTime: Date.now(),
        endTime: null
    };
    
    isPlayerTurn = true;
    elapsedSeconds = 0;
    startTimer();
    
    renderBattleBoards();
    updateBattleUI();
}

function renderBattleBoards() {
    // Renderizar tabuleiro do jogador
    const playerBoardEl = document.getElementById('playerBoard');
    playerBoardEl.innerHTML = '';
    
    for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
        for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const boardCell = playerBoard.getCell(row, col);
            if (boardCell.ship) {
                cell.classList.add('ship');
                cell.textContent = boardCell.ship.emoji;
            }
            if (boardCell.isHit) cell.classList.add('hit');
            if (boardCell.isMiss) cell.classList.add('miss');
            
            playerBoardEl.appendChild(cell);
        }
    }
    
    // Renderizar tabuleiro inimigo
    const enemyBoardEl = document.getElementById('enemyBoard');
    enemyBoardEl.innerHTML = '';
    
    for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
        for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const boardCell = enemyBoard.getCell(row, col);
            if (boardCell.isHit) {
                cell.classList.add('hit');
                cell.textContent = '💥';
            }
            if (boardCell.isMiss) {
                cell.classList.add('miss');
                cell.textContent = '💧';
            }
            
            if (isPlayerTurn && !boardCell.isHit && !boardCell.isMiss) {
                cell.addEventListener('click', () => playerAttack(row, col));
            }
            
            enemyBoardEl.appendChild(cell);
        }
    }
}

function playerAttack(row, col) {
    if (!isPlayerTurn) return;
    
    const result = enemyBoard.receiveAttack(row, col);
    if (!result.valid) return;
    
    battleStats.shots++;
    if (result.result === 'hit') {
        battleStats.hits++;
        showMessage(`💥 Acertou! ${result.sunk ? '🔥 ' + result.ship.name + ' afundado!' : ''}`);
        playSoundEffect('hit');
    } else {
        showMessage('💧 Errou! Vez do inimigo...');
        playSoundEffect('miss');
        isPlayerTurn = false;
        setTimeout(enemyTurn, 1000);
    }
    
    renderBattleBoards();
    updateBattleUI();
    
    if (enemyBoard.allShipsSunk()) {
        endGame(true);
    }
}

function enemyTurn() {
    // IA simples - tiro aleatório
    let row, col;
    do {
        row = Math.floor(Math.random() * CONFIG.BOARD_SIZE);
        col = Math.floor(Math.random() * CONFIG.BOARD_SIZE);
    } while (playerBoard.shots.has(`${row},${col}`));
    
    const result = playerBoard.receiveAttack(row, col);
    
    if (result.result === 'hit') {
        showMessage(`😈 Inimigo acertou! ${result.sunk ? '💀 Seu ' + result.ship.name + ' foi afundado!' : ''}`);
        playSoundEffect('hit');
        setTimeout(enemyTurn, 1000);
    } else {
        showMessage('😅 Inimigo errou! Sua vez!');
        playSoundEffect('miss');
        isPlayerTurn = true;
    }
    
    renderBattleBoards();
    updateBattleUI();
    
    if (playerBoard.allShipsSunk()) {
        endGame(false);
    }
}

function updateBattleUI() {
    const shotsEl = document.getElementById('shotsCount');
    const hitsEl = document.getElementById('hitsCount');
    const accuracyEl = document.getElementById('accuracyPercent');
    
    if (shotsEl) shotsEl.textContent = battleStats.shots;
    if (hitsEl) hitsEl.textContent = battleStats.hits;
    if (accuracyEl) {
        const accuracy = battleStats.shots > 0 
            ? ((battleStats.hits / battleStats.shots) * 100).toFixed(1)
            : 0;
        accuracyEl.textContent = `${accuracy}%`;
    }
    
    // Atualizar barras de vida
    const playerHealth = playerBoard.ships.reduce((sum, ship) => sum + (ship.size - ship.hits.size), 0);
    const enemyHealth = enemyBoard.ships.reduce((sum, ship) => sum + (ship.size - ship.hits.size), 0);
    
    const playerHealthEl = document.getElementById('playerHealth');
    const enemyHealthEl = document.getElementById('enemyHealth');
    const playerHealthFill = document.getElementById('playerHealthFill');
    const enemyHealthFill = document.getElementById('enemyHealthFill');
    
    if (playerHealthEl) playerHealthEl.textContent = playerHealth;
    if (enemyHealthEl) enemyHealthEl.textContent = enemyHealth;
    if (playerHealthFill) playerHealthFill.style.width = `${(playerHealth / 17) * 100}%`;
    if (enemyHealthFill) enemyHealthFill.style.width = `${(enemyHealth / 17) * 100}%`;
}

function showMessage(message) {
    const msgEl = document.getElementById('messageDisplay');
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.style.animation = 'none';
        setTimeout(() => msgEl.style.animation = 'pulse 0.5s ease', 10);
    }
}

// ========================================
// TIMER
// ========================================

function startTimer() {
    gameTimer = setInterval(() => {
        elapsedSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const timerEl = document.getElementById('timerValue');
    if (timerEl) timerEl.textContent = timeString;
}

// ========================================
// FIM DE JOGO
// ========================================

function endGame(playerWon) {
    stopTimer();
    battleStats.endTime = Date.now();
    
    // Atualizar estatísticas globais
    gameStats.totalGames++;
    gameStats.totalShots += battleStats.shots;
    gameStats.totalHits += battleStats.hits;
    
    if (playerWon) {
        gameStats.wins++;
    } else {
        gameStats.losses++;
    }
    
    // Salvar histórico
    const gameRecord = {
        date: new Date().toISOString(),
        mode: gameMode,
        difficulty: difficulty,
        won: playerWon,
        shots: battleStats.shots,
        hits: battleStats.hits,
        accuracy: ((battleStats.hits / battleStats.shots) * 100).toFixed(1),
        duration: elapsedSeconds
    };
    
    gameStats.gamesHistory.unshift(gameRecord);
    if (gameStats.gamesHistory.length > 50) {
        gameStats.gamesHistory = gameStats.gamesHistory.slice(0, 50);
    }
    
    saveStats();
    showResultScreen(playerWon);
}

function showResultScreen(playerWon) {
    showScreen('result');
    
    const titleEl = document.getElementById('resultTitle');
    const statsEl = document.getElementById('resultStats');
    
    if (titleEl) {
        titleEl.textContent = playerWon ? '🏆 VITÓRIA!' : '💀 DERROTA!';
        titleEl.style.color = playerWon ? '#2ecc71' : '#e74c3c';
    }
    
    if (statsEl) {
        const accuracy = ((battleStats.hits / battleStats.shots) * 100).toFixed(1);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        statsEl.innerHTML = `
            <div class="stat-row">
                <span>🎯 Tiros disparados:</span>
                <strong>${battleStats.shots}</strong>
            </div>
            <div class="stat-row">
                <span>💥 Acertos:</span>
                <strong>${battleStats.hits}</strong>
            </div>
            <div class="stat-row">
                <span>📊 Precisão:</span>
                <strong>${accuracy}%</strong>
            </div>
            <div class="stat-row">
                <span>⏱️ Tempo:</span>
                <strong>${minutes}m ${seconds}s</strong>
            </div>
            <div class="stat-row">
                <span>🎮 Modo:</span>
                <strong>${gameMode}</strong>
            </div>
            <div class="stat-row">
                <span>🤖 Dificuldade:</span>
                <strong>${difficulty}</strong>
            </div>
        `;
    }
}

// ========================================
// NAVEGAÇÃO DE TELAS
// ========================================

function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        currentScreen = screenName;
    }
}

// ========================================
// EFEITOS SONOROS (PLACEHOLDER)
// ========================================

function playSoundEffect(type) {
    if (!soundEnabled) return;
    console.log(`🔊 Som: ${type}`);
    // Aqui você pode adicionar Web Audio API ou Howler.js
}

// ========================================
// CSS ADICIONAL NECESSÁRIO
// ========================================

// Adicione ao CSS:
const additionalStyles = `
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.stat-row {
    display: flex;
    justify-content: space-between;
    padding: 15px;
    background: white;
    margin-bottom: 10px;
    border-radius: 8px;
    font-size: 1.3rem;
}

.stat-row strong {
    color: var(--primary-color);
}

.progress-bar-setup {
    width: 100%;
    height: 20px;
    background: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    margin-top: 10px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    transition: width 0.3s ease;
    width: 0%;
}

.health-bar {
    position: relative;
    width: 100%;
    height: 25px;
    background: #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    margin-top: 15px;
}

.health-fill {
    height: 100%;
    background: linear-gradient(90deg, #2ecc71, #27ae60);
    transition: width 0.5s ease;
}

.health-fill.enemy {
    background: linear-gradient(90deg, #e74c3c, #c0392b);
}

.health-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 1.1rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.battle-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
}

.progress-indicator {
    background: white;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 15px;
}

.progress-indicator span {
    font-size: 1.2rem;
    font-weight: bold;
}
`;

console.log('✅ Sistema completo de Batalha Naval carregado!');
console.log('🎮 Funcionalidades implementadas:');
console.log('   ✓ Sistema de temas');
console.log('   ✓ Estatísticas persistentes');
console.log('   ✓ Timer de batalha');
console.log('   ✓ Botões de voltar');
console.log('   ✓ Barras de vida');
console.log('   ✓ Modal de estatísticas');
console.log('   ✓ Histórico de partidas');
console.log('   ✓ Splash screen');
