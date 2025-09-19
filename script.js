class BodyLanguageGame {
    constructor() {
        this.currentTheme = null;
        this.questions = [];
        this.passedQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timeLeft = 0;
        this.timer = null;
        this.isGameRunning = false;
        this.passCount = 0;
        this.passLimit = 3;
        this.questionLimit = 30;
        this.totalQuestions = 30;
        this.currentWordManagementTheme = 'animals';
        this.customQuestions = this.loadCustomQuestions();
        
        this.initializeElements();
        this.bindEvents();
    }

    loadCustomQuestions() {
        try {
            const stored = localStorage.getItem('customQuestions');
            if (!stored) return null;
            
            const customQuestions = JSON.parse(stored);
            if (!customQuestions || typeof customQuestions !== 'object') return null;
            
            // 새로운 테마들과 호환되는지 확인
            const validThemes = ['animals', 'sports', 'jobs', 'movies'];
            const customThemes = Object.keys(customQuestions);
            const hasValidThemes = validThemes.every(theme => customThemes.includes(theme));
            
            if (!hasValidThemes) {
                console.warn('저장된 제시어 데이터가 새로운 테마와 맞지 않습니다. 초기화합니다.');
                localStorage.removeItem('customQuestions');
                return null;
            }
            
            return customQuestions;
        } catch (error) {
            console.error('customQuestions 로드 중 오류:', error);
            localStorage.removeItem('customQuestions');
            return null;
        }
    }

    initializeElements() {
        // UI 요소들
        this.timerSelect = document.getElementById('timer-select');
        this.passLimitInput = document.getElementById('pass-limit-input');
        this.questionLimitInput = document.getElementById('question-limit-input');
        this.startBtn = document.getElementById('start-btn');
        this.backToThemeBtn = document.getElementById('back-to-theme-btn');
        this.manageWordsBtn = document.getElementById('manage-words-btn');
        this.timeDisplay = document.getElementById('time-display');
        this.scoreDisplay = document.getElementById('score');
        this.scoreDisplayGame = document.getElementById('score-display-game');
        this.passDisplayGame = document.getElementById('pass-display-game');
        this.questionCounter = document.getElementById('question-counter');
        
        // 화면 요소들
        this.themeSelection = document.getElementById('theme-selection');
        this.gameScreen = document.getElementById('game-screen');
        this.gameEnd = document.getElementById('game-end');
        this.wordManagement = document.getElementById('word-management');
        
        // 게임 요소들
        this.questionText = document.getElementById('question-text');
        this.correctBtn = document.getElementById('correct-btn');
        this.passBtn = document.getElementById('pass-btn');
        this.stopGameBtn = document.getElementById('stop-game-btn');
        this.finalScore = document.getElementById('final-score');
        this.restartBtn = document.getElementById('restart-btn');
        
        // 테마 버튼들
        this.themeButtons = document.querySelectorAll('.theme-btn');
        
        // 제시어 관리 요소들
        this.wordTabs = document.querySelectorAll('.word-tab');
        this.newWordInput = document.getElementById('new-word-input');
        this.addWordBtn = document.getElementById('add-word-btn');
        this.wordCount = document.getElementById('word-count');
        this.wordList = document.getElementById('word-list');
        this.saveWordsBtn = document.getElementById('save-words-btn');
        this.resetWordsBtn = document.getElementById('reset-words-btn');
        this.closeManagementBtn = document.getElementById('close-management-btn');
        
        // 게임 결과 요소들
        this.gameEndTitle = document.getElementById('game-end-title');
        this.gameStats = document.getElementById('game-stats');
        this.totalQuestionsSpan = document.getElementById('total-questions');
        this.accuracyRate = document.getElementById('accuracy-rate');
        this.remainingTimeSpan = document.getElementById('remaining-time');
        this.remainingTimeStat = document.getElementById('remaining-time-stat');
    }

    bindEvents() {
        // 게임 시작 버튼
        this.startBtn.addEventListener('click', () => this.startGame());
        this.backToThemeBtn.addEventListener('click', () => this.backToThemeSelection());
        this.manageWordsBtn.addEventListener('click', () => this.showWordManagement());
        
        // 테마 선택 버튼들
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.selectTheme(theme);
            });
        });
        
        // 게임 액션 버튼들
        this.correctBtn.addEventListener('click', () => this.handleCorrect());
        this.passBtn.addEventListener('click', () => this.handlePass());
        this.stopGameBtn.addEventListener('click', () => this.stopGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // 제시어 관리 이벤트들
        this.wordTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.switchWordManagementTheme(theme);
            });
        });
        
        this.addWordBtn.addEventListener('click', () => this.addWord());
        this.newWordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addWord();
            }
        });
        
        this.saveWordsBtn.addEventListener('click', () => this.saveCustomWords());
        this.resetWordsBtn.addEventListener('click', () => this.resetWords());
        this.closeManagementBtn.addEventListener('click', () => this.hideWordManagement());
        
        // 전체화면 이벤트 리스너
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
        
        // 아이패드 전용으로 키보드 단축키 제거
    }

    handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement);
        
        if (!isFullscreen) {
            document.body.classList.remove('fullscreen-mode');
            this.removeFullscreenExitButton();
            this.removeFullscreenTimer();
        }
    }

    selectTheme(theme) {
        if (this.isGameRunning) return;
        
        this.currentTheme = theme;
        
        // 테마 선택 표시 업데이트
        this.updateThemeSelection(theme);
        
        // "테마 다시 선택" 버튼 표시
        this.backToThemeBtn.style.display = 'inline-block';
    }

    updateThemeSelection(selectedTheme) {
        // 모든 테마 버튼 스타일 초기화
        this.themeButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 선택된 테마 버튼에 selected 클래스 추가
        const selectedBtn = document.querySelector(`[data-theme="${selectedTheme}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }

    prepareQuestions() {
        // 선택된 테마의 문제들을 가져오기 (커스텀 문제가 있으면 우선 사용)
        const questionSource = this.customQuestions || QUESTIONS;
        
        // 테마가 존재하지 않으면 기본 QUESTIONS 사용하고 customQuestions 초기화
        if (!questionSource[this.currentTheme] || !Array.isArray(questionSource[this.currentTheme])) {
            console.warn(`테마 '${this.currentTheme}'가 존재하지 않습니다. 기본 데이터를 사용합니다.`);
            
            // localStorage의 잘못된 customQuestions 제거
            if (this.customQuestions) {
                localStorage.removeItem('customQuestions');
                this.customQuestions = null;
            }
            
            let allQuestions = [...QUESTIONS[this.currentTheme]];
            
            // 문제 개수 제한 적용
            if (this.questionLimit && allQuestions.length > this.questionLimit) {
                this.questions = allQuestions.slice(0, this.questionLimit);
            } else {
                this.questions = allQuestions;
            }
        } else {
            let allQuestions = [...questionSource[this.currentTheme]];
            
            // 문제 개수 제한 적용 (앞에서부터 순서대로, 랜덤 안함)
            if (this.questionLimit && allQuestions.length > this.questionLimit) {
                this.questions = allQuestions.slice(0, this.questionLimit);
            } else {
                this.questions = allQuestions;
            }
        }
        
        // 실제 준비된 문제 개수로 totalQuestions 업데이트
        this.totalQuestions = this.questions.length;
        
        this.passedQuestions = [];
        this.currentQuestionIndex = 0;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    async startGame() {
        // 이미 게임이 진행 중이면 아무것도 하지 않음
        if (this.isGameRunning) {
            return;
        }

        if (!this.currentTheme) {
            // 테마 선택 버튼들을 깜빡여서 알림
            this.themeButtons.forEach(btn => {
                btn.style.animation = 'pulse 0.5s ease-in-out 3';
            });
            return;
        }

        // 게임 설정 먼저 적용
        this.isGameRunning = true;
        this.timeLeft = parseInt(this.timerSelect.value);
        this.passLimit = parseInt(this.passLimitInput.value);
        this.questionLimit = parseInt(this.questionLimitInput.value);
        this.passCount = 0;
        this.score = 0;

        // 설정이 적용된 후 게임 화면 표시 및 문제 준비
        this.prepareQuestions();
        this.showGameScreen();
        this.displayCurrentQuestion();
        this.updateScore();
        this.updatePassDisplay();
        this.startTimer();
        this.enableGameButtons();
        
        // 버튼 상태 업데이트
        this.startBtn.disabled = true;
        this.startBtn.textContent = '게임 진행 중...';
        this.startBtn.classList.add('disabled');
        this.backToThemeBtn.style.display = 'none';
        
        // 전체화면 모드로 전환
        await this.enterFullscreen();
    }

    startTimer() {
        this.updateTimeDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimeDisplay();
            this.updateFullscreenTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimeDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 시간이 30초 이하일 때 빨간색으로 표시
        if (this.timeLeft <= 30) {
            this.timeDisplay.style.color = '#e53e3e';
            this.timeDisplay.style.fontWeight = 'bold';
        } else {
            this.timeDisplay.style.color = '#2d3748';
            this.timeDisplay.style.fontWeight = '600';
        }
    }

    showGameScreen() {
        this.themeSelection.style.display = 'none';
        this.gameScreen.style.display = 'block';
        this.gameEnd.style.display = 'none';
    }

    showThemeSelection() {
        this.themeSelection.style.display = 'block';
        this.gameScreen.style.display = 'none';
        this.gameEnd.style.display = 'none';
    }

    showGameEnd(gameType = 'normal', remainingTime = null) {
        this.themeSelection.style.display = 'none';
        this.gameScreen.style.display = 'none';
        this.gameEnd.style.display = 'block';
        this.finalScore.textContent = this.score;
        
        // 게임 타입에 따른 제목 설정
        if (gameType === 'allCorrect') {
            this.gameEndTitle.textContent = '🎉 완벽! 모든 문제 정답!';
        } else if (gameType === 'stopped') {
            this.gameEndTitle.textContent = '🛑 게임 중단';
        } else {
            this.gameEndTitle.textContent = '⏰ 시간 종료!';
        }
        
        // 통계 정보 표시
        this.totalQuestionsSpan.textContent = this.totalQuestions;
        this.accuracyRate.textContent = Math.round((this.score / this.totalQuestions) * 100);
        this.gameStats.style.display = 'block';
        
        // 남은 시간 표시 (모든 문제 정답시에만)
        if (remainingTime) {
            this.remainingTimeSpan.textContent = remainingTime;
            this.remainingTimeStat.style.display = 'block';
        } else {
            this.remainingTimeStat.style.display = 'none';
        }
    }

    displayCurrentQuestion() {
        // 일반 문제와 PASS된 문제 합치기
        const allQuestions = [...this.questions, ...this.passedQuestions];
        
        if (this.currentQuestionIndex >= allQuestions.length) {
            // 모든 문제를 다 풀었을 때
            if (this.passedQuestions.length > 0) {
                // PASS된 문제들을 다시 섞어서 반복
                this.shuffleArray(this.passedQuestions);
                this.questions = [...this.passedQuestions];
                this.passedQuestions = [];
                this.currentQuestionIndex = 0;
                
                // 새로운 allQuestions 배열로 업데이트
                const newAllQuestions = [...this.questions, ...this.passedQuestions];
                const currentQuestion = newAllQuestions[this.currentQuestionIndex];
                this.questionText.textContent = currentQuestion;
            } else {
                // 모든 문제를 다 맞췄을 때 - 게임 종료
                this.endGameAllCorrect();
                return;
            }
        } else {
            const currentQuestion = allQuestions[this.currentQuestionIndex];
            this.questionText.textContent = currentQuestion;
        }
        
        // 문제 카드에 새 문제 애니메이션 추가
        const questionCard = document.querySelector('.question-card');
        if (questionCard) {
            questionCard.classList.remove('new-question');
            setTimeout(() => questionCard.classList.add('new-question'), 10);
        }
        
        this.updateQuestionCounter();
    }

    updateQuestionCounter() {
        const totalAnswered = this.currentQuestionIndex + 1;
        this.questionCounter.textContent = `문제 ${totalAnswered}/${this.totalQuestions}`;
    }

    handleCorrect() {
        if (!this.isGameRunning) return;
        
        this.score++;
        this.updateScore();
        
        // 모든 문제를 맞췄는지 확인
        if (this.score >= this.totalQuestions) {
            this.endGameAllCorrect();
            return;
        }
        
        this.nextQuestion();
        
        // 버튼 클릭 피드백
        this.correctBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.correctBtn.style.transform = 'scale(1)';
        }, 100);
    }

    handlePass() {
        if (!this.isGameRunning) return;
        
        // PASS 제한 확인 (이미 버튼이 비활성화되어 있음)
        if (this.passLimit > 0 && this.passCount >= this.passLimit) {
            return;
        }
        
        this.passCount++;
        this.updatePassDisplay();
        
        // 현재 문제를 PASS된 문제 목록에 추가
        const allQuestions = [...this.questions, ...this.passedQuestions];
        const currentQuestion = allQuestions[this.currentQuestionIndex];
        
        // 현재 문제가 원래 문제 목록에 있다면 제거하고 PASS 목록에 추가
        if (this.currentQuestionIndex < this.questions.length) {
            this.questions.splice(this.currentQuestionIndex, 1);
            this.passedQuestions.push(currentQuestion);
        } else {
            // PASS된 문제에서 PASS하면 마지막으로 이동
            const passIndex = this.currentQuestionIndex - this.questions.length;
            const passedQuestion = this.passedQuestions.splice(passIndex, 1)[0];
            this.passedQuestions.push(passedQuestion);
        }
        
        // 인덱스 조정
        if (this.currentQuestionIndex >= this.questions.length + this.passedQuestions.length) {
            this.currentQuestionIndex = 0;
        }
        
        this.displayCurrentQuestion();
        
        // PASS 버튼 비활성화 확인
        if (this.passLimit > 0 && this.passCount >= this.passLimit) {
            this.passBtn.disabled = true;
            this.passBtn.classList.add('disabled');
        }
        
        // 버튼 클릭 피드백
        this.passBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.passBtn.style.transform = 'scale(1)';
        }, 100);
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.displayCurrentQuestion();
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
        if (this.scoreDisplayGame) {
            this.scoreDisplayGame.textContent = `점수: ${this.score}점`;
        }
    }

    updatePassDisplay() {
        if (this.passDisplayGame) {
            if (this.passLimit === 0) {
                this.passDisplayGame.textContent = `PASS: ${this.passCount}회`;
            } else {
                this.passDisplayGame.textContent = `PASS: ${this.passCount}/${this.passLimit}`;
            }
        }
    }

    backToThemeSelection() {
        if (this.isGameRunning) {
            // 게임 진행 중이면 즉시 종료하고 테마 선택으로
            this.isGameRunning = false;
            clearInterval(this.timer);
            this.disableGameButtons();
            this.exitFullscreen();
        }
        
        this.currentTheme = null;
        this.score = 0;
        this.passCount = 0;
        this.questionLimit = 30;
        this.totalQuestions = 30;
        
        // 테마 선택 초기화
        this.themeButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // UI 초기화
        this.updateScore();
        this.updatePassDisplay();
        this.timeDisplay.textContent = '0:00';
        this.startBtn.disabled = false;
        this.startBtn.textContent = '게임 시작';
        this.startBtn.classList.remove('disabled');
        this.backToThemeBtn.style.display = 'none';
        
        this.showThemeSelection();
    }

    enableGameButtons() {
        this.correctBtn.disabled = false;
        this.correctBtn.classList.remove('disabled');
        
        // PASS 버튼은 제한에 따라 활성화/비활성화
        if (this.passLimit === 0 || this.passCount < this.passLimit) {
            this.passBtn.disabled = false;
            this.passBtn.classList.remove('disabled');
        } else {
            this.passBtn.disabled = true;
            this.passBtn.classList.add('disabled');
        }
    }

    disableGameButtons() {
        this.correctBtn.disabled = true;
        this.passBtn.disabled = true;
        this.correctBtn.classList.add('disabled');
        this.passBtn.classList.add('disabled');
    }

    endGame() {
        this.isGameRunning = false;
        clearInterval(this.timer);
        this.disableGameButtons();
        
        // 전체화면 종료
        this.exitFullscreen();
        
        // 게임 종료 화면 표시
        setTimeout(() => {
            this.showGameEnd('timeUp');
        }, 300);
    }

    endGameAllCorrect() {
        this.isGameRunning = false;
        clearInterval(this.timer);
        this.disableGameButtons();
        
        // 전체화면 종료
        this.exitFullscreen();
        
        // 모든 문제 정답 화면 표시
        const remainingTime = this.formatTime(this.timeLeft);
        setTimeout(() => {
            this.showGameEnd('allCorrect', remainingTime);
        }, 300);
    }

    stopGame() {
        if (!this.isGameRunning) return;
        
        this.isGameRunning = false;
        clearInterval(this.timer);
        this.disableGameButtons();
        
        // 전체화면 종료
        this.exitFullscreen();
        
        // 게임 중단 화면 표시
        setTimeout(() => {
            this.showGameEnd('stopped');
        }, 300);
    }

    async enterFullscreen() {
        try {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) { // Safari
                await element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { // IE/Edge
                await element.msRequestFullscreen();
            } else if (element.mozRequestFullScreen) { // Firefox
                await element.mozRequestFullScreen();
            }
            
            // 전체화면 진입 후 UI 조정
            document.body.classList.add('fullscreen-mode');
            this.addFullscreenExitButton();
            this.addFullscreenTimer();
        } catch (error) {
            console.log('전체화면 모드를 지원하지 않는 브라우저입니다.', error);
        }
    }

    exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            }
            
            document.body.classList.remove('fullscreen-mode');
            this.removeFullscreenExitButton();
            this.removeFullscreenTimer();
        } catch (error) {
            console.log('전체화면 종료 중 오류가 발생했습니다.', error);
        }
    }

    addFullscreenExitButton() {
        if (document.getElementById('fullscreen-exit-btn')) return;
        
        const exitBtn = document.createElement('button');
        exitBtn.id = 'fullscreen-exit-btn';
        exitBtn.className = 'fullscreen-exit-btn';
        exitBtn.innerHTML = '✕ 종료';
        exitBtn.onclick = () => this.exitFullscreen();
        
        document.body.appendChild(exitBtn);
    }

    addFullscreenTimer() {
        if (document.getElementById('fullscreen-timer')) return;
        
        const timerDiv = document.createElement('div');
        timerDiv.id = 'fullscreen-timer';
        timerDiv.className = 'fullscreen-timer';
        timerDiv.textContent = this.formatTime(this.timeLeft);
        
        document.body.appendChild(timerDiv);
    }

    updateFullscreenTimer() {
        const timerDiv = document.getElementById('fullscreen-timer');
        if (timerDiv) {
            timerDiv.textContent = this.formatTime(this.timeLeft);
            
            // 30초 이하일 때 경고 스타일 추가
            if (this.timeLeft <= 30) {
                timerDiv.classList.add('warning');
            } else {
                timerDiv.classList.remove('warning');
            }
        }
    }

    removeFullscreenTimer() {
        const timerDiv = document.getElementById('fullscreen-timer');
        if (timerDiv) {
            timerDiv.remove();
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    removeFullscreenExitButton() {
        const exitBtn = document.getElementById('fullscreen-exit-btn');
        if (exitBtn) {
            exitBtn.remove();
        }
    }

    restartGame() {
        // 게임 상태 초기화
        this.currentTheme = null;
        this.questions = [];
        this.passedQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.passCount = 0;
        this.questionLimit = 30;
        this.totalQuestions = 30;
        this.timeLeft = 0;
        this.isGameRunning = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 전체화면 종료
        this.exitFullscreen();
        
        // 테마 선택 초기화
        this.themeButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // UI 초기화
        this.updateScore();
        this.updatePassDisplay();
        this.timeDisplay.textContent = '0:00';
        this.timeDisplay.style.color = '#2d3748';
        this.startBtn.disabled = false;
        this.startBtn.textContent = '게임 시작';
        this.startBtn.classList.remove('disabled');
        this.backToThemeBtn.style.display = 'none';
        
        this.disableGameButtons();
        this.showThemeSelection();
    }

    // 제시어 관리 메서드들
    showWordManagement() {
        this.themeSelection.style.display = 'none';
        this.gameScreen.style.display = 'none';
        this.gameEnd.style.display = 'none';
        this.wordManagement.style.display = 'block';
        
        // 현재 제시어 데이터 로드
        this.loadWordManagementData();
        this.displayWordList();
    }

    hideWordManagement() {
        this.wordManagement.style.display = 'none';
        this.showThemeSelection();
    }

    loadWordManagementData() {
        // localStorage에서 커스텀 제시어를 불러오거나 기본 제시어 사용
        if (this.customQuestions) {
            // customQuestions의 테마들이 유효한지 확인
            const validThemes = ['animals', 'sports', 'jobs', 'movies'];
            const customThemes = Object.keys(this.customQuestions);
            const hasValidThemes = validThemes.every(theme => customThemes.includes(theme));
            
            if (!hasValidThemes) {
                // 유효하지 않은 customQuestions면 제거하고 기본값 사용
                console.warn('저장된 제시어 데이터가 새로운 테마와 맞지 않습니다. 기본값으로 초기화합니다.');
                localStorage.removeItem('customQuestions');
                this.customQuestions = null;
                this.workingQuestions = JSON.parse(JSON.stringify(QUESTIONS));
            } else {
                this.workingQuestions = JSON.parse(JSON.stringify(this.customQuestions));
            }
        } else {
            this.workingQuestions = JSON.parse(JSON.stringify(QUESTIONS));
        }
    }

    switchWordManagementTheme(theme) {
        this.currentWordManagementTheme = theme;
        
        // 탭 스타일 업데이트
        this.wordTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-theme="${theme}"].word-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        this.displayWordList();
    }

    displayWordList() {
        const words = this.workingQuestions[this.currentWordManagementTheme] || [];
        this.wordCount.textContent = `총 ${words.length}개 제시어`;
        
        if (words.length === 0) {
            this.wordList.innerHTML = '<div class="empty-word-list">제시어가 없습니다. 새 제시어를 추가해보세요!</div>';
            return;
        }
        
        this.wordList.innerHTML = words.map(word => `
            <div class="word-item">
                <span class="word-text">${word}</span>
                <button class="word-delete-btn" onclick="game.deleteWord('${word}')">×</button>
            </div>
        `).join('');
    }

    addWord() {
        const newWord = this.newWordInput.value.trim();
        if (!newWord) {
            // 입력창에 포커스하고 깜빡임 효과
            this.newWordInput.focus();
            this.newWordInput.style.borderColor = '#e53e3e';
            setTimeout(() => {
                this.newWordInput.style.borderColor = '#e2e8f0';
            }, 1000);
            return;
        }
        
        // 안전한 배열 접근
        if (!this.workingQuestions[this.currentWordManagementTheme]) {
            this.workingQuestions[this.currentWordManagementTheme] = [];
        }
        
        const words = this.workingQuestions[this.currentWordManagementTheme];
        if (words.includes(newWord)) {
            // 중복시 입력창 빨간색으로 깜빡임
            this.newWordInput.style.borderColor = '#e53e3e';
            this.newWordInput.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                this.newWordInput.style.borderColor = '#e2e8f0';
                this.newWordInput.style.animation = '';
            }, 1000);
            return;
        }
        
        words.push(newWord);
        this.newWordInput.value = '';
        this.displayWordList();
        
        // 성공 피드백 - 추가 버튼 초록색으로 깜빡임
        this.addWordBtn.style.backgroundColor = '#48bb78';
        setTimeout(() => {
            this.addWordBtn.style.backgroundColor = '';
        }, 500);
    }

    deleteWord(word) {
        if (!this.workingQuestions[this.currentWordManagementTheme]) {
            return;
        }
        
        const words = this.workingQuestions[this.currentWordManagementTheme];
        const index = words.indexOf(word);
        if (index > -1) {
            words.splice(index, 1);
            this.displayWordList();
        }
    }

    saveCustomWords() {
        this.customQuestions = this.workingQuestions;
        localStorage.setItem('customQuestions', JSON.stringify(this.customQuestions));
        
        // 저장 버튼 피드백 - 초록색으로 깜빡임
        this.saveWordsBtn.style.backgroundColor = '#48bb78';
        this.saveWordsBtn.textContent = '저장 완료!';
        setTimeout(() => {
            this.saveWordsBtn.style.backgroundColor = '';
            this.saveWordsBtn.textContent = '저장하기';
        }, 1500);
    }

    resetWords() {
        this.customQuestions = null;
        localStorage.removeItem('customQuestions');
        this.loadWordManagementData();
        this.displayWordList();
        
        // 초기화 버튼 피드백 - 주황색으로 깜빡임
        this.resetWordsBtn.style.backgroundColor = '#ed8936';
        this.resetWordsBtn.textContent = '초기화 완료!';
        setTimeout(() => {
            this.resetWordsBtn.style.backgroundColor = '';
            this.resetWordsBtn.textContent = '초기화';
        }, 1500);
    }

}

// 게임 초기화
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BodyLanguageGame();
});
