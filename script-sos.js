// ========================================
// BATALHA NAVAL - MODO SOS (RESGATE)
// ========================================

const SOSMode = {
    isActive: false,
    currentMission: null,
    savedCount: 0,
    targetCount: 0,
    timer: null,
    timeLeft: 0,
    isClicking: false,
    
    // Novas variáveis locais para estatísticas
    shotsLocal: 0,
    hitsLocal: 0,

    missions: [
        { id: 1, title: "Operação Águas Rasas", targets: 3, timeLimit: 60, difficulty: "easy" },
        { id: 2, title: "Tempestade no Ártico", targets: 6, timeLimit: 90, difficulty: "medium" },
        { id: 3, title: "Zona de Guerra", targets: 10, timeLimit: 120, difficulty: "hard" }
    ],

    start() {
        this.renderMissionSelection();
        showScreen('selection');
    },

    renderMissionSelection() {
        const container = document.getElementById('selectionContent');
        document.getElementById('selectionTitle').textContent = "Selecione a Missão de Resgate";
        container.innerHTML = '';

        this.missions.forEach(mission => {
            const card = document.createElement('div');
            card.className = 'mission-card';
            card.innerHTML = `
                <h3>${mission.title}</h3>
                <div class="mission-info">
                    <span>👥 Sobreviventes: ${mission.targets}</span>
                    <span>⏱️ Tempo: ${mission.timeLimit}s</span>
                </div>
            `;
            card.onclick = () => this.prepareMission(mission);
            container.appendChild(card);
        });
    },

    prepareMission(mission) {
        this.isActive = true;
        this.currentMission = mission;
        this.targetCount = mission.targets;
        this.savedCount = 0;
        this.timeLeft = mission.timeLimit;
        this.isClicking = false;
        
        // Reseta estatísticas locais
        this.shotsLocal = 0;
        this.hitsLocal = 0;

        document.getElementById('playerBoard').innerHTML = '';
        document.getElementById('enemyBoard').innerHTML = '';
        
        // Esconde o que não é SOS
        const hideList = ['.player-info', '.enemy-info', '.stat-item:not(.precision):not(.hits)'];
        hideList.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = 'none';
        });

        document.body.classList.add('sos-active');
        this.startBattle();
    },

    uupdateStatsUI() {
    // 1. Atualiza Acertos (Sobreviventes encontrados)
    const hitsDisplay = document.getElementById('hitsCount');
    if (hitsDisplay) {
        hitsDisplay.textContent = this.hitsLocal;
    }

    // 2. Calcula e Atualiza Precisão
    const precDisplay = document.getElementById('accuracyPercent');
    if (precDisplay && this.shotsLocal > 0) {
        const precision = Math.round((this.hitsLocal / this.shotsLocal) * 100);
        precDisplay.textContent = precision + "%";
    }
    
    // 3. Atualiza também o contador de salvos na missão (opcional)
    const savedText = document.getElementById('savedCount');
    if (savedText) {
        savedText.textContent = `${this.savedCount} / ${this.targetCount}`;
    }
},

    // Dentro do objeto SOSMode no seu script-sos.js

    handleRescueAttempt(r, c, cell) {
        if (!this.isActive || this.isClicking || cell.classList.contains('hit') || cell.classList.contains('miss') || cell.classList.contains('rescued')) return;

        this.isClicking = true;

        setTimeout(() => {
            const isHit = this.hiddenSurvivors.has(`${r},${c}`);
            
            if (isHit) {
                cell.classList.add('rescued');
                cell.innerHTML = '🧡';
                this.savedCount++;
                
                // ATUALIZA APENAS O QUE FUNCIONA: O OBJETIVO
                const savedText = document.getElementById('savedCount');
                if (savedText) {
                    savedText.textContent = `${this.savedCount} / ${this.targetCount}`;
                }
            } else {
                cell.classList.add('miss');
                cell.innerHTML = '🌊';
            }

            this.checkWinCondition();
            this.isClicking = false;
        }, 300); 
    },

    startBattle() {
        showScreen('battle');
        this.setupBoard();
        this.updateHUD();
        this.startTimer();

        // Limpa estatísticas globais ao iniciar nova missão
        if (window.GameStats) {
            window.GameStats.shots = 0;
            window.GameStats.hits = 0;
        }

        // VÍNCULO DOS BOTÕES (Desistir e Reiniciar)
        const btnDesistir = document.querySelector('button.danger') || document.querySelector('button[onclick*="surrender"]');
        if (btnDesistir) {
            btnDesistir.onclick = (e) => {
                e.preventDefault();
                if(confirm("Deseja abandonar a missão?")) this.endGame(false);
            };
        }

        // Garante que o painel de objetivos e precisão apareçam
        document.getElementById('missionObjectives').style.display = 'block';
        document.getElementById('messageDisplay').textContent = "PROCURE OS SOBREVIVENTES!";
    },

    setupBoard() {
        const boardSize = 10;
        const enemyBoardContainer = document.getElementById('enemyBoard');
        enemyBoardContainer.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        enemyBoardContainer.innerHTML = '';
    
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell water';
                cell.onclick = () => this.handleRescueAttempt(r, c, cell);
                enemyBoardContainer.appendChild(cell);
            }
        }

        this.hiddenSurvivors = new Set();
        while (this.hiddenSurvivors.size < this.targetCount) {
             const pos = `${Math.floor(Math.random() * boardSize)},${Math.floor(Math.random() * boardSize)}`;
            this.hiddenSurvivors.add(pos);
        }
    },

    handleRescueAttempt(r, c, cell) {
        if (!this.isActive || this.isClicking || cell.classList.contains('hit') || 
            cell.classList.contains('miss') || cell.classList.contains('rescued')) return;

        this.isClicking = true;
        const isHit = this.hiddenSurvivors.has(`${r},${c}`);
        
        // Cooldown de 0.6s (Radar processando)
        setTimeout(() => {
            if (isHit) {
                cell.classList.add('rescued');
                cell.innerHTML = '🧡';
                this.savedCount++;
            } else {
                cell.classList.add('miss');
                cell.innerHTML = '🌊';
            }
            
            // ATUALIZAÇÃO DOS DADOS (Acertos e Precisão)
            if (window.GameStats) {
                window.GameStats.shots++; 
                if (isHit) window.GameStats.hits++;
                
                // Atualiza o display de acertos (ID 'hitsVal' ou similar conforme seu HTML)
                const hitsDisplay = document.getElementById('hitsVal') || document.querySelector('.stat-item:nth-child(2) .stat-value');
                if (hitsDisplay) hitsDisplay.textContent = window.GameStats.hits;

                // Atualiza a precisão
                const precDisplay = document.getElementById('precisionVal') || document.querySelector('.stat-item.precision .stat-value');
                if (precDisplay) {
                    const precision = Math.round((window.GameStats.hits / window.GameStats.shots) * 100);
                    precDisplay.textContent = precision + "%";
                }
            }
            
            this.updateHUD();
            this.checkWinCondition();
            this.isClicking = false;
        }, 350); 
    },

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isActive) return;
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) this.endGame(false);
        }, 1000);
    },

    updateTimerDisplay() {
        const timerVal = document.getElementById('timerValue');
        if (!timerVal) return;

        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        // Injeta o tempo
        timerVal.textContent = formattedTime;
        
        // Controle da cor e classe warning
        if (this.timeLeft < 15) {
            timerVal.classList.add('warning');
        } else {
            timerVal.classList.remove('warning');
        }
    },

    updateHUD() {
        const survivorsText = document.getElementById('savedCount'); 
        if (survivorsText) survivorsText.textContent = `${this.savedCount} / ${this.targetCount}`;

        // Barra de progresso (opcional)
        const progress = document.querySelector('.health-fill.enemy');
        if (progress) progress.style.width = `${(this.savedCount / this.targetCount) * 100}%`;
    },

    checkWinCondition() {
        if (this.savedCount >= this.targetCount) this.endGame(true);
    },

    endGame(isWin) {
        this.isActive = false;
        clearInterval(this.timer);
        showScreen('result');
        
        const title = document.getElementById('resultTitle');
        const stats = document.getElementById('resultStats');
        const btnRestartResult = document.querySelector('#resultScreen button.primary');
        if (btnRestartResult) {
            btnRestartResult.onclick = () => {
                this.prepareMission(this.currentMission);
            };
        }
    
        
        if (isWin) {
            title.textContent = "🏆 MISSÃO CUMPRIDA!";
            stats.innerHTML = `<p style="font-size:1.5rem">Incrível! Você salvou todos os ${this.targetCount} náufragos.</p>`;
        } else {
            title.textContent = "⚓ MISSÃO FALHOU";
            stats.innerHTML = `<p style="font-size:1.5rem">O tempo acabou. Alguns botes se perderam...</p>`;
        }
    }
};

window.SOSMode = SOSMode;
