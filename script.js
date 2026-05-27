const DB_KEY = 'puppyLife_save';

// 게임의 초기 상태 정의 (레벨 1부터 시작)
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

// 🌟 레벨별 강아지 외형 진화 이미지 주소 설정
const puppyImages = {
    // 🌟 0~4레벨: 보내주신 Canva의 귀여운 강아지 일러스트로 설정 완료!
    baby: "https://marketplace.canva.com/FP4TE/MAG_BhFP4TE/1/tl/canva-cute-puppy-illustration-MAG_BhFP4TE.png", 
    // 5~9레벨: 이전에 설정한 시바견 이미지
    teen: "https://png.pngtree.com/recommend-works/png-clipart/20250117/ourlarge/pngtree-a-cute-shiba-inu-png-image_15190087.png", 
    // 10레벨 이상: 이전에 설정한 늠름한 시바견 이미지
    adult: "https://cdn-icons-png.flaticon.com/512/3504/3504859.png" 
};

let lifeInterval;
let questTimerInterval;

// 게임 초기화 및 데이터 로드
function initGame() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
        state = JSON.parse(saved);
        
        // 데이터 마이그레이션 (구버전 퀘스트 호환)
        if (state.quests.length > 0 && typeof state.quests[0] === 'string') {
            state.quests = state.quests.map(q => ({ text: q, status: 'idle', startTime: null }));
        }

        // 비정상 종료 시 활성화된 퀘스트 초기화
        state.quests.forEach(q => {
            if (q.status === 'active') {
                q.status = 'idle';
                q.startTime = null;
            }
        });
        saveState();
    }

    // 이름 유무에 따른 모달 제어
    if (!state.hasName) {
        document.getElementById('naming-modal').classList.remove('hidden');
        document.getElementById('main-game').classList.add('hidden');
    } else {
        document.getElementById('naming-modal').classList.add('hidden');
        document.getElementById('main-game').classList.remove('hidden');
        startLifeCycle();   // 배고픔/행복도 감소 시작
        startQuestTimer();   // 퀘스트 시간 측정 시작
        updateUI();          // 화면 갱신
        renderQuests();      // 퀘스트 목록 표시
    }
}

// 입양하기 (이름 설정 후 게임 시작)
function startGame() {
    const nameInput = document.getElementById('puppy-name-input').value.trim();
    if (nameInput === "") return alert("강아지의 이름을 지어주세요!");

    state.hasName = true;
    state.name = nameInput;
    state.hunger = 100;
    state.happiness = 100;
    state.level = 1; // 1레벨부터 시작
    state.exp = 0;
    state.gold = 0;
    state.quests = [];
    
    saveState();
    document.getElementById('naming-modal').classList.add('hidden');
    document.getElementById('main-game').classList.remove('hidden');
    startLifeCycle();
    startQuestTimer();
    updateUI(); // 🌟 이때 puppyImages.baby가 적용됩니다.
    renderQuests();
}

// 1분(60000ms)마다 배고픔, 행복도 1%씩 감소
function startLifeCycle() {
    clearInterval(lifeInterval);
    lifeInterval = setInterval(() => {
        state.hunger = Math.max(0, state.hunger - 1);
        state.happiness = Math.max(0, state.happiness - 1);
        saveState();
        updateUI();
        checkDeath(); // 사망 조건 체크
    }, 60000); // 1분
}

