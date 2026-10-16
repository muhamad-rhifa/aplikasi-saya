/* Storage Keys */
const KEYS = {
  TASKS: 'rhifa_tasks',
  NOTES: 'rhifa_notes',
  FINANCE: 'rhifa_finance'
};

/* App State */
let tasks = JSON.parse(localStorage.getItem(KEYS.TASKS)) || [];
let notes = JSON.parse(localStorage.getItem(KEYS.NOTES)) || [];
let transactions = JSON.parse(localStorage.getItem(KEYS.FINANCE)) || [];

/* Initialize */
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  renderTasks();
  renderNotes();
  renderFinance();
});

/* Clock Logic */
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  document.getElementById('clock-time').textContent = timeStr;
  document.getElementById('clock-date').textContent = dateStr;
}

/* Navigation Tabs */
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  const selectedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabName));
  if (selectedBtn) selectedBtn.classList.add('active');
  
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) activeTab.classList.add('active');
}

/* --- TASK MODULE --- */
function renderTasks() {
  const listEl = document.getElementById('task-list');
  const counterEl = document.getElementById('task-counter');
  listEl.innerHTML = '';

  if (tasks.length === 0) {
    listEl.innerHTML = '<div class="empty-state">Belum ada tugas. Tambahkan di atas!</div>';
    counterEl.textContent = '0/0';
    return;
  }

  const completedCount = tasks.filter(t => t.completed).length;
  counterEl.textContent = `${completedCount}/${tasks.length}`;

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
      <span class="task-text" onclick="toggleTask(${index})">${escapeHtml(task.text)}</span>
      <button class="btn-icon" onclick="deleteTask(${index})"><i class="fa-solid fa-trash"></i></button>
    `;
    listEl.appendChild(li);
  });
}

function addTask(e) {
  e.preventDefault();
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ text, completed: false });
  saveData(KEYS.TASKS, tasks);
  renderTasks();
  input.value = '';
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  saveData(KEYS.TASKS, tasks);
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveData(KEYS.TASKS, tasks);
  renderTasks();
}

/* --- NOTES MODULE --- */
function renderNotes() {
  const gridEl = document.getElementById('notes-grid');
  gridEl.innerHTML = '';

  if (notes.length === 0) {
    gridEl.innerHTML = '<div class="empty-state">Belum ada catatan tersimpan.</div>';
    return;
  }

  notes.forEach((note, index) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <h4>${escapeHtml(note.title)}</h4>
      <p>${escapeHtml(note.body)}</p>
      <button class="btn-icon" onclick="deleteNote(${index})"><i class="fa-solid fa-trash"></i></button>
    `;
    gridEl.appendChild(card);
  });
}

function addNote(e) {
  e.preventDefault();
  const titleInput = document.getElementById('note-title');
  const bodyInput = document.getElementById('note-body');

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title || !body) return;

  notes.unshift({ title, body, date: new Date().toISOString() });
  saveData(KEYS.NOTES, notes);
  renderNotes();

  titleInput.value = '';
  bodyInput.value = '';
}

function deleteNote(index) {
  notes.splice(index, 1);
  saveData(KEYS.NOTES, notes);
  renderNotes();
}

/* --- FINANCE MODULE --- */
function renderFinance() {
  const listEl = document.getElementById('finance-list');
  const balanceEl = document.getElementById('finance-balance');
  const incomeEl = document.getElementById('finance-income');
  const expenseEl = document.getElementById('finance-expense');

  listEl.innerHTML = '';

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((item) => {
    if (item.type === 'income') totalIncome += item.amount;
    else totalExpense += item.amount;
  });

  const balance = totalIncome - totalExpense;

  balanceEl.textContent = formatRp(balance);
  incomeEl.textContent = formatRp(totalIncome);
  expenseEl.textContent = formatRp(totalExpense);

  if (transactions.length === 0) {
    listEl.innerHTML = '<div class="empty-state">Belum ada catatan transaksi.</div>';
    return;
  }

  transactions.forEach((item, index) => {
    const li = document.createElement('li');
    const isInc = item.type === 'income';
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(item.desc)}</strong>
        <div style="font-size:11px; color:#7f8c8d;">${item.date}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-weight:bold; color:${isInc ? '#2ecc71' : '#e74c3c'}">
          ${isInc ? '+' : '-'} ${formatRp(item.amount)}
        </span>
        <button class="btn-icon" onclick="deleteTransaction(${index})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    listEl.appendChild(li);
  });
}

function addTransaction(e) {
  e.preventDefault();
  const type = document.getElementById('trans-type').value;
  const descInput = document.getElementById('trans-desc');
  const amountInput = document.getElementById('trans-amount');

  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!desc || isNaN(amount) || amount <= 0) return;

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  transactions.unshift({ type, desc, amount, date: dateStr });
  saveData(KEYS.FINANCE, transactions);
  renderFinance();

  descInput.value = '';
  amountInput.value = '';
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveData(KEYS.FINANCE, transactions);
  renderFinance();
}

/* Helpers */
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatRp(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}