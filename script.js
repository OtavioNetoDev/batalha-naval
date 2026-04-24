// Constantes do jogo
const BOARD_SIZE = 10;
const SHIPS = [
    { name: '🛩️ Porta-Aviões', size: 5, emoji: '🛩️' },
    { name: '🚢 Encouraçado', size: 4, emoji: '🚢' },
    { name: '⛴️ Cruzador', size: 3, emoji: '⛴️' },
    { name: '🔱 Submarino', size: 3, emoji: '🔱' },
    { name: '🚤 Destroyer', size: 2, emoji: '🚤' }
];

const BOSS_SHIP = { name: '🚢 TITANIC', size: 6, emoji: '🛳️' };

// Classe do Jogo
class BattleshipGame {
    constructor() {
        this.settings = {
            aiDifficulty: 'medium',
            soundEnabled: true,
            playerName: 'Jogador',
            theme: 'dark'
        };
        this.gameState = 'menu';
        this.gameMode = null;
        this.campaignLevel = 1;
        this.playerBoard = [];
        this.aiBoard = [];
        this.playerShips = [];
        this.aiShips = [];
        this.currentShipIndex = null;
        this.shipOrientation = 'horizontal';
        this.stats = {
            shotsGiven: 0,
            hits: 0,
            misses: 0,
            shipsDestroyed: 0
        };
        this.aiStats = {
            shotsGiven: 0,
            hits: 0,
            misses: 0
        };
        this.isPlayerTurn = true;
        this.aiTargetQueue = [];
        this.sosRescued = 0;
        this.sosActions = 0;
        this.sosMission = null;
        this.sosTimer = 0;
        this.sosTimerInterval = null;
        this.sosPenalties = 0;
        this.sosClickCooldown = false;
        this.sosObstacles = [];
        this.sosSurvivors = [];
        this.sosBoardSize = 10;
        this.cartesianMode = false;
        this.cartesianBoardSize = 11; // NOVO: Tamanho do tabuleiro cartesiano
        
        // Multiplayer
        this.multiplayerState = {
            player1Name: 'Jogador 1',
            player2Name: 'Jogador 2',
            player1Board: [],
            player2Board: [],
            player1Ships: [],
            player2Ships: [],
            currentPlayer: 1,
            player1Stats: { shotsGiven: 0, hits: 0, misses: 0, shipsDestroyed: 0 },
            player2Stats: { shotsGiven: 0, hits: 0, misses: 0, shipsDestroyed: 0 },
            placementPhase: 1
        };
        
        this.loadSettings();
        this.loadStats();
        this.applyTheme();
        this.initSounds();
    }

    // adicionando plano carteesiano //
    showCartesianMenu() {
    this.showScreen('cartesianMenuScreen');
}

    loadSettings() {
        const saved = localStorage.getItem('battleship_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            document.getElementById('aiDifficulty').value = this.settings.aiDifficulty;
            document.getElementById('soundEnabled').value = this.settings.soundEnabled;
            document.getElementById('playerName').value = this.settings.playerName;
            document.getElementById('theme').value = this.settings.theme;
        }
    }

    saveSettings() {
        this.settings.aiDifficulty = document.getElementById('aiDifficulty').value;
        this.settings.soundEnabled = document.getElementById('soundEnabled').value === 'true';
        this.settings.playerName = document.getElementById('playerName').value;
        this.settings.theme = document.getElementById('theme').value;
        localStorage.setItem('battleship_settings', JSON.stringify(this.settings));
        this.applyTheme();
    }

    applyTheme() {
        if (this.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    loadStats() {
        const saved = localStorage.getItem('battleship_stats');
        if (saved) {
            this.globalStats = JSON.parse(saved);
        } else {
            this.globalStats = {
                gamesPlayed: 0,
                gamesWon: 0,
                totalShots: 0,
                totalHits: 0,
                campaignProgress: 0,
                achievements: []
            };
        }
    }
    initSounds() {
        this._soundFiles = {
            click:     'assets/sounds/ClickSound.wav',
            hit:       'assets/sounds/HitSound.wav',
            explosion: 'assets/sounds/ExplosionShipSound.wav',
            miss:      'assets/sounds/MissSound.wav'
        };
        this._soundCache = {};
        this._audioReady = false;

        // Desbloqueia autoplay no primeiro gesto do usuario
        const unlock = () => {
            if (this._audioReady) return;
            this._audioReady = true;
            document.removeEventListener('click',      unlock);
            document.removeEventListener('touchstart', unlock);
            // Pre-carrega todos os sons apos desbloqueio
            Object.keys(this._soundFiles).forEach(name => {
                const a = new Audio(this._soundFiles[name]);
                a.volume = 0.5;
                a.load();
                this._soundCache[name] = a;
            });
        };
        document.addEventListener('click',      unlock);
        document.addEventListener('touchstart', unlock);

        // Listener global: clique em qualquer .btn fora do tabuleiro toca click
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn, .ship-item, .mission-card');
            if (btn && !e.target.closest('.board')) {
                this.playSound('click');
            }
        });
    }

    playSound(soundName) {
        if (!this.settings.soundEnabled) return;
        if (!this._audioReady) return;
        const original = this._soundCache[soundName];
        if (!original) return;
        // Clona para permitir sobreposicao rapida (ex: vários hits seguidos)
        const clone = original.cloneNode();
        clone.volume = 0.5;
        clone.play().catch(() => {
            original.currentTime = 0;
            original.play().catch(() => {});
        });
    }


    saveStats() {
        localStorage.setItem('battleship_stats', JSON.stringify(this.globalStats));
    }

    showSettings() {
        document.getElementById('settingsPanel').classList.remove('hidden');
    }

    hideSettings() {
        this.saveSettings();
        document.getElementById('settingsPanel').classList.add('hidden');
    }

    showStats() {
        const accuracy = this.globalStats.totalShots > 0 
            ? ((this.globalStats.totalHits / this.globalStats.totalShots) * 100).toFixed(1)
            : 0;
        
        alert(`📊 ESTATÍSTICAS GERAIS\n\n` +
            `🎮 Partidas Jogadas: ${this.globalStats.gamesPlayed}\n` +
            `🏆 Vitórias: ${this.globalStats.gamesWon}\n` +
            `🎯 Taxa de Vitória: ${this.globalStats.gamesPlayed > 0 ? ((this.globalStats.gamesWon / this.globalStats.gamesPlayed) * 100).toFixed(1) : 0}%\n` +
            `💥 Total de Tiros: ${this.globalStats.totalShots}\n` +
            `🎯 Total de Acertos: ${this.globalStats.totalHits}\n` +
            `📈 Precisão Média: ${accuracy}%\n` +
            `🏆 Progresso Campanha: Nível ${this.globalStats.campaignProgress}/10`);
    }

    showAchievements() {
        alert('🏆 CONQUISTAS\n\nSistema de conquistas em desenvolvimento!\n\n' +
            'Futuras conquistas:\n' +
            '🎯 Atirador de Elite - 80%+ de precisão\n' +
            '💥 Destruidor Total - Vença sem errar\n' +
            '⚡ Relâmpago - Vença em menos de 50 tiros\n' +
            '🎖️ Veterano - Vença 10 partidas\n' +
            '👑 Almirante - Complete a campanha\n' +
            '🦈 Caçador do Titanic - Derrote o boss final');
    }

    startGame(mode) {
    this.gameMode = mode;
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Detecta se é modo cartesiano
    if (mode === 'cartesian-classic' || mode === 'cartesian-multiplayer') {
        this.cartesianMode = true;
        
        if (mode === 'cartesian-classic') {
            this.gameMode = 'classic'; // Usa lógica do clássico
        } else if (mode === 'cartesian-multiplayer') {
            this.gameMode = 'multiplayer'; // Usa lógica do multiplayer
        }
    } else {
        this.cartesianMode = false;
    }
    
    // Atualiza instruções se estiver no modo cartesiano
    if (this.cartesianMode) {
        const instructions = document.getElementById('placementInstructions');
        if (instructions) {
            instructions.textContent = 'Modo Plano Cartesiano: Use as coordenadas X (horizontal) e Y (vertical) para posicionar seus navios!';
        }
    }
    
    // Lógica normal do startGame
    if (this.gameMode === 'sos') {
        this.showScreen('sosMissionScreen');
        return;
    }
    
    if (this.gameMode === 'multiplayer') {
        const player1 = prompt('Digite o nome do Jogador 1:', 'Jogador 1');
        const player2 = prompt('Digite o nome do Jogador 2:', 'Jogador 2');
        
        if (player1 && player2) {
            this.multiplayerState.player1Name = player1;
            this.multiplayerState.player2Name = player2;
            this.multiplayerState.placementPhase = 1;
            this.multiplayerState.currentPlayer = 1;
        }
    }
    
    this.resetGame();
    this.showScreen('placementScreen');
    
    setTimeout(() => {
        // Desabilitar botão imediatamente antes de qualquer coisa
        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) { confirmBtn.disabled = true; }

        this.initPlacementBoard();
        this.renderShipsToPlace();
        this.checkPlacementComplete();
    }, 100);
}
 
