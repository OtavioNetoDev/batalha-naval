// ========================================
// BATALHA NAVAL - JAVASCRIPT PARTE 1
// Dia 5: Classes Base e Configuração
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
    }
};

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

    // Rotacionar navio
    rotate() {
        this.isVertical = !this.isVertical;
    }

    // Verificar se está afundado
    isSunk() {
        return this.hits.size === this.size;
    }

    // Registrar acerto
    hit(position) {
        this.hits.add(position);
        return this.isSunk();
    }

    // Obter posições ocupadas
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

    // Criar grade vazia
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

    // Validar posição
    isValidPosition(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    // Verificar se pode colocar navio
    canPlaceShip(ship, startRow, startCol) {
        const positions = ship.getPositions(startRow, startCol);
        
        // Verificar se todas as posições são válidas
        for (const pos of positions) {
            if (!this.isValidPosition(pos.row, pos.col)) {
                return false;
            }
            // Verificar se já tem navio
            if (this.grid[pos.row][pos.col].ship !== null) {
                return false;
            }
        }
        
        return true;
    }

    // Colocar navio
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

    // Remover navio
    removeShip(ship) {
        for (const pos of ship.positions) {
            if (this.isValidPosition(pos.row, pos.col)) {
                this.grid[pos.row][pos.col].ship = null;
            }
        }
        this.ships = this.ships.filter(s => s !== ship);
        ship.positions = [];
    }

    // Atirar em uma célula
    receiveAttack(row, col) {
        const shotKey = `${row},${col}`;
        
        // Verificar se já atirou aqui
        if (this.shots.has(shotKey)) {
            return { valid: false, result: 'already-shot' };
        }

        this.shots.add(shotKey);
        const cell = this.grid[row][col];

        if (cell.ship) {
            // Acertou!
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
            // Errou!
            cell.isMiss = true;
            this.misses.add(shotKey);
            
            return {
                valid: true,
                result: 'miss'
            };
        }
    }

    // Verificar se todos os navios foram afundados
    allShipsSunk() {
        return this.ships.every(ship => ship.isSunk());
    }

    // Obter célula
    getCell(row, col) {
        if (!this.isValidPosition(row, col)) return null;
        return this.grid[row][col];
    }

    // Posicionar navios aleatoriamente
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

// Variáveis Globais
let game = null;
let playerBoard = null;
let enemyBoard = null;
let currentScreen = 'mainMenu';
let gameMode = 'classic';
let difficulty = 'medium';
let isPlayerTurn = true;

// Elementos DOM
const screens = {
    mainMenu: document.getElementById('mainMenu'),
    setup: document.getElementById('setupScreen'),
    battle: document.getElementById('battleScreen'),
    result: document.getElementById('resultScreen')
};

// Inicialização
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('🚢 Batalha Naval Iniciando...');
    setupEventListeners();
    showScreen('mainMenu');
}

// Configurar Event Listeners
function setupEventListeners() {
    // Botões do menu principal
    document.querySelectorAll('.btn-menu').forEach(btn => {
        btn.addEventListener('click', (e) => {
            gameMode = e.currentTarget.dataset.mode;
            startSetup();
        });
    });

    // Dificuldade
    document.getElementById('difficultySelect').addEventListener('change', (e) => {
        difficulty = e.target.value;
    });

    // Controles
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
}

// Mostrar tela
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
    currentScreen = screenName;
}

// Tema e Som (placeholders)
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function toggleSound() {
    console.log('Som toggled');
}

// Iniciar fase de setup
function startSetup() {
    console.log(`Iniciando modo: ${gameMode}, dificuldade: ${difficulty}`);
    showScreen('setup');
    // Será implementado no próximo dia
}

console.log('✅ Base do jogo carregada!');

// ========================================
// BATALHA NAVAL - JAVASCRIPT PARTE 2
// Dia 6: Sistema de Posicionamento
// Adicione ao final do script.js
// ========================================

let setupBoard = null;
let shipsToPlace = [];
let currentShipIndex = 0;
let currentOrientation = false; // false = horizontal, true = vertical

