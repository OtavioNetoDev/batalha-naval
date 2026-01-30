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
        this.loadSettings();
        this.loadStats();
        this.applyTheme();
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
        
        if (mode === 'sos') {
            this.showScreen('sosMissionScreen');
            return;
        }
        
        this.gameState = 'placement';
        this.resetGame();
        this.showScreen('placementScreen');
        this.initPlacementBoard();
        this.renderShipsToPlace();
        document.getElementById('playerNameDisplay').textContent = this.settings.playerName;
    }

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
                
                // CORREÇÃO: Não mostrar sobreviventes visualmente (removido completamente)
                
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
            cell.textContent = '🚁';
            
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
                cell.textContent = '💧';
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
        
        // CORREÇÃO: Botões agora fecham o modal corretamente antes de navegar
        buttons.innerHTML = `
            <button class="btn btn-primary" onclick="game.closeModalAndAction(() => game.startSOSMission('${this.sosMission}'))">🔄 Tentar Novamente</button>
            <button class="btn btn-secondary" onclick="game.closeModalAndAction(() => game.startGame('sos'))">📋 Escolher Outra Missão</button>
            <button class="btn btn-secondary" onclick="game.returnToMenu()">🏠 Menu Principal</button>
        `;
        
        modal.classList.add('active');
    }

    // CORREÇÃO: Novo método para fechar modal e executar ação
    closeModalAndAction(callback) {
        document.getElementById('gameOverModal').classList.remove('active');
        // Pequeno delay para garantir que o modal fechou antes de executar a ação
        setTimeout(() => {
            callback();
        }, 100);
    }

    playSound(type) {
        if (!this.settings.soundEnabled) return;
        console.log(`Playing sound: ${type}`);
    }

    createEmptyBoard() {
        return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    }

    showScreen(screenId) {
        document.getElementById('menuScreen').style.display = 'none';
        document.getElementById('sosMissionScreen').style.display = 'none';
        document.getElementById('placementScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById(screenId).style.display = 'block';
    }

    initPlacementBoard() {
        const board = document.getElementById('placementBoard');
        board.innerHTML = '';

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
                cell.addEventListener('click', () => this.placeShipAt(row, col));
                board.appendChild(cell);
            }
        }
    }

    renderShipsToPlace() {
        const container = document.getElementById('shipsToPlace');
        container.innerHTML = '';

        const shipsToRender = this.gameMode === 'sos' 
            ? SHIPS.slice(0, 3)
            : SHIPS;

        shipsToRender.forEach((ship, index) => {
            const shipItem = document.createElement('div');
            shipItem.className = 'ship-item';
            if (index === this.currentShipIndex) {
                shipItem.classList.add('selected');
            }

            const preview = document.createElement('div');
            preview.className = 'ship-preview';
            for (let i = 0; i < ship.size; i++) {
                const cell = document.createElement('div');
                cell.className = 'ship-preview-cell';
                preview.appendChild(cell);
            }

            const name = document.createElement('div');
            name.className = 'ship-name';
            name.textContent = ship.name;

            shipItem.appendChild(preview);
            shipItem.appendChild(name);
            shipItem.addEventListener('click', () => this.selectShip(index));

            if (this.playerShips[index]) {
                shipItem.style.opacity = '0.5';
                shipItem.style.cursor = 'not-allowed';
            }

            container.appendChild(shipItem);
        });
    }

    selectShip(index) {
        if (this.playerShips[index]) return;
        this.currentShipIndex = index;
        this.renderShipsToPlace();
    }

    rotateShip() {
        this.shipOrientation = this.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
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

            if (newRow >= BOARD_SIZE || newCol >= BOARD_SIZE) {
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
        const cells = board.querySelectorAll('.board-cell:not(.header)');

        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.playerBoard[row][col] > 0) {
                cell.classList.add('ship');
            } else {
                cell.classList.remove('ship');
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
                const row = Math.floor(Math.random() * BOARD_SIZE);
                const col = Math.floor(Math.random() * BOARD_SIZE);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                
                const positions = [];
                let valid = true;

                for (let i = 0; i < ship.size; i++) {
                    const newRow = orientation === 'horizontal' ? row : row + i;
                    const newCol = orientation === 'horizontal' ? col + i : col;

                    if (newRow >= BOARD_SIZE || newCol >= BOARD_SIZE || this.playerBoard[newRow][newCol] !== 0) {
                        valid = false;
                        break;
                    }

                    positions.push([newRow, newCol]);
                }

                if (valid) {
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

    confirmPlacement() {
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

            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * BOARD_SIZE);
                const col = Math.floor(Math.random() * BOARD_SIZE);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                
                const positions = [];
                let valid = true;

                for (let i = 0; i < ship.size; i++) {
                    const newRow = orientation === 'horizontal' ? row : row + i;
                    const newCol = orientation === 'horizontal' ? col + i : col;

                    if (newRow >= BOARD_SIZE || newCol >= BOARD_SIZE || this.aiBoard[newRow][newCol] !== 0) {
                        valid = false;
                        break;
                    }

                    positions.push([newRow, newCol]);
                }

                if (valid) {
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
        board.innerHTML = '';

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

    playerShoot(row, col) {
        if (!this.isPlayerTurn || this.gameState !== 'playing') return;

        const cell = document.querySelector(`#enemyBoard .board-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell.classList.contains('hit') || cell.classList.contains('miss')) {
            return;
        }

        this.stats.shotsGiven++;
        
        if (this.aiBoard[row][col] > 0) {
            this.stats.hits++;
            cell.classList.add('hit');
            cell.textContent = '💥';
            
            const shipIndex = this.aiBoard[row][col] - 1;
            this.aiShips[shipIndex].hits++;

            if (this.aiShips[shipIndex].hits === this.aiShips[shipIndex].size) {
                this.stats.shipsDestroyed++;
                this.markShipAsSunk('enemy', shipIndex);
                
                setTimeout(() => {
                    alert(`🎉 Você afundou ${this.aiShips[shipIndex].name}!`);
                }, 100);

                if (this.stats.shipsDestroyed === this.aiShips.length) {
                    this.endGame(true);
                    return;
                }
            }
        } else {
            this.stats.misses++;
            cell.classList.add('miss');
            cell.textContent = '💧';
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
        let row, col;
        do {
            row = Math.floor(Math.random() * BOARD_SIZE);
            col = Math.floor(Math.random() * BOARD_SIZE);
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

        const validCells = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
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
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
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

        if (this.playerBoard[row][col] > 0) {
            this.aiStats.hits++;
            cell.classList.add('hit');
            cell.textContent = '💥';

            const shipIndex = this.playerBoard[row][col] - 1;
            this.playerShips[shipIndex].hits++;

            this.addAdjacentCellsToQueue(row, col);

            if (this.playerShips[shipIndex].hits === this.playerShips[shipIndex].size) {
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
            }

            setTimeout(() => this.aiTurn(), 1000);
        } else {
            this.aiStats.misses++;
            cell.classList.add('miss');
            cell.textContent = '💧';
            this.isPlayerTurn = true;
            this.updateGameInfo();
        }
    }

    addAdjacentCellsToQueue(row, col) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < BOARD_SIZE && 
                newCol >= 0 && newCol < BOARD_SIZE &&
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
            this.startGame(this.gameMode);
        }
    }

    returnToMenu() {
        document.getElementById('gameOverModal').classList.remove('active');
        this.showScreen('menuScreen');
        this.gameState = 'menu';
        if (this.gameMode === 'campaign') {
            this.campaignLevel = 1;
        }
    }
}

// Inicializar o jogo
const game = new BattleshipGame();
