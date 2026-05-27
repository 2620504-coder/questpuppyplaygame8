const DB_KEY = 'puppyLife_save';
let state = {};

function initShop() {
    const saved = localStorage.getItem(DB_KEY);
    if (!saved) {
        alert("게임을 먼저 시작해주세요!");
        location.href = 'index.html';
        return;
    }
    state = JSON.parse(saved);
    updateShopUI();
}

function updateShopUI() {
    document.getElementById('current-gold').textContent = state.gold;
    document.getElementById('current-hunger').textContent = state.hunger;
    document.getElementById('current-happiness').textContent = state.happiness;
}

function buyItem(type, price, amount) {
    if (state.gold < price) {
        showToast("❌ 골드가 부족합니다!");
        return;
    }

    if (type === 'food' && state.hunger >= 100) {
        showToast("🍖 이미 배가 꽉 찼습니다!");
        return;
    }
    if (type === 'supply' && state.happiness >= 100) {
        showToast("💖 이미 기분이 최고조입니다!");
        return;
    }

    state.gold -= price;
    if (type === 'food') {
        state.hunger = Math.min(100, state.hunger + amount);
        showToast(`🍖 냠냠! 배고픔이 ${amount}% 회복되었습니다.`);
    } else if (type === 'supply') {
        state.happiness = Math.min(100, state.happiness + amount);
        showToast(`✨ 야호! 행복도가 ${amount}% 올랐습니다.`);
    }

    localStorage.setItem(DB_KEY, JSON.stringify(state));
    updateShopUI();
}

// 초기화 버튼 로직 추가
function hardResetGame() {
    if (confirm("정말로 이 게임을 초기화 하실 건가요?")) {
        if (confirm("다시 한 번 더 생각해보세요? 정말요?")) {
            localStorage.removeItem(DB_KEY);
            location.href = 'index.html';
        }
    }
}

let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

initShop();