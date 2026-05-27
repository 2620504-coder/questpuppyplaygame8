const DB_KEY = 'puppyLife_save';

let state = {
    hasName: false,
    name: "",
    level: 1,
    exp: 0,
    gold: 0,
    hunger: 100,
    happiness: 100,
    quests: [] // { text: "내용", status: "idle" | "active", startTime: timestamp }
};

// 시바견 진화 이미지 
const puppyImages = {
    baby: "https://cdn-icons-png.flaticon.com/512/5752/5752763.png", // 0~4레벨 (시바견 일러스트)
    teen: "https://png.pngtree.com/recommend-works/png-clipart/20250117/ourlarge/pngtree-a-cute-shiba-inu-png-image_15190087.png", // 5~9레벨 (제공해주신 이미지)
    adult: "https://cdn-icons-png.flaticon.com/512/3504/3504859.png" // 10레벨 이상 (시바견 일러스트)
};

let lifeInterval;
let questTimerInterval;

function initGame() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
        state = JSON.parse(saved);
        
        // 이전 버전(문자열) 퀘스트를 새로운 객체 형태로 마이그레이션
        if (state.quests.length > 0 && typeof state.quests[0] === 'string') {
            state.quests = state.quests.map(q => ({ text: q, status: 'idle', startTime: null }));
        }

        // 게임이 꺼졌을 때 활성화된 퀘스트가 있었다면 강제 중지 처리
        state.quests.forEach(q => {
            if (q.status === 'active') {
                q.status = 'idle';
                q.startTime = null;
            }
        });
        saveState();
    }

    if (!state.hasName) {
        document.getElementById('naming-modal').classList.remove('hidden');
        document.getElementById('main-game').classList.add('hidden');
    } else {
        document.getElementById('naming-modal').classList.add('hidden');
        document.getElementById('main-game').classList.remove('hidden');
        startLifeCycle();
        startQuestTimer();
        updateUI();
        renderQuests();
    }
}

function startGame() {
    const nameInput = document.getElementById('puppy-name-input').value.trim();
    if (nameInput === "") return alert("이름을 입력해주세요!");

    state.hasName = true;
    state.name = nameInput;
    state.hunger = 100;
    state.happiness = 100;
    state.level = 1;
    state.exp = 0;
    state.gold = 0;
    state.quests = [];
    
    saveState();
    document.getElementById('naming-modal').classList.add('hidden');
    document.getElementById('main-game').classList.remove('hidden');
    startLifeCycle();
    startQuestTimer();
    updateUI();
    renderQuests();
}

function startLifeCycle() {
    clearInterval(lifeInterval);
    lifeInterval = setInterval(() => {
        state.hunger = Math.max(0, state.hunger - 1);
        state.happiness = Math.max(0, state.happiness - 1);
        saveState();
        updateUI();
        checkDeath();
    }, 60000);
}

// 퀘스트 진행 시간 표시 타이머
function startQuestTimer() {
    clearInterval(questTimerInterval);
    questTimerInterval = setInterval(() => {
        state.quests.forEach((q, index) => {
            if (q.status === 'active') {
                const elapsed = Math.floor((Date.now() - q.startTime) / 1000);
                const min = Math.floor(elapsed / 60);
                const sec = elapsed % 60;
                const timerEl = document.getElementById(`timer-${index}`);
                if (timerEl) {
                    timerEl.textContent = `진행 중: ${min}분 ${sec}초`;
                }
            }
        });
    }, 1000);
}

function checkDeath() {
    if (state.hunger <= 0 || state.happiness <= 0) {
        clearInterval(lifeInterval);
        clearInterval(questTimerInterval);
        document.getElementById('main-game').classList.add('hidden');
        document.getElementById('death-modal').classList.remove('hidden');
    }
}

function resetGame() {
    localStorage.removeItem(DB_KEY);
    location.reload();
}

// 초기화 버튼 (이중 확인)
function hardResetGame() {
    if (confirm("정말로 이 게임을 초기화 하실 건가요?")) {
        if (confirm("다시 한 번 더 생각해보세요? 정말요?")) {
            resetGame();
        }
    }
}

function updateUI() {
    if (state.hunger <= 0 || state.happiness <= 0) {
        checkDeath();
        return;
    }

    document.getElementById('display-name').textContent = state.name;
    document.getElementById('level').textContent = state.level;
    document.getElementById('exp').textContent = state.exp;
    document.getElementById('gold').textContent = state.gold;
    document.getElementById('hunger').textContent = state.hunger;
    document.getElementById('happiness').textContent = state.happiness;

    const imgEl = document.getElementById('puppy-img');
    if (state.level >= 10) imgEl.src = puppyImages.adult;
    else if (state.level >= 5) imgEl.src = puppyImages.teen;
    else imgEl.src = puppyImages.baby;
}

function gainExp(amount) {
    state.exp += amount;
    while (state.exp >= 100) {
        state.level += 1;
        state.exp -= 100;
        showToast(`🎉 레벨 업! ${state.name}이(가) Lv.${state.level}이 되었습니다!`);
    }
}

function addQuest() {
    const input = document.getElementById('quest-input');
    const text = input.value.trim();
    if (!text) return;

    state.quests.push({ text: text, status: 'idle', startTime: null });
    input.value = '';
    saveState();
    renderQuests();
}

// 퀘스트 상태 관리
function startTask(index) {
    state.quests[index].status = 'active';
    state.quests[index].startTime = Date.now();
    saveState();
    renderQuests();
}

function stopTask(index) {
    state.quests[index].status = 'idle';
    state.quests[index].startTime = null;
    saveState();
    renderQuests();
    showToast("⏸️ 퀘스트를 중지했습니다.");
}

function completeQuest(index) {
    state.quests.splice(index, 1);
    state.gold += 100;
    gainExp(58);
    saveState();
    renderQuests();
    updateUI();
    showToast(`💰 퀘스트 완료! (+58 EXP, +100 G)`);
}

function deleteQuest(index) {
    state.quests.splice(index, 1);
    saveState();
    renderQuests();
}

function renderQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';
    
    state.quests.forEach((q, index) => {
        const li = document.createElement('li');
        
        let controlsHtml = '';
        let timerHtml = '';

        if (q.status === 'idle') {
            controlsHtml = `
                <button class="start-btn" onclick="startTask(${index})">시작</button>
                <button class="del-btn" onclick="deleteQuest(${index})">삭제</button>
            `;
        } else if (q.status === 'active') {
            controlsHtml = `
                <button class="comp-btn" onclick="completeQuest(${index})">완료</button>
                <button class="stop-btn" onclick="stopTask(${index})">중지</button>
            `;
            timerHtml = `<div class="quest-timer" id="timer-${index}">진행 중: 0분 0초</div>`;
        }

        li.innerHTML = `
            <div class="quest-top">
                <span class="quest-title">${q.text}</span>
                <div class="quest-controls">${controlsHtml}</div>
            </div>
            ${timerHtml}
        `;
        list.appendChild(li);
    });
}

function saveState() {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
}

let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

initGame();