// 퀘스트 진행 시간 실시간 표시 타이머 (1초마다 갱신)
function startQuestTimer() {
    clearInterval(questTimerInterval);
    questTimerInterval = setInterval(() => {
        state.quests.forEach((q, index) => {
            if (q.status === 'active') {
                const elapsed = Math.floor((Date.now() - q.startTime) / 1000); // 경과 시간(초)
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

// 사망 조건 체크 (둘 중 하나라도 0%가 되면 사망)
function checkDeath() {
    if (state.hunger <= 0 || state.happiness <= 0) {
        clearInterval(lifeInterval);
        clearInterval(questTimerInterval);
        document.getElementById('main-game').classList.add('hidden');
        document.getElementById('death-modal').classList.remove('hidden');
    }
}

// 게임 데이터 완전 초기화 (입양 전 상태로)
function resetGame() {
    localStorage.removeItem(DB_KEY);
    location.reload();
}

// 하단 메뉴 초기화 버튼 (이중 확인)
function hardResetGame() {
    if (confirm("정말로 이 게임을 초기화 하실 건가요?\n모든 데이터가 사라집니다.")) {
        if (confirm("다시 한 번 더 생각해보세요?\n정말로 무지개 다리를 보내시겠습니까?")) {
            resetGame();
        }
    }
}

// 화면 UI 종합 업데이트 (레벨별 이미지 진화 포함)
function updateUI() {
    if (state.hunger <= 0 || state.happiness <= 0) {
        checkDeath();
        return;
    }

    // 텍스트 정보 업데이트
    document.getElementById('display-name').textContent = state.name;
    document.getElementById('level').textContent = state.level;
    document.getElementById('exp').textContent = state.exp;
    document.getElementById('gold').textContent = state.gold;
    document.getElementById('hunger').textContent = state.hunger;
    document.getElementById('happiness').textContent = state.happiness;

    // 🌟 레벨에 따른 진화 이미지 처리 로직
    const imgEl = document.getElementById('puppy-img');
    if (state.level >= 10) {
        imgEl.src = puppyImages.adult; // 10레벨 이상
    } else if (state.level >= 5) {
        imgEl.src = puppyImages.teen;  // 5~9레벨
    } else {
        imgEl.src = puppyImages.baby;  // 0~4레벨 (새로 추가한 이미지)
    }
}

// 경험치 획득 및 레벨업 로직
function gainExp(amount) {
    state.exp += amount;
    while (state.exp >= 100) { // 경험치 100당 1레벨업
        state.level += 1;
        state.exp -= 100;
        showToast(`🎉 레벨 업! ${state.name}이(가) Lv.${state.level}이 되었습니다!`);
    }
}

// 새로운 퀘스트 등록
function addQuest() {
    const input = document.getElementById('quest-input');
    const text = input.value.trim();
    if (!text) return;

    // 초기 상태(idle)로 등록
    state.quests.push({ text: text, status: 'idle', startTime: null });
    input.value = '';
    saveState();
    renderQuests();
}

// 퀘스트 '시작' 버튼 클릭
function startTask(index) {
    state.quests[index].status = 'active'; // 상태를 진행 중으로 변경
    state.quests[index].startTime = Date.now(); // 시작 시간 기록
    saveState();
    renderQuests();
}

// 퀘스트 '중지' 버튼 클릭
function stopTask(index) {
    state.quests[index].status = 'idle'; // 상태를 대기로 변경
    state.quests[index].startTime = null; // 시간 기록 삭제
    saveState();
    renderQuests();
    showToast("⏸️ 퀘스트를 중지했습니다.");
}

// 퀘스트 '완료' 버튼 클릭 (보상 지급)
function completeQuest(index) {
    state.quests.splice(index, 1); // 목록에서 삭제
    state.gold += 100; // 100골드 지급
    gainExp(58); // 58 경험치 지급
    saveState();
    renderQuests();
    updateUI();
    showToast(`💰 퀘스트 완료! (+58 EXP, +100 G)`);
}

// 퀘스트 '삭제' (X) 버튼 클릭
function deleteQuest(index) {
    state.quests.splice(index, 1);
    saveState();
    renderQuests();
}

// 퀘스트 리스트 화면에 그리기
function renderQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';
    
    state.quests.forEach((q, index) => {
        const li = document.createElement('li');
        
        let controlsHtml = '';
        let timerHtml = '';

        // 상태(status)에 따라 다른 버튼과 타이머 표시
        if (q.status === 'idle') {
            // 대기 중: 시작, 삭제 버튼
            controlsHtml = `
                <button class="start-btn" onclick="startTask(${index})">시작</button>
                <button class="del-btn" onclick="deleteQuest(${index})">삭제</button>
            `;
        } else if (q.status === 'active') {
            // 진행 중: 완료, 중지 버튼 및 실시간 타이머 영역
            controlsHtml = `
                <button class="comp-btn" onclick="completeQuest(${index})">완료</button>
                <button class="stop-btn" onclick="stopTask(${index})">중지</button>
            `;
            // startQuestTimer 함수가 이 ID를 찾아 시간을 업데이트합니다.
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

// 로컬 스토리지에 데이터 저장
function saveState() {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
}

// 하단 알림창(Toast) 표시
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    // 2초 후 자동으로 사라짐
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// 게임 시작 시 초기화 함수 호출
initGame();