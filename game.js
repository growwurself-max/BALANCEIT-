(function() {
  'use strict';

  // Game state
  const gameState = {
    currentScreen: 'start',
    gameMode: 'single', // 'single' or 'multi'
    currentLevel: 1,
    targetWeight: 0,
    playerWeights: { 1: 0, 2: 0, 5: 0, 10: 0 },
    totalWeight: 0,
    score: 0,
    highScore: parseInt(localStorage.getItem('balanceHighScore') || '0'),
    levelsCompleted: JSON.parse(localStorage.getItem('balanceLevels') || '[]'),
    gameStartTime: 0,
    isAnimating: false,
    hintUsed: false,
    // Multiplayer state
    roomCode: '',
    isHost: false,
    playerId: localStorage.getItem('balanceit_player_id') || ('p_' + Math.random().toString(36).slice(2, 10)),
    playerName: localStorage.getItem('balanceit_player_name') || 'Player',
    roomData: null
  };

  // DOM elements
  const elements = {};

  // Audio system
  const audioSystem = {
    context: null,
    init() {
      if (window.audioContext) {
        this.context = window.audioContext;
      }
    },

    playTone(frequency, duration = 200, type = 'sine') {
      if (!this.context) return;

      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration / 1000);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration / 1000);
    },

    playSound(type) {
      const sounds = {
        place: () => this.playTone(800, 100),
        remove: () => this.playTone(400, 100),
        balance: () => this.playTone(600, 300),
        success: () => {
          this.playTone(800, 200);
          setTimeout(() => this.playTone(1000, 200), 100);
        },
        fail: () => this.playTone(300, 400),
        click: () => this.playTone(600, 50)
      };

      if (sounds[type]) sounds[type]();
    }
  };

  // Physics system
  const physics = {
    beamAngle: 0,
    targetAngle: 0,
    animationDuration: 800,

    calculateAngle(leftWeight, rightWeight) {
      const difference = leftWeight - rightWeight;
      const maxAngle = 25; // degrees
      return Math.max(-maxAngle, Math.min(maxAngle, difference * 2));
    },

    animateBeam(targetAngle, callback) {
      const startAngle = this.beamAngle;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);

        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        this.beamAngle = startAngle + (targetAngle - startAngle) * easeOut;

        elements.scaleBeam.style.transform = `translate(-50%, -50%) rotate(${this.beamAngle}deg)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.beamAngle = targetAngle;
          if (callback) callback();
        }
      };

      requestAnimationFrame(animate);
    },

    updateBalance() {
      const leftWeight = gameState.targetWeight;
      const rightWeight = gameState.totalWeight;
      const targetAngle = this.calculateAngle(leftWeight, rightWeight);

      this.animateBeam(targetAngle);
    }
  };

  // UI Management
  const ui = {
    showScreen(screenId) {
      // Hide all screens
      document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
      });

      // Show target screen
      const targetScreen = document.getElementById(screenId);
      if (targetScreen) {
        targetScreen.classList.add('active');
        gameState.currentScreen = screenId;
      }
    },

    showCountdown(callback) {
      const overlay = elements.countdownOverlay;
      const number = elements.countdownNumber;

      overlay.classList.add('active');
      let count = 3;
      number.textContent = count;
      audioSystem.playSound('click');

      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          number.textContent = count;
          audioSystem.playSound('click');
        } else {
          clearInterval(countdownInterval);
          number.textContent = 'GO!';
          audioSystem.playSound('start');
          setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(callback, 300);
          }, 500);
        }
      }, 1000);
    },

    updateScore() {
      elements.scoreDisplay.textContent = `Score: ${gameState.score}`;
      elements.previewHighScore.textContent = gameState.highScore;
    },

    updateWeightCounts() {
      Object.keys(gameState.playerWeights).forEach(weight => {
        const element = elements[`count${weight}`];
        if (element) {
          element.textContent = gameState.playerWeights[weight];
        }
      });
    },

    updateTotalWeight() {
      elements.currentWeight.textContent = `Total: ${gameState.totalWeight}kg`;
    },

    showFeedback(message, type = '') {
      const feedback = elements.feedbackMessage;
      feedback.textContent = message;
      feedback.className = 'feedback-message';

      if (type) {
        feedback.classList.add(type);
      }
    },

    createWeightBlock(weight) {
      const block = document.createElement('div');
      block.className = `weight-block block-${weight}`;
      block.textContent = `${weight}kg`;
      block.dataset.weight = weight;

      // Add click handler to remove block
      block.addEventListener('click', () => {
        gameLogic.removeWeight(weight);
      });

      return block;
    },

    updateWeightStack() {
      const stack = elements.weightStack;
      stack.innerHTML = '';

      // Create blocks for each weight type
      [10, 5, 2, 1].forEach(weight => {
        for (let i = 0; i < gameState.playerWeights[weight]; i++) {
          const block = this.createWeightBlock(weight);
          stack.appendChild(block);
        }
      });

      // Animate new blocks
      const blocks = stack.querySelectorAll('.weight-block');
      blocks.forEach((block, index) => {
        block.style.animationDelay = `${index * 50}ms`;
      });
    }
  };

  // Game Logic
  const gameLogic = {
    init() {
      this.bindElements();
      this.bindEvents();
      audioSystem.init();
      this.loadProgress();
      ui.updateScore();
      ui.showScreen('startScreen');

      // Initialize multiplayer if available
      if (window.MultiplayerManager && window.MultiplayerManager.initFirebase) {
        window.MultiplayerManager.initFirebase();
      }
    },

    bindElements() {
      // Start screen
      elements.singlePlayerBtn = document.getElementById('singlePlayerBtn');
      elements.multiplayerBtn = document.getElementById('multiplayerBtn');
      elements.tutorialBtn = document.getElementById('tutorialBtn');
      elements.previewHighScore = document.getElementById('previewHighScore');

      // Level selection
      elements.backToStart = document.getElementById('backToStart');
      elements.levelsGrid = document.getElementById('levelsGrid');
      elements.progressFill = document.getElementById('progressFill');
      elements.progressText = document.getElementById('progressText');

      // Multiplayer lobby
      elements.backToStartFromLobby = document.getElementById('backToStartFromLobby');
      elements.playerNameInput = document.getElementById('playerNameInput');
      elements.roomCodeInput = document.getElementById('roomCodeInput');
      elements.createRoomBtn = document.getElementById('createRoomBtn');
      elements.joinRoomBtn = document.getElementById('joinRoomBtn');
      elements.startMultiBtn = document.getElementById('startMultiBtn');
      elements.lobbyStatus = document.getElementById('lobbyStatus');
      elements.lobbyPlayers = document.getElementById('lobbyPlayers');

      // Game screen
      elements.levelBadge = document.getElementById('levelBadge');
      elements.scoreDisplay = document.getElementById('scoreDisplay');
      elements.exitGameBtn = document.getElementById('exitGameBtn');
      elements.scaleBeam = document.getElementById('scaleBeam');
      elements.weightStack = document.getElementById('weightStack');
      elements.feedbackMessage = document.getElementById('feedbackMessage');
      elements.currentWeight = document.getElementById('currentWeight');
      elements.hintBtn = document.getElementById('hintBtn');
      elements.clearBtn = document.getElementById('clearBtn');
      elements.submitBtn = document.getElementById('submitBtn');

      // Weight counters
      elements.count1 = document.getElementById('count-1');
      elements.count2 = document.getElementById('count-2');
      elements.count5 = document.getElementById('count-5');
      elements.count10 = document.getElementById('count-10');

      // Result screen
      elements.resultIcon = document.getElementById('resultIcon');
      elements.resultTitle = document.getElementById('resultTitle');
      elements.resultMessage = document.getElementById('resultMessage');
      elements.resultScore = document.getElementById('resultScore');
      elements.resultTime = document.getElementById('resultTime');
      elements.nextLevelBtn = document.getElementById('nextLevelBtn');
      elements.retryLevelBtn = document.getElementById('retryLevelBtn');
      elements.backToLevelsBtn = document.getElementById('backToLevelsBtn');

      // Overlays
      elements.tutorialOverlay = document.getElementById('tutorialOverlay');
      elements.countdownOverlay = document.getElementById('countdownOverlay');
      elements.countdownNumber = document.getElementById('countdownNumber');
      elements.closeTutorialBtn = document.getElementById('closeTutorialBtn');
    },

    bindEvents() {
      // Start screen
      elements.singlePlayerBtn.addEventListener('click', () => this.startSinglePlayer());
      elements.multiplayerBtn.addEventListener('click', () => this.startMultiplayer());
      elements.tutorialBtn.addEventListener('click', () => this.showTutorial());

      // Level selection
      elements.backToStart.addEventListener('click', () => ui.showScreen('startScreen'));

      // Multiplayer lobby
      elements.backToStartFromLobby.addEventListener('click', () => ui.showScreen('startScreen'));
      elements.createRoomBtn.addEventListener('click', () => this.createRoom());
      elements.joinRoomBtn.addEventListener('click', () => this.joinRoom());
      elements.startMultiBtn.addEventListener('click', () => this.startMultiplayerGame());

      // Game screen
      elements.exitGameBtn.addEventListener('click', () => this.exitGame());
      elements.hintBtn.addEventListener('click', () => this.useHint());
      elements.clearBtn.addEventListener('click', () => this.clearWeights());
      elements.submitBtn.addEventListener('click', () => this.submitAnswer());

      // Weight selection
      document.querySelectorAll('.weight-option').forEach(option => {
        option.addEventListener('click', (e) => {
          const weight = parseInt(e.currentTarget.dataset.weight);
          this.addWeight(weight);
        });
      });

      // Result screen
      elements.nextLevelBtn.addEventListener('click', () => this.nextLevel());
      elements.retryLevelBtn.addEventListener('click', () => this.retryLevel());
      elements.backToLevelsBtn.addEventListener('click', () => ui.showScreen('levelSelect'));

      // Tutorial
      elements.closeTutorialBtn.addEventListener('click', () => this.hideTutorial());
    },

    startGame() {
      this.renderLevelSelect();
      ui.showScreen('levelSelect');
    },

    showTutorial() {
      elements.tutorialOverlay.classList.add('active');
    },

    hideTutorial() {
      elements.tutorialOverlay.classList.remove('active');
    },

    renderLevelSelect() {
      const grid = elements.levelsGrid;
      grid.innerHTML = '';

      const totalLevels = window.Levels ? window.Levels.all.length : 50;

      for (let i = 1; i <= totalLevels; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.textContent = i;

        if (gameState.levelsCompleted.includes(i)) {
          btn.classList.add('completed');
        } else if (i > gameState.levelsCompleted.length + 1) {
          btn.classList.add('locked');
        } else {
          btn.addEventListener('click', () => this.startLevel(i));
        }

        grid.appendChild(btn);
      }

      // Update progress
      const progress = (gameState.levelsCompleted.length / totalLevels) * 100;
      elements.progressFill.style.width = `${progress}%`;
      elements.progressText.textContent = `Level ${gameState.levelsCompleted.length + 1}/${totalLevels}`;
    },

    startLevel(levelId) {
      gameState.currentLevel = levelId;
      gameState.targetWeight = this.getTargetWeight(levelId);
      gameState.playerWeights = { 1: 0, 2: 0, 5: 0, 10: 0 };
      gameState.totalWeight = 0;
      gameState.hintUsed = false;
      gameState.gameStartTime = Date.now();

      // Set initial unbalanced state - beam tilts based on hidden weight
      physics.beamAngle = physics.calculateAngle(gameState.targetWeight, 0);
      elements.scaleBeam.style.transform = `translate(-50%, -50%) rotate(${physics.beamAngle}deg)`;

      ui.updateWeightCounts();
      ui.updateTotalWeight();
      ui.updateWeightStack();
      elements.levelBadge.textContent = `Level ${levelId}`;

      ui.showCountdown(() => {
        ui.showScreen('gameScreen');
        ui.showFeedback('Add weights to balance the scale!');
      });
    },

    getTargetWeight(levelId) {
      if (window.Levels && window.Levels.all) {
        const level = window.Levels.all.find(l => l.id === levelId);
        return level ? level.target : levelId * 2 + 1;
      }
      return levelId * 2 + 1; // Fallback
    },

    addWeight(weight) {
      if (gameState.isAnimating) return;

      gameState.playerWeights[weight]++;
      gameState.totalWeight += weight;

      ui.updateWeightCounts();
      ui.updateTotalWeight();
      ui.updateWeightStack();
      physics.updateBalance();

      audioSystem.playSound('place');
    },

    removeWeight(weight) {
      if (gameState.playerWeights[weight] > 0 && !gameState.isAnimating) {
        gameState.playerWeights[weight]--;
        gameState.totalWeight -= weight;

        ui.updateWeightCounts();
        ui.updateTotalWeight();
        ui.updateWeightStack();
        physics.updateBalance();

        audioSystem.playSound('remove');
      }
    },

    clearWeights() {
      gameState.playerWeights = { 1: 0, 2: 0, 5: 0, 10: 0 };
      gameState.totalWeight = 0;

      ui.updateWeightCounts();
      ui.updateTotalWeight();
      ui.updateWeightStack();
      physics.updateBalance();

      audioSystem.playSound('remove');
    },

    useHint() {
      if (gameState.hintUsed) return;

      gameState.hintUsed = true;
      const range = 3;
      const min = Math.max(1, gameState.targetWeight - range);
      const max = gameState.targetWeight + range;

      ui.showFeedback(`Hint: Target weight is between ${min}kg and ${max}kg`, 'hint');
      audioSystem.playSound('click');
    },

    submitAnswer() {
      if (gameState.isAnimating) return;

      gameState.isAnimating = true;

      if (gameState.gameMode === 'multi') {
        // Multiplayer submission
        if (window.MultiplayerManager) {
          window.MultiplayerManager.submitAnswer(gameState.totalWeight);
          ui.showFeedback('Answer submitted!', 'success');
          audioSystem.playSound('success');
          gameState.isAnimating = false;
        }
      } else {
        // Single player submission
        const isCorrect = gameState.totalWeight === gameState.targetWeight;
        const timeTaken = Math.round((Date.now() - gameState.gameStartTime) / 1000);

        // Animate to final balance
        physics.animateBeam(0, () => {
          setTimeout(() => {
            if (isCorrect) {
              this.handleSuccess(timeTaken);
            } else {
              this.handleFailure();
            }
          }, 500);
        });
      }
    },

    handleSuccess(timeTaken) {
      audioSystem.playSound('success');

      // Calculate score
      let points = 100;
      if (gameState.hintUsed) points -= 20;
      if (timeTaken < 10) points += 20;
      else if (timeTaken > 30) points -= 10;

      gameState.score += points;

      // Mark level as completed
      if (!gameState.levelsCompleted.includes(gameState.currentLevel)) {
        gameState.levelsCompleted.push(gameState.currentLevel);
        this.saveProgress();
      }

      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('balanceHighScore', gameState.highScore.toString());
      }

      // Show result
      elements.resultIcon.textContent = '🎉';
      elements.resultTitle.textContent = 'Perfect Balance!';
      elements.resultMessage.textContent = `The hidden weight was ${gameState.targetWeight}kg`;
      elements.resultScore.textContent = `+${points}`;
      elements.resultTime.textContent = `${timeTaken}s`;

      ui.updateScore();
      ui.showScreen('resultScreen');
      gameState.isAnimating = false;
    },

    handleFailure() {
      audioSystem.playSound('fail');

      const difference = Math.abs(gameState.totalWeight - gameState.targetWeight);
      let message = `Too ${gameState.totalWeight > gameState.targetWeight ? 'heavy' : 'light'}! `;

      if (difference <= 2) {
        message += 'So close!';
      } else {
        message += `Off by ${difference}kg.`;
      }

      ui.showFeedback(message, 'error');

      // Shake animation
      elements.scaleBeam.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        elements.scaleBeam.style.animation = '';
        gameState.isAnimating = false;
      }, 500);
    },

    nextLevel() {
      const nextLevel = gameState.currentLevel + 1;
      if (nextLevel <= (window.Levels ? window.Levels.all.length : 50)) {
        this.startLevel(nextLevel);
      } else {
        ui.showFeedback('Congratulations! You completed all levels!', 'success');
        ui.showScreen('levelSelect');
      }
    },

    retryLevel() {
      this.startLevel(gameState.currentLevel);
    },

    exitGame() {
      ui.showScreen('levelSelect');
    },

    loadProgress() {
      try {
        gameState.levelsCompleted = JSON.parse(localStorage.getItem('balanceLevels') || '[]');
        gameState.highScore = parseInt(localStorage.getItem('balanceHighScore') || '0');
      } catch (e) {
        console.warn('Failed to load progress:', e);
      }
    },

    saveProgress() {
      try {
        localStorage.setItem('balanceLevels', JSON.stringify(gameState.levelsCompleted));
        localStorage.setItem('balanceHighScore', gameState.highScore.toString());
      } catch (e) {
        console.warn('Failed to save progress:', e);
      }
    },

    // Multiplayer methods
    startSinglePlayer() {
      gameState.gameMode = 'single';
      this.renderLevelSelect();
      ui.showScreen('levelSelect');
    },

    startMultiplayer() {
      gameState.gameMode = 'multi';
      ui.showScreen('multiplayerLobby');
    },

    async createRoom() {
      if (!window.MultiplayerManager) {
        ui.showFeedback('Multiplayer not available', 'error');
        return;
      }

      elements.createRoomBtn.disabled = true;
      elements.createRoomBtn.textContent = 'Creating...';

      try {
        const playerName = elements.playerNameInput.value.trim() || 'Host';
        const code = await window.MultiplayerManager.createRoom(playerName);
        elements.roomCodeInput.value = code;
        window.MultiplayerManager.observeRoom(this.updateLobbyUI.bind(this));
        ui.showFeedback(`Room ${code} created!`, 'success');
      } catch (err) {
        ui.showFeedback(err.message || 'Failed to create room', 'error');
      } finally {
        elements.createRoomBtn.disabled = false;
        elements.createRoomBtn.textContent = 'Create Room';
      }
    },

    async joinRoom() {
      if (!window.MultiplayerManager) {
        ui.showFeedback('Multiplayer not available', 'error');
        return;
      }

      elements.joinRoomBtn.disabled = true;
      elements.joinRoomBtn.textContent = 'Joining...';

      try {
        const code = elements.roomCodeInput.value.trim().toUpperCase();
        const playerName = elements.playerNameInput.value.trim() || 'Player';
        const normalizedCode = await window.MultiplayerManager.joinRoom(code, playerName);
        elements.roomCodeInput.value = normalizedCode;
        window.MultiplayerManager.observeRoom(this.updateLobbyUI.bind(this));
        ui.showFeedback(`Joined room ${normalizedCode}!`, 'success');
      } catch (err) {
        ui.showFeedback(err.message || 'Failed to join room', 'error');
      } finally {
        elements.joinRoomBtn.disabled = false;
        elements.joinRoomBtn.textContent = 'Join Room';
      }
    },

    async startMultiplayerGame() {
      if (!window.MultiplayerManager) return;

      elements.startMultiBtn.disabled = true;
      elements.startMultiBtn.textContent = 'Starting...';

      try {
        await window.MultiplayerManager.startMatch();
        ui.showFeedback('Match started!', 'success');
      } catch (err) {
        ui.showFeedback(err.message || 'Failed to start match', 'error');
      } finally {
        elements.startMultiBtn.disabled = false;
        elements.startMultiBtn.textContent = 'Start Match';
      }
    },

    updateLobbyUI(roomData) {
      if (!roomData) {
        elements.lobbyStatus.textContent = 'Not connected';
        elements.lobbyPlayers.textContent = '0/4';
        elements.startMultiBtn.disabled = true;
        return;
      }

      const players = Object.values(roomData.players || {});
      elements.lobbyStatus.textContent = roomData.status || 'Waiting';
      elements.lobbyPlayers.textContent = `${players.length}/4`;

      const isHost = window.MultiplayerManager.state.isHost;
      const isLobby = (roomData.status === 'lobby');
      const canStart = isHost && players.length >= 2 && isLobby;
      elements.startMultiBtn.disabled = !canStart;

      if (roomData.status === 'playing') {
        this.startMultiplayerLevel(roomData);
      }

      if (roomData.status === 'finished') {
        this.showMultiplayerResults(roomData);
      }
    },

    startMultiplayerLevel(roomData) {
      gameState.targetWeight = roomData.currentWeight || 5;
      gameState.playerWeights = { 1: 0, 2: 0, 5: 0, 10: 0 };
      gameState.totalWeight = 0;
      gameState.hintUsed = false;

      // Set initial unbalanced state - beam tilts based on hidden weight
      physics.beamAngle = physics.calculateAngle(gameState.targetWeight, 0);
      elements.scaleBeam.style.transform = `translate(-50%, -50%) rotate(${physics.beamAngle}deg)`;

      ui.updateWeightCounts();
      ui.updateTotalWeight();
      ui.updateWeightStack();
      elements.levelBadge.textContent = 'Multiplayer';

      ui.showCountdown(() => {
        ui.showScreen('gameScreen');
        ui.showFeedback('Balance the scale against other players!');
      });
    },

    showMultiplayerResults(roomData) {
      const players = Object.values(roomData.finalRanking || []).sort((a, b) => b.score - a.score);
      const winner = players[0];

      elements.resultIcon.textContent = '🏆';
      elements.resultTitle.textContent = 'Match Complete!';
      elements.resultMessage.textContent = winner ? `Winner: ${winner.name} (${winner.score} pts)` : 'No winner';
      elements.resultScore.textContent = 'N/A';
      elements.resultTime.textContent = 'N/A';

      ui.showScreen('resultScreen');
    }
  };

  // Initialize game when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => gameLogic.init());
  } else {
    gameLogic.init();
  }

  // Add shake animation to CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translate(-50%, -50%) rotate(${physics.beamAngle}deg); }
      25% { transform: translate(-50%, -50%) rotate(${physics.beamAngle + 2}deg); }
      75% { transform: translate(-50%, -50%) rotate(${physics.beamAngle - 2}deg); }
    }
  `;
  document.head.appendChild(style);

})();