// Iniciar fase de setup (atualizar função do dia 5)
function startSetup() {
    console.log(`Iniciando modo: ${gameMode}, dificuldade: ${difficulty}`);
    showScreen('setup');
    
    // Criar tabuleiro de setup
    setupBoard = new Board(CONFIG.BOARD_SIZE);
    playerBoard = new Board(CONFIG.BOARD_SIZE);
    
    // Criar navios para posicionar
    shipsToPlace = [];
    CONFIG.SHIPS.forEach(shipData => {
        for (let i = 0; i < shipData.count; i++) {
            shipsToPlace.push(new Ship(shipData.name, shipData.size, shipData.emoji));
        }
    });
    
    renderSetupBoard();
    renderShipsList();
    setupSetupControls();
}

// Renderizar tabuleiro de setup
function renderSetupBoard() {
    const boardElement = document.getElementById('setupBoard');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < CONFIG.BOARD_SIZE; row++) {
        for (let col = 0; col < CONFIG.BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Event listeners para posicionamento
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

// Renderizar lista de navios
function renderShipsList() {
    const shipsListElement = document.getElementById('shipsToPlace');
    shipsListElement.innerHTML = '';
    
    shipsToPlace.forEach((ship, index) => {
        const shipItem = document.createElement('div');
        shipItem.className = 'ship-item';
        if (ship.positions.length > 0) {
            shipItem.classList.add('placed');
        }
        if (index === currentShipIndex) {
            shipItem.style.border = '3px solid #0077be';
        }
        
        shipItem.innerHTML = `
            <span class="ship-name">${ship.emoji} ${ship.name}</span>
            <span class="ship-size">Tamanho: ${ship.size}</span>
        `;
        
        shipItem.addEventListener('click', () => {
            currentShipIndex = index;
            renderShipsList();
        });
        
        shipsListElement.appendChild(shipItem);
    });
    
    updateStartButton();
}

// Preview de posicionamento
function previewShipPlacement(row, col) {
    clearPreview();
    
    const ship = shipsToPlace[currentShipIndex];
    if (!ship || ship.positions.length > 0) return;
    
    ship.isVertical = currentOrientation;
    const positions = ship.getPositions(row, col);
    
    positions.forEach(pos => {
        const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            const canPlace = setupBoard.canPlaceShip(ship, row, col);
            cell.style.background = canPlace ? '#90EE90' : '#FFB6C6';
            cell.style.opacity = '0.7';
        }
    });
}

// Limpar preview
function clearPreview() {
    document.querySelectorAll('#setupBoard .cell').forEach(cell => {
        if (!cell.classList.contains('ship')) {
            cell.style.background = '';
            cell.style.opacity = '';
        }
    });
}

// Colocar navio
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

// Configurar controles de setup
function setupSetupControls() {
    // Botão rotacionar
    document.getElementById('rotateBtn').addEventListener('click', () => {
        currentOrientation = !currentOrientation;
        playSoundEffect('click');
    });
    
    // Botão aleatório
    document.getElementById('randomBtn').addEventListener('click', () => {
        setupBoard.placeShipsRandomly(CONFIG.SHIPS);
        shipsToPlace.forEach(ship => ship.positions = [1]); // Marcar como colocados
        renderSetupBoard();
        renderShipsList();
        playSoundEffect('place');
    });
    
    // Botão limpar
    document.getElementById('clearBtn').addEventListener('click', () => {
        setupBoard = new Board(CONFIG.BOARD_SIZE);
        shipsToPlace.forEach(ship => {
            ship.positions = [];
            ship.hits = new Set();
        });
        currentShipIndex = 0;
        renderSetupBoard();
        renderShipsList();
        playSoundEffect('click');
    });
    
    // Botão iniciar batalha
    document.getElementById('startBattleBtn').addEventListener('click', () => {
        if (allShipsPlaced()) {
            startBattle();
        }
    });
}

// Verificar se todos os navios foram colocados
function allShipsPlaced() {
    return shipsToPlace.every(ship => ship.positions.length > 0);
}

// Atualizar botão de iniciar
function updateStartButton() {
    const btn = document.getElementById('startBattleBtn');
    btn.disabled = !allShipsPlaced();
}

// Placeholder para sons
function playSoundEffect(type) {
    console.log(`Som: ${type}`);
}

console.log('✅ Sistema de posicionamento carregado!');