// ========== MULTIPLAYER ==========
    startMultiplayer() {
        // Mostrar modal para inserir nomes dos jogadores
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const buttons = document.getElementById('gameOverButtons');
        
        title.textContent = '👥 MODO MULTIPLAYER';
        message.innerHTML = `
            <p style="margin-bottom: 1.5rem;">Digite os nomes dos jogadores:</p>
            <div style="margin-bottom: 1rem; text-align: left;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">🎮 Jogador 1:</label>
                <input type="text" id="player1NameInput" value="Jogador 1" maxlength="20" 
                    style="width: 100%; padding: 0.8rem; font-size: 1.1rem; border-radius: 6px; border: 2px solid var(--panel-border); background: var(--cell-bg); color: var(--text-primary);">
            </div>
            <div style="margin-bottom: 1rem; text-align: left;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">🎮 Jogador 2:</label>
                <input type="text" id="player2NameInput" value="Jogador 2" maxlength="20"
                    style="width: 100%; padding: 0.8rem; font-size: 1.1rem; border-radius: 6px; border: 2px solid var(--panel-border); background: var(--cell-bg); color: var(--text-primary);">
            </div>
        `;
        
        buttons.innerHTML = `
            <button class="btn btn-primary" onclick="game.confirmMultiplayerNames()">✓ Começar Jogo</button>
            <button class="btn btn-secondary" onclick="game.closeModalAndAction(() => game.returnToMenu())">🏠 Cancelar</button>
        `;
        
        modal.classList.add('active');
    }

    confirmMultiplayerNames() {
        const player1Name = document.getElementById('player1NameInput').value.trim() || 'Jogador 1';
        const player2Name = document.getElementById('player2NameInput').value.trim() || 'Jogador 2';
        
        this.multiplayerState.player1Name = player1Name;
        this.multiplayerState.player2Name = player2Name;
        this.multiplayerState.placementPhase = 1;
        this.multiplayerState.currentPlayer = 1;
        
        document.getElementById('gameOverModal').classList.remove('active');
        
        this.resetGame();
        this.gameState = 'placement';
        this.showScreen('placementScreen');

        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) { confirmBtn.disabled = true; }

        this.initPlacementBoard();
        this.renderShipsToPlace();
        this.checkPlacementComplete();
        
        const placementTitle = document.querySelector('#placementScreen h2');
        placementTitle.textContent = `🚢 ${player1Name} - Posicione Seus Navios`;
        
        alert(`🎮 ${player1Name}, posicione seus navios!\n\n⚠️ Certifique-se de que ${player2Name} não está olhando!`);
    }

    confirmPlacement() {
        if (this.gameMode === 'multiplayer') {
            if (this.multiplayerState.placementPhase === 1) {
                // Jogador 1 terminou, salvar navios
                this.multiplayerState.player1Board = this.playerBoard.map(row => [...row]);
                this.multiplayerState.player1Ships = JSON.parse(JSON.stringify(this.playerShips));
                
                // Preparar para Jogador 2
                this.multiplayerState.placementPhase = 2;
                this.playerBoard = this.createEmptyBoard();
                this.playerShips = [];
                this.currentShipIndex = null;

                const confirmBtn = document.getElementById('confirmBtn');
                if (confirmBtn) { confirmBtn.disabled = true; }

                this.initPlacementBoard();
                this.renderShipsToPlace();
                this.checkPlacementComplete();
                
                const placementTitle = document.querySelector('#placementScreen h2');
                placementTitle.textContent = `🚢 ${this.multiplayerState.player2Name} - Posicione Seus Navios`;
                
                alert(`🎮 ${this.multiplayerState.player2Name}, é sua vez!\n\n⚠️ Certifique-se de que ${this.multiplayerState.player1Name} não está olhando!`);
                
            } else {
                // Jogador 2 terminou, iniciar jogo
                this.multiplayerState.player2Board = this.playerBoard.map(row => [...row]);
                this.multiplayerState.player2Ships = JSON.parse(JSON.stringify(this.playerShips));
                
                this.startMultiplayerGame();
            }
        } else {
            // Lógica original para outros modos
            this.aiPlaceShips();
            this.gameState = 'playing';
            this.showScreen('gameScreen');
            
            document.getElementById('enemyBoardSection').style.display = 'block';
            document.getElementById('playerBoardSection').style.display = 'block';
            document.getElementById('sosBoardSection').style.display = 'none';
            
            this.initGameBoards();
            this.updateGameInfo();
            this.updateModeUI();
        }
    }

    startMultiplayerGame() {
        this.gameState = 'playing';
        this.multiplayerState.currentPlayer = 1;
        
        // Resetar stats
        this.multiplayerState.player1Stats = { shotsGiven: 0, hits: 0, misses: 0, shipsDestroyed: 0 };
        this.multiplayerState.player2Stats = { shotsGiven: 0, hits: 0, misses: 0, shipsDestroyed: 0 };
        
        this.showScreen('gameScreen');
        
        document.getElementById('enemyBoardSection').style.display = 'block';
        document.getElementById('playerBoardSection').style.display = 'block';
        document.getElementById('sosBoardSection').style.display = 'none';
        document.getElementById('campaignInfo').classList.add('hidden');
        document.getElementById('sosInfo').classList.add('hidden');
        
        this.renderMultiplayerBoards();
        this.updateMultiplayerUI();
        
        // FORÇAR esconder tabuleiro próprio imediatamente
        const playerBoard = document.getElementById('playerBoardSection');
        playerBoard.classList.add('multiplayer-hidden');
        playerBoard.style.display = 'none';
        
        alert(`🎯 COMEÇA: ${this.multiplayerState.player1Name.toUpperCase()}!\n\n▶️ Clique no tabuleiro inimigo para atirar\n\n📋 Seu tabuleiro está escondido para manter o jogo justo!`);
    }

    renderMultiplayerBoards() {
        const currentPlayer = this.multiplayerState.currentPlayer;
        
        // Renderizar tabuleiro do oponente (sem mostrar navios)
        this.renderMultiplayerBoard('enemyBoard', currentPlayer === 1 ? 2 : 1, false);
        
        // Renderizar tabuleiro do jogador atual (mostrando navios)
        this.renderMultiplayerBoard('playerBoard', currentPlayer, true);
        
        // GARANTIR que o tabuleiro próprio fique escondido
        setTimeout(() => {
            document.getElementById('playerBoardSection').classList.add('multiplayer-hidden');
        }, 10);
    }

    renderMultiplayerBoard(boardId, player, showShips) {
        const board = document.getElementById(boardId);
        if (!board) return;
        board.innerHTML = '';
        board.style.display = 'grid';

        const playerBoard = player === 1 ? this.multiplayerState.player1Board : this.multiplayerState.player2Board;
        const playerShips = player === 1 ? this.multiplayerState.player1Ships : this.multiplayerState.player2Ships;
        const isEnemyBoard = boardId === 'enemyBoard';

        // Função auxiliar para aplicar estado visual à célula
        const applyVisualState = (cell, cellValue, isAxis, shipsList, isEnemy) => {
            if (isEnemy) {
                if (cellValue === -1) {
                    cell.classList.add('miss');
                    if (isAxis) {
                        cell.style.background = 'rgba(100,100,100,0.7)';
                        cell.style.border = '2px solid #ff6b6b';
                        cell.textContent = '✕';
                        cell.style.color = '#ff6b6b';
                    }
                } else if (cellValue === -2) {
                    cell.classList.add('hit');
                    cell.textContent = '💥';
                    if (isAxis) { cell.style.outline = '2px solid #ff6b6b'; }
                } else if (cellValue > 0) {
                    const shipIndex = cellValue - 1;
                    if (shipsList[shipIndex] && shipsList[shipIndex].hits === shipsList[shipIndex].size) {
                        cell.classList.add('sunk');
                        cell.textContent = '☠️';
                    }
                }
            } else {
                if (showShips && cellValue > 0) {
                    cell.classList.add('ship');
                }
                if (cellValue === -1) {
                    cell.classList.add('miss');
                    if (isAxis) {
                        cell.style.background = 'rgba(100,100,100,0.7)';
                        cell.style.border = '2px solid #ff6b6b';
                        cell.textContent = '✕';
                        cell.style.color = '#ff6b6b';
                    }
                } else if (cellValue === -2) {
                    cell.classList.add('hit');
                    cell.textContent = '💥';
                    if (isAxis) { cell.style.outline = '2px solid #ff6b6b'; }
                }
                // Verificar navio afundado
                if (cellValue > 0 || cellValue === -2) {
                    const originalValue = cellValue === -2 ? this.getOriginalShipValue(player, parseInt(cell.dataset.row), parseInt(cell.dataset.col)) : cellValue;
                    if (originalValue > 0) {
                        const shipIndex = originalValue - 1;
                        if (shipsList[shipIndex] && shipsList[shipIndex].hits === shipsList[shipIndex].size) {
                            cell.classList.remove('hit');
                            cell.classList.add('sunk');
                            cell.textContent = '☠️';
                        }
                    }
                }
            }
        };

        if (this.cartesianMode) {
            // ── Tabuleiro cartesiano -5 a 5 ──
            const gridSize = 11;
            board.style.gridTemplateColumns = `repeat(${gridSize + 1}, 1fr)`;
            board.style.gridTemplateRows    = `repeat(${gridSize + 1}, 1fr)`;

            // Célula de canto X/Y
            const xyCell = document.createElement('div');
            xyCell.className = 'board-cell header cartesian-origin';
            xyCell.innerHTML = '<div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:100%;height:1px;background:white;transform:rotate(-45deg);"></div><span style="position:absolute;top:5%;left:70%;font-size:0.7rem;font-weight:bold;">X</span><span style="position:absolute;bottom:5%;left:10%;font-size:0.7rem;font-weight:bold;">Y</span></div>';
            board.appendChild(xyCell);

            // Cabeçalho eixo X (-5 a 5)
            for (let x = -5; x <= 5; x++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell header';
                cell.textContent = x;
                cell.style.fontWeight = 'bold';
                if (x === 0) { cell.style.color = '#ff6b6b'; }
                board.appendChild(cell);
            }

            // Linhas (Y de 5 a -5)
            for (let y = 5; y >= -5; y--) {
                const rowHeader = document.createElement('div');
                rowHeader.className = 'board-cell header';
                rowHeader.textContent = y;
                rowHeader.style.fontWeight = 'bold';
                if (y === 0) { rowHeader.style.color = '#ff6b6b'; }
                board.appendChild(rowHeader);

                for (let x = -5; x <= 5; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';

                    const arrayRow = 5 - y;
                    const arrayCol = x + 5;

                    cell.dataset.row   = arrayRow.toString();
                    cell.dataset.col   = arrayCol.toString();
                    cell.dataset.cartX = x.toString();
                    cell.dataset.cartY = y.toString();

                    const isAxis = (x === 0 || y === 0);
                    if (isAxis) {
                        cell.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                        cell.style.borderColor      = '#ff6b6b';
                    }

                    const cellValue = playerBoard[arrayRow] ? playerBoard[arrayRow][arrayCol] : 0;
                    applyVisualState(cell, cellValue, isAxis, playerShips, isEnemyBoard);

                    if (isEnemyBoard) {
                        cell.addEventListener('click', () => this.multiplayerShoot(arrayRow, arrayCol));
                    }

                    board.appendChild(cell);
                }
            }

        } else {
            // ── Tabuleiro normal A-J / 1-10 ──
            board.style.gridTemplateColumns = `repeat(${BOARD_SIZE + 1}, 1fr)`;
            board.style.gridTemplateRows    = `repeat(${BOARD_SIZE + 1}, 1fr)`;

            const emptyCell = document.createElement('div');
            emptyCell.className = 'board-cell header';
            board.appendChild(emptyCell);

            for (let i = 0; i < BOARD_SIZE; i++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell header';
                cell.textContent = String.fromCharCode(65 + i);
                board.appendChild(cell);
            }

            for (let row = 0; row < BOARD_SIZE; row++) {
                const rowHeader = document.createElement('div');
                rowHeader.className = 'board-cell header';
                rowHeader.textContent = row + 1;
                board.appendChild(rowHeader);

                for (let col = 0; col < BOARD_SIZE; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';
                    cell.dataset.row = row;
                    cell.dataset.col = col;

                    const cellValue = playerBoard[row][col];
                    applyVisualState(cell, cellValue, false, playerShips, isEnemyBoard);

                    if (isEnemyBoard) {
                        cell.addEventListener('click', () => this.multiplayerShoot(row, col));
                    }

                    board.appendChild(cell);
                }
            }
        }
    }

    getOriginalShipValue(player, row, col) {
        const ships = player === 1 ? this.multiplayerState.player1Ships : this.multiplayerState.player2Ships;
        
        for (let i = 0; i < ships.length; i++) {
            if (ships[i] && ships[i].positions) {
                for (let pos of ships[i].positions) {
                    if (pos[0] === row && pos[1] === col) {
                        return i + 1;
                    }
                }
            }
        }
        return 0;
    }

    multiplayerShoot(row, col) {
        if (this.gameState !== 'playing') return;

        const currentPlayer = this.multiplayerState.currentPlayer;
        const enemyPlayer = currentPlayer === 1 ? 2 : 1;
        const enemyBoard = enemyPlayer === 1 ? this.multiplayerState.player1Board : this.multiplayerState.player2Board;
        const enemyShips = enemyPlayer === 1 ? this.multiplayerState.player1Ships : this.multiplayerState.player2Ships;
        const currentStats = currentPlayer === 1 ? this.multiplayerState.player1Stats : this.multiplayerState.player2Stats;

        if (enemyBoard[row][col] === -1 || enemyBoard[row][col] === -2) {
            return;
        }

        const cell = document.querySelector(`#enemyBoard .board-cell[data-row="${row}"][data-col="${col}"]`);
        const isAxisCell = this.cartesianMode && cell && (cell.dataset.cartX === '0' || cell.dataset.cartY === '0');

        currentStats.shotsGiven++;

        if (enemyBoard[row][col] > 0) {
            currentStats.hits++;

            const shipIndex = enemyBoard[row][col] - 1;
            enemyShips[shipIndex].hits++;
            enemyBoard[row][col] = -2;

            if (cell) {
                cell.classList.add('hit');
                cell.textContent = '💥';
                if (isAxisCell) { cell.style.outline = '2px solid #ff6b6b'; }
            }

            if (enemyShips[shipIndex].hits === enemyShips[shipIndex].size) {
                // Afundou — explosão
                this.playSound('explosion');
                currentStats.shipsDestroyed++;
                this.markMultiplayerShipAsSunk(enemyPlayer, shipIndex);

                const playerName = currentPlayer === 1 ? this.multiplayerState.player1Name : this.multiplayerState.player2Name;
                setTimeout(() => {
                    alert(`🎉 ${playerName} afundou ${enemyShips[shipIndex].name}!`);
                }, 100);

                if (currentStats.shipsDestroyed === SHIPS.length) {
                    this.endMultiplayerGame(currentPlayer);
                    return;
                }
            } else {
                // Acertou mas não afundou
                this.playSound('hit');
            }

            this.updateMultiplayerUI();
        } else {
            currentStats.misses++;
            this.playSound('miss');
            enemyBoard[row][col] = -1;

            if (cell) {
                cell.classList.add('miss');
                if (isAxisCell) {
                    cell.style.background = 'rgba(100,100,100,0.7)';
                    cell.style.border = '2px solid #ff6b6b';
                    cell.textContent = '✕';
                    cell.style.color = '#ff6b6b';
                }
            }

            this.switchMultiplayerTurn();
        }
    }

    markMultiplayerShipAsSunk(player, shipIndex) {
        const ships = player === 1 ? this.multiplayerState.player1Ships : this.multiplayerState.player2Ships;
        const currentPlayer = this.multiplayerState.currentPlayer;
        const boardId = 'enemyBoard'; // Sempre marca no tabuleiro inimigo

        ships[shipIndex].positions.forEach(([row, col]) => {
            const cell = document.querySelector(`#${boardId} .board-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.remove('hit');
                cell.classList.add('sunk');
                cell.textContent = '☠️';
            }
        });
    }

    switchMultiplayerTurn() {
        const oldPlayer = this.multiplayerState.currentPlayer;
        this.multiplayerState.currentPlayer = oldPlayer === 1 ? 2 : 1;
        const newPlayer = this.multiplayerState.currentPlayer;

        const newPlayerName = newPlayer === 1 ? this.multiplayerState.player1Name : this.multiplayerState.player2Name;
        const oldPlayerName = oldPlayer === 1 ? this.multiplayerState.player1Name : this.multiplayerState.player2Name;

        // Criar overlay automático — sem botão, some em 1 segundo
        const overlay = document.createElement('div');
        overlay.id = 'turnOverlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(0,0,0,0.88);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            animation: fadeInOverlay 0.2s ease;
        `;
        overlay.innerHTML = `
            <div style="text-align:center; padding: 2rem;">
                <div style="font-size: 3.5rem; margin-bottom: 1rem;">🔄</div>
                <p style="font-size: 2.2rem; font-weight: 700; color: var(--explosion-yellow); margin-bottom: 0.8rem; font-family: 'Oswald', sans-serif; letter-spacing: 2px;">
                    VEZ DE: ${newPlayerName.toUpperCase()}!
                </p>
            </div>
        `;

        // Garantir que a animação existe
        if (!document.getElementById('turnOverlayStyle')) {
            const style = document.createElement('style');
            style.id = 'turnOverlayStyle';
            style.textContent = `
                @keyframes fadeInOverlay  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeOutOverlay { from { opacity: 1; } to { opacity: 0; } }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);

        // Some automaticamente após 1 segundo
        setTimeout(() => {
            overlay.style.animation = 'fadeOutOverlay 0.3s ease forwards';
            setTimeout(() => {
                overlay.remove();
                this.continueMultiplayerTurn();
            }, 300);
        }, 1000);
    }

    continueMultiplayerTurn() {
        // Renderizar tabuleiros para o novo jogador
        this.renderMultiplayerBoards();
        this.updateMultiplayerUI();

        // Esconder tabuleiro próprio
        const playerBoard = document.getElementById('playerBoardSection');
        playerBoard.classList.add('multiplayer-hidden');
        playerBoard.style.display = 'none';
    }

    updateMultiplayerUI() {
        const currentPlayer = this.multiplayerState.currentPlayer;
        const player1Name = this.multiplayerState.player1Name;
        const player2Name = this.multiplayerState.player2Name;
        
        const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;
        const enemyPlayerName = currentPlayer === 1 ? player2Name : player1Name;
        
        const currentStats = currentPlayer === 1 ? this.multiplayerState.player1Stats : this.multiplayerState.player2Stats;
        const enemyStats = currentPlayer === 1 ? this.multiplayerState.player2Stats : this.multiplayerState.player1Stats;
        
        const currentShips = currentPlayer === 1 ? this.multiplayerState.player1Ships : this.multiplayerState.player2Ships;
        const enemyShips = currentPlayer === 1 ? this.multiplayerState.player2Ships : this.multiplayerState.player1Ships;
        
        // Atualizar nomes
        document.getElementById('playerNameDisplay').textContent = currentPlayerName;
        document.getElementById('enemyNameDisplay').textContent = enemyPlayerName;
        
        // Atualizar navios restantes
        const playerShipsLeft = currentShips.filter(s => s && s.hits < s.size).length;
        const enemyShipsLeft = enemyShips.filter(s => s && s.hits < s.size).length;
        
        document.getElementById('playerShipsLeft').textContent = playerShipsLeft;
        document.getElementById('aiShipsLeft').textContent = enemyShipsLeft;
        
        // Atualizar precisão
        const playerAccuracy = currentStats.shotsGiven > 0 
            ? ((currentStats.hits / currentStats.shotsGiven) * 100).toFixed(1)
            : 0;
        const enemyAccuracy = enemyStats.shotsGiven > 0
            ? ((enemyStats.hits / enemyStats.shotsGiven) * 100).toFixed(1)
            : 0;
        
        document.getElementById('playerAccuracy').textContent = playerAccuracy + '%';
        document.getElementById('aiAccuracy').textContent = enemyAccuracy + '%';
        
        // Atualizar estatísticas
        document.getElementById('shotsCount').textContent = currentStats.shotsGiven;
        document.getElementById('hitsCount').textContent = currentStats.hits;
        document.getElementById('missCount').textContent = currentStats.misses;
        document.getElementById('shipsDestroyed').textContent = currentStats.shipsDestroyed;
        
        // Atualizar indicador de turno com destaque maior
        const turnIndicator = document.getElementById('turnIndicator');
        turnIndicator.textContent = `🎯 VEZ DE: ${currentPlayerName.toUpperCase()}!`;
        turnIndicator.classList.add('multiplayer-turn');
    }

    endMultiplayerGame(winner) {
        this.gameState = 'gameOver';
        
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const buttons = document.getElementById('gameOverButtons');
        
        const winnerName = winner === 1 ? this.multiplayerState.player1Name : this.multiplayerState.player2Name;
        const loserName = winner === 1 ? this.multiplayerState.player2Name : this.multiplayerState.player1Name;
        const winnerStats = winner === 1 ? this.multiplayerState.player1Stats : this.multiplayerState.player2Stats;
        
        const accuracy = winnerStats.shotsGiven > 0 
            ? ((winnerStats.hits / winnerStats.shotsGiven) * 100).toFixed(1)
            : 0;
        
        title.textContent = '🏆 VITÓRIA!';
        message.innerHTML = `
            <p style="font-size: 1.8rem; margin-bottom: 1rem;">🎉 ${winnerName} VENCEU!</p>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">${loserName} foi derrotado!</p>
            <p style="margin-top: 1.5rem;">📊 Estatísticas de ${winnerName}:</p>
            <p>🎯 Tiros: ${winnerStats.shotsGiven} | Acertos: ${winnerStats.hits}</p>
            <p>📈 Precisão: ${accuracy}%</p>
            <p>💥 Navios Afundados: ${winnerStats.shipsDestroyed}</p>
        `;
        
        buttons.innerHTML = `
            <button class="btn btn-primary" onclick="game.closeModalAndAction(() => game.startGame('multiplayer'))">🔄 Jogar Novamente</button>
            <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu Principal</button>
        `;
        
        modal.classList.add('active');
    }
    // ========== FIM MULTIPLAYER ==========

    resetGame() {
        this.playerBoard = this.createEmptyBoard();
        this.aiBoard = this.createEmptyBoard();
        this.playerShips = [];
        this.aiShips = [];
        this.currentShipIndex = null;
        this.shipOrientation = 'horizontal';
        this.stats = {
            shotsGiven: 0,
            hits: 0,
            misses: 0,
            shipsDestroyed: 0
        };
        this.aiStats = {
            shotsGiven: 0,
            hits: 0,
            misses: 0
        };
        this.isPlayerTurn = true;
        this.aiTargetQueue = [];
        this.sosRescued = 0;
        this.sosActions = 0;
        this.sosPenalties = 0;
        this.sosClickCooldown = false;
        this.sosObstacles = [];
        this.sosSurvivors = [];
        
        if (this.sosTimerInterval) {
            clearInterval(this.sosTimerInterval);
            this.sosTimerInterval = null;
        }
    }

    startSOSMission(difficulty) {
        this.sosMission = difficulty;
        this.gameState = 'playing';
        this.resetGame();
        
        const missionConfig = {
            easy: {
                boardSize: 8,
                survivors: 3,
                time: 90,
                obstacleCount: 6,
                cooldown: 350
            },
            medium: {
                boardSize: 10,
                survivors: 5,
                time: 120,
                obstacleCount: 12,
                cooldown: 300
            },
            hard: {
                boardSize: 12,
                survivors: 8,
                time: 150,
                obstacleCount: 20,
                cooldown: 250
            }
        };
        
        const config = missionConfig[difficulty];
        this.sosBoardSize = config.boardSize;
        this.sosTimer = config.time;
        this.sosClickCooldownTime = config.cooldown;
        this.sosSurvivorCount = config.survivors;
        
        this.generateSOSBoard(config.survivors, config.obstacleCount);
        this.showScreen('gameScreen');
        
        document.getElementById('enemyBoardSection').style.display = 'none';
        document.getElementById('playerBoardSection').style.display = 'none';
        document.getElementById('sosBoardSection').style.display = 'block';
        document.getElementById('campaignInfo').classList.add('hidden');
        document.getElementById('sosInfo').classList.remove('hidden');
        
        this.renderSOSBoard();
        this.updateSOSInfo();
        this.startSOSTimer();
    }

    generateSOSBoard(survivorCount, obstacleCount) {
        this.sosSurvivors = [];
        this.sosObstacles = [];
        
        const positions = new Set();
        const obstacleTypes = ['shark', 'storm', 'iceberg', 'mine', 'whirlpool'];
        
        for (let i = 0; i < survivorCount; i++) {
            let pos;
            do {
                pos = `${Math.floor(Math.random() * this.sosBoardSize)},${Math.floor(Math.random() * this.sosBoardSize)}`;
            } while (positions.has(pos));
            
            positions.add(pos);
            const [row, col] = pos.split(',').map(Number);
            this.sosSurvivors.push({ row, col, rescued: false });
        }
        
        for (let i = 0; i < obstacleCount; i++) {
            let pos;
            do {
                pos = `${Math.floor(Math.random() * this.sosBoardSize)},${Math.floor(Math.random() * this.sosBoardSize)}`;
            } while (positions.has(pos));
            
            positions.add(pos);
            const [row, col] = pos.split(',').map(Number);
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            this.sosObstacles.push({ row, col, type });
        }
    }

    renderSOSBoard() {
        const board = document.getElementById('sosBoard');
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${this.sosBoardSize + 1}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${this.sosBoardSize + 1}, 1fr)`;

        const emptyCell = document.createElement('div');
        emptyCell.className = 'board-cell header';
        board.appendChild(emptyCell);

        for (let i = 0; i < this.sosBoardSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell header';
            cell.textContent = String.fromCharCode(65 + i);
            board.appendChild(cell);
        }

        for (let row = 0; row < this.sosBoardSize; row++) {
            const rowHeader = document.createElement('div');
            rowHeader.className = 'board-cell header';
            rowHeader.textContent = row + 1;
            board.appendChild(rowHeader);

            for (let col = 0; col < this.sosBoardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleSOSClick(row, col));
                board.appendChild(cell);
            }
        }
    }

    handleSOSClick(row, col) {
        if (this.sosClickCooldown || this.gameState !== 'playing') return;
        
        const cell = document.querySelector(`#sosBoard .board-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell.classList.contains('rescued') || cell.classList.contains('obstacle-hit')) return;
        
        this.sosClickCooldown = true;
        cell.classList.add('cooldown');
        
        setTimeout(() => {
            this.sosClickCooldown = false;
            cell.classList.remove('cooldown');
        }, this.sosClickCooldownTime);
        
        this.sosActions++;
        
        const survivor = this.sosSurvivors.find(s => s.row === row && s.col === col && !s.rescued);
        if (survivor) {
            survivor.rescued = true;
            this.sosRescued++;
            cell.classList.add('rescued');
            // A imagem do sobrevivente é aplicada via CSS
            
            this.playSound('rescue');
            
            if (this.sosRescued === this.sosSurvivorCount) {
                this.endSOSMission(true);
                return;
            }
        } else {
            const obstacle = this.sosObstacles.find(o => o.row === row && o.col === col);
            if (obstacle) {
                this.sosPenalties++;
                this.sosTimer -= 5;
                cell.classList.add('obstacle-hit', obstacle.type);
                
                const sosInfo = document.getElementById('sosInfo');
                sosInfo.classList.add('penalty-flash');
                setTimeout(() => sosInfo.classList.remove('penalty-flash'), 500);
                
                this.playSound('penalty');
            } else {
                cell.classList.add('miss');
                // Textura de água aplicada via CSS
            }
        }
        
        this.updateSOSInfo();
    }

    startSOSTimer() {
        this.sosTimerInterval = setInterval(() => {
            this.sosTimer--;
            this.updateSOSInfo();
            
            if (this.sosTimer <= 0) {
                this.endSOSMission(false);
            }
        }, 1000);
    }

    updateSOSInfo() {
        document.getElementById('sosTimer').textContent = this.sosTimer;
        document.getElementById('sosRescued').textContent = `${this.sosRescued}/${this.sosSurvivorCount}`;
        document.getElementById('sosPenalties').textContent = this.sosPenalties;
        
        const timerElement = document.getElementById('sosTimer');
        timerElement.classList.remove('warning', 'danger');
        
        if (this.sosTimer <= 10) {
            timerElement.classList.add('danger');
        } else if (this.sosTimer <= 30) {
            timerElement.classList.add('warning');
        }
        
        document.getElementById('shotsCount').textContent = this.sosActions;
        document.getElementById('hitsCount').textContent = this.sosRescued;
        document.getElementById('missCount').textContent = this.sosPenalties;
        document.getElementById('shipsDestroyed').textContent = this.sosRescued;
    }

    endSOSMission(success) {
        if (this.sosTimerInterval) {
            clearInterval(this.sosTimerInterval);
            this.sosTimerInterval = null;
        }
        
        this.gameState = 'gameOver';
        
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const buttons = document.getElementById('gameOverButtons');
        
        const missionName = {
            easy: 'FÁCIL',
            medium: 'MÉDIA',
            hard: 'DIFÍCIL'
        }[this.sosMission];
        
        if (success) {
            title.textContent = '🚁 MISSÃO CUMPRIDA!';
            message.innerHTML = `
                <p>Parabéns! Você resgatou todos os náufragos da missão ${missionName}!</p>
                <p style="margin-top: 1.5rem;">📊 Relatório da Missão:</p>
                <p>🚁 Náufragos Resgatados: ${this.sosRescued}/${this.sosSurvivorCount}</p>
                <p>⏱️ Tempo Restante: ${this.sosTimer}s</p>
                <p>🎯 Ações Realizadas: ${this.sosActions}</p>
                <p>⚠️ Obstáculos Atingidos: ${this.sosPenalties}</p>
                ${this.sosPenalties === 0 ? '<p style="color: var(--success-green); margin-top: 1rem;">⭐ RESGATE PERFEITO!</p>' : ''}
            `;
        } else {
            title.textContent = '⏱️ TEMPO ESGOTADO';
            message.innerHTML = `
                <p>O tempo acabou! Você não conseguiu resgatar todos os náufragos.</p>
                <p style="margin-top: 1.5rem;">📊 Relatório da Missão:</p>
                <p>🚁 Náufragos Resgatados: ${this.sosRescued}/${this.sosSurvivorCount}</p>
                <p>🎯 Ações Realizadas: ${this.sosActions}</p>
                <p>⚠️ Obstáculos Atingidos: ${this.sosPenalties}</p>
            `;
        }
        
        buttons.innerHTML = `
            <button class="btn btn-primary" onclick="game.closeModalAndAction(() => game.startSOSMission('${this.sosMission}'))">🔄 Tentar Novamente</button>
            <button class="btn btn-secondary" onclick="game.closeModalAndAction(() => game.startGame('sos'))">📋 Escolher Outra Missão</button>
            <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu Principal</button>
        `;
        
        modal.classList.add('active');
    }

    closeModalAndAction(callback) {
        document.getElementById('gameOverModal').classList.remove('active');
        setTimeout(() => {
            callback();
        }, 100);
    }

    createEmptyBoard() {
        const size = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
        return Array(size).fill(null).map(() => Array(size).fill(0));
    }

    showScreen(screenId) {
        const allScreens = ['menuScreen', 'sosMissionScreen', 'placementScreen', 'gameScreen', 'cartesianMenuScreen'];
        allScreens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const screen = document.getElementById(screenId);
        if (!screen) return;

        if (screenId === 'menuScreen' || screenId === 'sosMissionScreen' || screenId === 'cartesianMenuScreen') {
            screen.style.display = 'flex';
        } else {
            screen.style.display = 'block';
        }
    }

    initPlacementBoard() {
        const board = document.getElementById('placementBoard');
        if (!board) return;

        board.innerHTML = '';
        board.style.display = 'grid';

        if (this.cartesianMode) {
            const gridSize = 11;
            board.style.gridTemplateColumns = `repeat(${gridSize + 1}, 1fr)`;
            board.style.gridTemplateRows    = `repeat(${gridSize + 1}, 1fr)`;

            // Célula de canto X/Y
            const xyCell = document.createElement('div');
            xyCell.className = 'board-cell header cartesian-origin';
            xyCell.innerHTML = '<div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:100%;height:1px;background:white;transform:rotate(-45deg);"></div><span style="position:absolute;top:5%;left:70%;font-size:0.7rem;font-weight:bold;">X</span><span style="position:absolute;bottom:5%;left:10%;font-size:0.7rem;font-weight:bold;">Y</span></div>';
            board.appendChild(xyCell);

            // Cabeçalho eixo X (-5 a 5)
            for (let x = -5; x <= 5; x++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell header';
                cell.textContent = x;
                cell.style.fontWeight = 'bold';
                if (x === 0) { cell.style.color = '#ff6b6b'; }
                board.appendChild(cell);
            }

            // Linhas (Y de 5 a -5)
            for (let y = 5; y >= -5; y--) {
                const rowHeader = document.createElement('div');
                rowHeader.className = 'board-cell header';
                rowHeader.textContent = y;
                rowHeader.style.fontWeight = 'bold';
                if (y === 0) { rowHeader.style.color = '#ff6b6b'; }
                board.appendChild(rowHeader);

                for (let x = -5; x <= 5; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';

                    const arrayRow = 5 - y;
                    const arrayCol = x + 5;

                    cell.dataset.row   = arrayRow.toString();
                    cell.dataset.col   = arrayCol.toString();
                    cell.dataset.cartX = x.toString();
                    cell.dataset.cartY = y.toString();

                    if (x === 0 || y === 0) {
                        cell.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                        cell.style.borderColor      = '#ff6b6b';
                    }

                    cell.addEventListener('mouseenter', () => {
                        this.clearPlacementPreview();
                        this.showPlacementPreview(arrayRow, arrayCol);
                    });
                    cell.addEventListener('mouseleave', () => this.clearPlacementPreview());
                    cell.addEventListener('click', () => this.placeShipAt(arrayRow, arrayCol));

                    board.appendChild(cell);
                }
            }

        } else {
            board.style.gridTemplateColumns = `repeat(${BOARD_SIZE + 1}, 1fr)`;
            board.style.gridTemplateRows    = `repeat(${BOARD_SIZE + 1}, 1fr)`;

            const emptyCell = document.createElement('div');
            emptyCell.className = 'board-cell header';
            board.appendChild(emptyCell);

            for (let i = 0; i < BOARD_SIZE; i++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell header';
                cell.textContent = String.fromCharCode(65 + i);
                board.appendChild(cell);
            }

            for (let row = 0; row < BOARD_SIZE; row++) {
                const rowHeader = document.createElement('div');
                rowHeader.className = 'board-cell header';
                rowHeader.textContent = (row + 1).toString();
                board.appendChild(rowHeader);

                for (let col = 0; col < BOARD_SIZE; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';
                    cell.dataset.row = row.toString();
                    cell.dataset.col = col.toString();

                    cell.addEventListener('mouseenter', () => {
                        this.clearPlacementPreview();
                        this.showPlacementPreview(row, col);
                    });
                    cell.addEventListener('mouseleave', () => this.clearPlacementPreview());
                    cell.addEventListener('click', () => this.placeShipAt(row, col));

                    board.appendChild(cell);
                }
            }
        }
    }

    showPlacementPreview(row, col) {
        if (this.currentShipIndex === null) return;

        const shipsToUse = this.gameMode === 'sos' ? SHIPS.slice(0, 3) : SHIPS;
        const ship = shipsToUse[this.currentShipIndex];

        if (!ship || this.playerShips[this.currentShipIndex]) return;

        const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
        const positions = [];
        let isValid = true;

        for (let i = 0; i < ship.size; i++) {
            const newRow = this.shipOrientation === 'horizontal' ? row : row + i;
            const newCol = this.shipOrientation === 'horizontal' ? col + i : col;

            if (newRow >= boardSize || newCol >= boardSize ||
                newRow < 0 || newCol < 0 ||
                this.playerBoard[newRow][newCol] !== 0) {
                isValid = false;
            }
            positions.push([newRow, newCol]);
        }

        positions.forEach(([r, c]) => {
            if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                const cell = document.querySelector(`#placementBoard .board-cell[data-row="${r}"][data-col="${c}"]`);
                if (cell) {
                    cell.classList.add(isValid ? 'ship-preview' : 'ship-preview-invalid');
                }
            }
        });
    }

    clearPlacementPreview() {
        const board = document.getElementById('placementBoard');
        const previewCells = board.querySelectorAll('.ship-preview, .ship-preview-invalid');
        previewCells.forEach(cell => {
            cell.classList.remove('ship-preview', 'ship-preview-invalid');
        });
    }

    renderShipsToPlace() {
        const container = document.getElementById('shipsToPlace');
        container.innerHTML = '';

        const shipsToRender = this.gameMode === 'sos'
            ? SHIPS.slice(0, 3)
            : SHIPS;

        shipsToRender.forEach((ship, index) => {
            const isSelected = index === this.currentShipIndex;
            const isPlaced   = !!this.playerShips[index];
            const isVertical = isSelected && this.shipOrientation === 'vertical';

            const shipItem = document.createElement('div');
            shipItem.className = 'ship-item';
            if (isSelected) { shipItem.classList.add('selected'); }

            // Prévia do navio — muda direção quando selecionado e vertical
            const preview = document.createElement('div');
            preview.className = 'ship-preview';
            if (isVertical) {
                preview.style.flexDirection = 'column';
                preview.style.display = 'inline-flex';
            }

            for (let i = 0; i < ship.size; i++) {
                const cell = document.createElement('div');
                cell.className = 'ship-preview-cell';
                // Destaque diferente quando selecionado
                if (isSelected) {
                    cell.style.background = 'linear-gradient(135deg, #ffdd44, #ff8844)';
                    cell.style.borderColor = '#ffdd44';
                    cell.style.boxShadow   = '0 0 6px rgba(255,221,68,0.7)';
                }
                preview.appendChild(cell);
            }

            // Nome + indicador de orientação
            const name = document.createElement('div');
            name.className = 'ship-name';
            name.textContent = ship.name;

            if (isSelected) {
                const orientLabel = document.createElement('div');
                orientLabel.style.cssText = 'font-size:1rem;margin-top:4px;color:var(--explosion-yellow);font-weight:700;letter-spacing:1px;';
                orientLabel.textContent = isVertical ? '↕ VERTICAL' : '↔ HORIZONTAL';
                shipItem.appendChild(preview);
                shipItem.appendChild(name);
                shipItem.appendChild(orientLabel);
            } else {
                shipItem.appendChild(preview);
                shipItem.appendChild(name);
            }

            if (!isPlaced) {
                shipItem.addEventListener('click', () => this.selectShip(index));
            } else {
                shipItem.style.opacity  = '0.5';
                shipItem.style.cursor   = 'not-allowed';
                // Marca como posicionado
                const placedLabel = document.createElement('div');
                placedLabel.style.cssText = 'font-size:0.95rem;margin-top:4px;color:var(--success-green);font-weight:700;';
                placedLabel.textContent = '✓ Posicionado';
                shipItem.appendChild(placedLabel);
            }

            container.appendChild(shipItem);
        });
    }

    selectShip(index) {
        if (this.playerShips[index]) return;
        this.currentShipIndex = index;
        this.clearPlacementPreview();
        this.renderShipsToPlace();
    }

    rotateShip() {
        this.shipOrientation = this.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        this.clearPlacementPreview();
        this.renderShipsToPlace();
    }

    placeShipAt(row, col) {
        if (this.currentShipIndex === null) {
            alert('⚠️ Selecione um navio primeiro!');
            return;
        }

        if (this.playerShips[this.currentShipIndex]) {
            alert('⚠️ Este navio já foi posicionado!');
            return;
        }

        const shipsToUse = this.gameMode === 'sos' ? SHIPS.slice(0, 3) : SHIPS;
        const ship = shipsToUse[this.currentShipIndex];
        const positions = [];

        for (let i = 0; i < ship.size; i++) {
            const newRow = this.shipOrientation === 'horizontal' ? row : row + i;
            const newCol = this.shipOrientation === 'horizontal' ? col + i : col;

            const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
            if (newRow >= boardSize || newCol >= boardSize) {
                alert('⚠️ Navio não cabe nesta posição!');
                return;
            }

            if (this.playerBoard[newRow][newCol] !== 0) {
                alert('⚠️ Posição já ocupada!');
                return;
            }

            positions.push([newRow, newCol]);
        }

        positions.forEach(([r, c]) => {
            this.playerBoard[r][c] = this.currentShipIndex + 1;
        });

        this.playerShips[this.currentShipIndex] = {
            ...ship,
            positions,
            hits: 0
        };

        this.currentShipIndex = null;
        this.updatePlacementBoard();
        this.renderShipsToPlace();
        this.checkPlacementComplete();
    }

    updatePlacementBoard() {
        const board = document.getElementById('placementBoard');
        if (!board) return;
        
        const cells = board.querySelectorAll('.board-cell:not(.header)');
        cells.forEach((cell) => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Verifica se os índices são válidos
            if (row >= 0 && col >= 0 && 
                row < this.playerBoard.length && 
                col < this.playerBoard[0].length) {
                
                if (this.playerBoard[row][col] > 0) {
                    cell.classList.add('ship');
                } else {
                    cell.classList.remove('ship');
                }
            }
        });
    }

    checkPlacementComplete() {
        const requiredShips = this.gameMode === 'sos' ? 3 : SHIPS.length;
        const allPlaced = this.playerShips.filter(s => s).length === requiredShips;
        document.getElementById('confirmBtn').disabled = !allPlaced;
    }

    randomPlacement() {
        this.clearPlacement();
        
        const shipsToPlace = this.gameMode === 'sos' ? SHIPS.slice(0, 3) : SHIPS;
        
        shipsToPlace.forEach((ship, index) => {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 100) {
                const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
                const row = Math.floor(Math.random() * boardSize);
                const col = Math.floor(Math.random() * boardSize);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                
                const positions = [];
                let valid = true;

                for (let i = 0; i < ship.size; i++) {
                    const newRow = orientation === 'horizontal' ? row : row + i;
                    const newCol = orientation === 'horizontal' ? col + i : col;

                    const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
                    if (newRow >= boardSize || newCol >= boardSize || this.playerBoard[newRow][newCol] !== 0) {
                        valid = false;
                        break;
                    }

                    positions.push([newRow, newCol]);
                }

                if (valid && positions.length === ship.size) {
                    positions.forEach(([r, c]) => {
                        this.playerBoard[r][c] = index + 1;
                    });

                    this.playerShips[index] = {
                        ...ship,
                        positions,
                        hits: 0
                    };

                    placed = true;
                }

                attempts++;
            }
        });

        this.updatePlacementBoard();
        this.renderShipsToPlace();
        this.checkPlacementComplete();
    }

    clearPlacement() {
        this.playerBoard = this.createEmptyBoard();
        this.playerShips = [];
        this.currentShipIndex = null;
        this.updatePlacementBoard();
        this.renderShipsToPlace();
        this.checkPlacementComplete();
    }

    aiPlaceShips() {
        let shipsToPlace = [...SHIPS];
        
        if (this.gameMode === 'campaign' && this.campaignLevel === 10) {
            shipsToPlace.push(BOSS_SHIP);
            document.getElementById('enemyNameDisplay').textContent = '🛳️ TITANIC BOSS';
        } else {
            document.getElementById('enemyNameDisplay').textContent = '🤖 IA';
        }

        shipsToPlace.forEach((ship, index) => {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 200) {
                const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
                const row = Math.floor(Math.random() * boardSize);
                const col = Math.floor(Math.random() * boardSize);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                
                const positions = [];
                let valid = true;

                for (let i = 0; i < ship.size; i++) {
                    const newRow = orientation === 'horizontal' ? row : row + i;
                    const newCol = orientation === 'horizontal' ? col + i : col;

                    if (newRow >= boardSize || newCol >= boardSize || this.aiBoard[newRow][newCol] !== 0) {
                        valid = false;
                        break;
                    }

                    positions.push([newRow, newCol]);
                }

                // Garantir que todas as posições foram preenchidas
                if (valid && positions.length === ship.size) {
                    positions.forEach(([r, c]) => {
                        this.aiBoard[r][c] = index + 1;
                    });

                    this.aiShips[index] = {
                        ...ship,
                        positions,
                        hits: 0
                    };

                    placed = true;
                }

                attempts++;
            }
        });
    }

    updateModeUI() {
        if (this.gameMode === 'campaign') {
            document.getElementById('campaignInfo').classList.remove('hidden');
            document.getElementById('campaignLevel').textContent = `${this.campaignLevel}/10`;
            document.getElementById('campaignProgress').style.width = `${this.campaignLevel * 10}%`;
            
            let message = 'Missão: Destrua a frota inimiga!';
            if (this.campaignLevel === 10) {
                message = '⚠️ BOSS FINAL: Derrote o lendário TITANIC!';
            } else if (this.campaignLevel >= 7) {
                message = 'Missão Difícil: Cuidado com a IA!';
            }
            document.getElementById('campaignMessage').textContent = message;
        } else {
            document.getElementById('campaignInfo').classList.add('hidden');
        }

        document.getElementById('sosInfo').classList.add('hidden');
    }

    initGameBoards() {
        this.renderBoard('enemyBoard', 'enemy');
        this.renderBoard('playerBoard', 'player');
    }

    renderBoard(boardId, type) {
        const board = document.getElementById(boardId);
        if (!board) return;
        board.innerHTML = '';
        board.style.display = 'grid';

        if (this.cartesianMode) {
            // ── Tabuleiro cartesiano: eixos -5 a 5 ──
            const gridSize = 11;
            board.style.gridTemplateColumns = `repeat(${gridSize + 1}, 1fr)`;
            board.style.gridTemplateRows    = `repeat(${gridSize + 1}, 1fr)`;

            // Célula de canto X/Y
            const xyCell = document.createElement('div');
            xyCell.className = 'board-cell header cartesian-origin';
            xyCell.innerHTML = '<div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:100%;height:1px;background:white;transform:rotate(-45deg);"></div><span style="position:absolute;top:5%;left:70%;font-size:0.7rem;font-weight:bold;">X</span><span style="position:absolute;bottom:5%;left:10%;font-size:0.7rem;font-weight:bold;">Y</span></div>';
            board.appendChild(xyCell);

            // Cabeçalho eixo X (-5 a 5)
            for (let x = -5; x <= 5; x++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell header';
                cell.textContent = x;
                cell.style.fontWeight = 'bold';
                if (x === 0) cell.style.color = '#ff6b6b';
                board.appendChild(cell);
            }

            // Linhas (Y de 5 até -5, de cima para baixo)
            for (let y = 5; y >= -5; y--) {
                const rowHeader = document.createElement('div');
                rowHeader.className = 'board-cell header';
                rowHeader.textContent = y;
                rowHeader.style.fontWeight = 'bold';
                if (y === 0) rowHeader.style.color = '#ff6b6b';
                board.appendChild(rowHeader);

                for (let x = -5; x <= 5; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';

                    const arrayRow = 5 - y;
                    const arrayCol = x + 5;

                    cell.dataset.row   = arrayRow.toString();
                    cell.dataset.col   = arrayCol.toString();
                    cell.dataset.cartX = x.toString();
                    cell.dataset.cartY = y.toString();

                    // Destaca eixos
                    if (x === 0 || y === 0) {
                        cell.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                        cell.style.borderColor      = '#ff6b6b';
                    }

                    if (type === 'enemy') {
                        cell.addEventListener('click', () => this.playerShoot(arrayRow, arrayCol));
                    } else {
                        if (this.playerBoard[arrayRow] && this.playerBoard[arrayRow][arrayCol] > 0) {
                            cell.classList.add('ship');
                        }
                    }

                    board.appendChild(cell);
                }
            }
        } else {
            // ── Tabuleiro normal: A-J / 1-10 ──
            board.style.gridTemplateColumns = `repeat(${BOARD_SIZE + 1}, 1fr)`;
            board.style.gridTemplateRows    = `repeat(${BOARD_SIZE + 1}, 1fr)`;

            const emptyCell = document.createElement('div');
            emptyCell.className = 'board-cell header';
            board.appendChild(emptyCell);

            for (let i = 0; i < BOARD_SIZE; i++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell header';
                cell.textContent = String.fromCharCode(65 + i);
                board.appendChild(cell);
            }

            for (let row = 0; row < BOARD_SIZE; row++) {
                const rowHeader = document.createElement('div');
                rowHeader.className = 'board-cell header';
                rowHeader.textContent = row + 1;
                board.appendChild(rowHeader);

                for (let col = 0; col < BOARD_SIZE; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';
                    cell.dataset.row = row;
                    cell.dataset.col = col;

                    if (type === 'enemy') {
                        cell.addEventListener('click', () => this.playerShoot(row, col));
                    } else {
                        if (this.playerBoard[row][col] > 0) {
                            cell.classList.add('ship');
                        }
                    }

                    board.appendChild(cell);
                }
            }
        }
    }

    playerShoot(row, col) {
        if (!this.isPlayerTurn || this.gameState !== 'playing') return;

        const cell = document.querySelector(`#enemyBoard .board-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell || cell.classList.contains('hit') || cell.classList.contains('miss')) {
            return;
        }

        const isAxisCell = this.cartesianMode && (cell.dataset.cartX === '0' || cell.dataset.cartY === '0');

        this.stats.shotsGiven++;
        
        if (this.aiBoard[row][col] > 0) {
            this.stats.hits++;
            cell.classList.add('hit');
            cell.textContent = '💥';
            if (isAxisCell) {
                cell.style.outline = '2px solid #ff6b6b';
            }
            
            const shipIndex = this.aiBoard[row][col] - 1;
            this.aiShips[shipIndex].hits++;

            if (this.aiShips[shipIndex].hits === this.aiShips[shipIndex].size) {
                // Última parte: afundou — som de explosão
                this.playSound('explosion');
                this.stats.shipsDestroyed++;
                this.markShipAsSunk('enemy', shipIndex);
                
                setTimeout(() => {
                    alert(`🎉 Você afundou ${this.aiShips[shipIndex].name}!`);
                }, 100);

                if (this.stats.shipsDestroyed === this.aiShips.length) {
                    this.endGame(true);
                    return;
                }
            } else {
                // Acertou mas não afundou — som de hit
                this.playSound('hit');
            }
        } else {
            this.stats.misses++;
            this.playSound('miss');
            cell.classList.add('miss');
            if (isAxisCell) {
                cell.style.background = 'rgba(100,100,100,0.7)';
                cell.style.border = '2px solid #ff6b6b';
                cell.textContent = '✕';
                cell.style.color = '#ff6b6b';
            }
            this.isPlayerTurn = false;
            this.updateGameInfo();
            
            setTimeout(() => {
                this.aiTurn();
            }, 1000);
        }

        this.updateGameInfo();
    }

    markShipAsSunk(boardType, shipIndex) {
        const boardId = boardType === 'enemy' ? 'enemyBoard' : 'playerBoard';
        const ships = boardType === 'enemy' ? this.aiShips : this.playerShips;
        
        ships[shipIndex].positions.forEach(([row, col]) => {
            const cell = document.querySelector(`#${boardId} .board-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.remove('hit');
                cell.classList.add('sunk');
                cell.textContent = '☠️';
            }
        });
    }

    aiTurn() {
        if (this.gameState !== 'playing') return;

        setTimeout(() => {
            let row, col;
            
            let difficulty = this.settings.aiDifficulty;
            if (this.gameMode === 'campaign') {
                if (this.campaignLevel >= 8) {
                    difficulty = 'impossible';
                } else if (this.campaignLevel >= 5) {
                    difficulty = 'hard';
                } else if (this.campaignLevel >= 3) {
                    difficulty = 'medium';
                }
            }
            
            if (difficulty === 'easy') {
                [row, col] = this.aiShootRandom();
            } else if (difficulty === 'medium') {
                [row, col] = this.aiShootMedium();
            } else if (difficulty === 'hard') {
                [row, col] = this.aiShootHard();
            } else {
                [row, col] = this.aiShootImpossible();
            }

            this.executeAiShot(row, col);
        }, 500);
    }

    aiShootRandom() {
        const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
        let row, col;
        do {
            row = Math.floor(Math.random() * boardSize);
            col = Math.floor(Math.random() * boardSize);
        } while (this.isCellShot(row, col));
        return [row, col];
    }

    aiShootMedium() {
        if (this.aiTargetQueue.length > 0) {
            const [row, col] = this.aiTargetQueue.shift();
            if (!this.isCellShot(row, col)) {
                return [row, col];
            }
        }
        return this.aiShootRandom();
    }

    aiShootHard() {
        if (this.aiTargetQueue.length > 0) {
            const [row, col] = this.aiTargetQueue.shift();
            if (!this.isCellShot(row, col)) {
                return [row, col];
            }
        }

        const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
        const validCells = [];
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (!this.isCellShot(row, col) && (row + col) % 2 === 0) {
                    validCells.push([row, col]);
                }
            }
        }

        if (validCells.length > 0) {
            return validCells[Math.floor(Math.random() * validCells.length)];
        }

        return this.aiShootRandom();
    }

    aiShootImpossible() {
        const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (!this.isCellShot(row, col) && this.playerBoard[row][col] > 0) {
                    return [row, col];
                }
            }
        }
        return this.aiShootRandom();
    }

    isCellShot(row, col) {
        const cell = document.querySelector(`#playerBoard .board-cell[data-row="${row}"][data-col="${col}"]`);
        return cell && (cell.classList.contains('hit') || cell.classList.contains('miss'));
    }

    executeAiShot(row, col) {
        this.aiStats.shotsGiven++;
        const cell = document.querySelector(`#playerBoard .board-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;

        const isAxisCell = this.cartesianMode && (cell.dataset.cartX === '0' || cell.dataset.cartY === '0');

        if (this.playerBoard[row][col] > 0) {
            this.aiStats.hits++;
            cell.classList.add('hit');
            cell.textContent = '💥';
            if (isAxisCell) {
                cell.style.outline = '2px solid #ff6b6b';
            }

            const shipIndex = this.playerBoard[row][col] - 1;
            this.playerShips[shipIndex].hits++;

            this.addAdjacentCellsToQueue(row, col);

            if (this.playerShips[shipIndex].hits === this.playerShips[shipIndex].size) {
                // Afundou — explosão
                this.playSound('explosion');
                this.markShipAsSunk('player', shipIndex);
                this.aiTargetQueue = [];
                
                setTimeout(() => {
                    alert(`😱 A IA afundou seu ${this.playerShips[shipIndex].name}!`);
                }, 100);

                const shipsLeft = this.playerShips.filter(s => s.hits < s.size).length;
                if (shipsLeft === 0) {
                    this.endGame(false);
                    return;
                }
            } else {
                // Acertou mas não afundou
                this.playSound('hit');
            }

            setTimeout(() => this.aiTurn(), 1000);
        } else {
            this.aiStats.misses++;
            this.playSound('miss');
            cell.classList.add('miss');
            if (isAxisCell) {
                cell.style.background = 'rgba(100,100,100,0.7)';
                cell.style.border = '2px solid #ff6b6b';
                cell.textContent = '✕';
                cell.style.color = '#ff6b6b';
            }
            this.isPlayerTurn = true;
            this.updateGameInfo();
        }
    }

    addAdjacentCellsToQueue(row, col) {
        const boardSize = this.cartesianMode ? this.cartesianBoardSize : BOARD_SIZE;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < boardSize &&
                newCol >= 0 && newCol < boardSize &&
                !this.isCellShot(newRow, newCol)) {
                this.aiTargetQueue.push([newRow, newCol]);
            }
        });
    }

    updateGameInfo() {
        document.getElementById('turnIndicator').textContent = this.isPlayerTurn ? '🎯 Sua Vez!' : '🤖 Turno da IA...';
        
        const playerShipsLeft = this.playerShips.filter(s => s && s.hits < s.size).length;
        const aiShipsLeft = this.aiShips.filter(s => s && s.hits < s.size).length;
        
        document.getElementById('playerShipsLeft').textContent = playerShipsLeft;
        document.getElementById('aiShipsLeft').textContent = aiShipsLeft;
        
        const playerAccuracy = this.stats.shotsGiven > 0 
            ? ((this.stats.hits / this.stats.shotsGiven) * 100).toFixed(1)
            : 0;
        const aiAccuracy = this.aiStats.shotsGiven > 0
            ? ((this.aiStats.hits / this.aiStats.shotsGiven) * 100).toFixed(1)
            : 0;
        
        document.getElementById('playerAccuracy').textContent = playerAccuracy + '%';
        document.getElementById('aiAccuracy').textContent = aiAccuracy + '%';
        
        document.getElementById('shotsCount').textContent = this.stats.shotsGiven;
        document.getElementById('hitsCount').textContent = this.stats.hits;
        document.getElementById('missCount').textContent = this.stats.misses;
        document.getElementById('shipsDestroyed').textContent = this.stats.shipsDestroyed;
    }

    endGame(playerWon, reason = 'normal') {
        this.gameState = 'gameOver';
        this.globalStats.gamesPlayed++;
        this.globalStats.totalShots += this.stats.shotsGiven;
        this.globalStats.totalHits += this.stats.hits;

        const levelBeforeEnd = this.campaignLevel;

        if (playerWon) {
            this.globalStats.gamesWon++;
            
            if (this.gameMode === 'campaign' && this.campaignLevel < 10) {
                this.campaignLevel++;
                this.globalStats.campaignProgress = Math.max(this.globalStats.campaignProgress || 0, this.campaignLevel);
            } else if (this.gameMode === 'campaign' && this.campaignLevel === 10) {
                this.globalStats.campaignProgress = 10;
            }
        } else {
            if (this.gameMode === 'campaign') {
                this.campaignLevel = 1;
            }
        }

        this.saveStats();

        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const buttons = document.getElementById('gameOverButtons');

        const accuracy = this.stats.shotsGiven > 0 
            ? ((this.stats.hits / this.stats.shotsGiven) * 100).toFixed(1)
            : 0;

        if (playerWon) {
            if (this.gameMode === 'campaign' && levelBeforeEnd === 10) {
                title.textContent = '👑 CAMPANHA COMPLETA!';
                message.innerHTML = `
                    <p>Parabéns! Você completou todos os 10 níveis e derrotou o TITANIC!</p>
                    <p style="margin-top: 1rem;">🏆 Você é um verdadeiro ALMIRANTE!</p>
                    <p style="margin-top: 1rem;">📊 Estatísticas da Partida Final:</p>
                    <p>Tiros: ${this.stats.shotsGiven} | Acertos: ${this.stats.hits}</p>
                    <p>Precisão: ${accuracy}%</p>
                `;
                buttons.innerHTML = `
                    <button class="btn btn-primary" onclick="game.handleGameOverAction('replay')">🔄 Jogar Novamente (Nível 1)</button>
                    <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu</button>
                `;
            } else if (this.gameMode === 'campaign') {
                title.textContent = `🏆 NÍVEL ${levelBeforeEnd} COMPLETO!`;
                message.innerHTML = `
                    <p>Parabéns! Avançando para o Nível ${this.campaignLevel}/10</p>
                    <p style="margin-top: 1rem;">📊 Estatísticas:</p>
                    <p>Tiros: ${this.stats.shotsGiven} | Precisão: ${accuracy}%</p>
                `;
                buttons.innerHTML = `
                    <button class="btn btn-primary" onclick="game.handleGameOverAction('next')">➡️ Próximo Nível</button>
                    <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu</button>
                `;
            } else {
                title.textContent = '🏆 VITÓRIA!';
                message.innerHTML = `
                    <p>Parabéns, ${this.settings.playerName}! Você afundou toda a frota inimiga!</p>
                    <p style="margin-top: 1rem;">📊 Estatísticas:</p>
                    <p>Tiros: ${this.stats.shotsGiven} | Acertos: ${this.stats.hits}</p>
                    <p>Precisão: ${accuracy}%</p>
                `;
                buttons.innerHTML = `
                    <button class="btn btn-primary" onclick="game.handleGameOverAction('replay')">🔄 Jogar Novamente</button>
                    <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu Principal</button>
                `;
            }
        } else {
            title.textContent = '💀 DERROTA';
            message.innerHTML = `
                <p>A IA afundou toda a sua frota!</p>
                ${this.gameMode === 'campaign' ? '<p style="color: var(--fire-red); margin-top: 1rem;">⚠️ Voltando ao Nível 1</p>' : ''}
                <p style="margin-top: 1rem;">📊 Estatísticas:</p>
                <p>Tiros: ${this.stats.shotsGiven} | Precisão: ${accuracy}%</p>
            `;
            
            if (this.gameMode === 'campaign') {
                buttons.innerHTML = `
                    <button class="btn btn-primary" onclick="game.handleGameOverAction('retry')">🔄 Tentar Novamente (Nível 1)</button>
                    <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu</button>
                `;
            } else {
                buttons.innerHTML = `
                    <button class="btn btn-primary" onclick="game.handleGameOverAction('replay')">🔄 Jogar Novamente</button>
                    <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu Principal</button>
                `;
            }
        }

        modal.classList.add('active');
    }

    handleGameOverAction(action) {
        document.getElementById('gameOverModal').classList.remove('active');

        if (action === 'next') {
            this.startGame('campaign');
        } else if (action === 'retry') {
            this.campaignLevel = 1;
            this.startGame('campaign');
        } else if (action === 'replay') {
            if (this.gameMode === 'campaign') {
                this.campaignLevel = 1;
            }
            // Se estava no modo cartesiano, relanca com o modo cartesiano correto
            if (this.cartesianMode) {
                const cartMode = this.gameMode === 'multiplayer'
                    ? 'cartesian-multiplayer'
                    : 'cartesian-classic';
                this.startGame(cartMode);
            } else {
                this.startGame(this.gameMode);
            }
        }
    }

    returnToMenu() {
        document.getElementById('gameOverModal').classList.remove('active');
        
        // Restaurar tabuleiro próprio
        const playerBoard = document.getElementById('playerBoardSection');
        playerBoard.classList.remove('multiplayer-hidden');
        playerBoard.style.display = 'block';
        
        this.showScreen('menuScreen');
        this.gameState = 'menu';
        if (this.gameMode === 'campaign') {
            this.campaignLevel = 1;
        }
    }
}



// Inicializar o jogo
const game = new BattleshipGame();