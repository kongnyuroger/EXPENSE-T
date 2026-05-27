let transactions = loadTransactions();
let currentFilter = 'all';
let chart = null;

// ── Persistence ──────────────────────────────────────────────────────────────

function loadTransactions() {
  const data = localStorage.getItem('transactions');
  return data ? JSON.parse(data) : [];
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ── State mutations ───────────────────────────────────────────────────────────

function addTransaction(e) {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;

  if (!description || isNaN(amount) || !date) return;

  transactions.push({ id: Date.now(), description, amount, date });
  saveTransactions();
  updateUI();

  e.target.reset();
  document.getElementById('date').value = todayISO();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  updateUI();
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function getFiltered() {
  if (currentFilter === 'income')  return transactions.filter(t => t.amount > 0);
  if (currentFilter === 'expense') return transactions.filter(t => t.amount < 0);
  return transactions;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function updateBalance() {
  const income   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const balance  = income + expenses;

  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = formatCurrency(balance);
  balanceEl.classList.toggle('negative', balance < 0);

  document.getElementById('income-total').textContent  = formatCurrency(income);
  document.getElementById('expense-total').textContent = formatCurrency(Math.abs(expenses));
}

function renderList() {
  const list = document.getElementById('transaction-list');
  const filtered = getFiltered();
  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<li class="empty-msg">No transactions to show.</li>';
    return;
  }

  // Sort newest date first
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(t => {
    const isIncome = t.amount > 0;
    const li = document.createElement('li');
    li.className = isIncome ? 'income' : 'expense';
    li.innerHTML = `
      <div class="tx-info">
        <div class="tx-desc">${escapeHtml(t.description)}</div>
        <div class="tx-date">${formatDate(t.date)}</div>
      </div>
      <span class="tx-amount">${isIncome ? '+' : '−'}${formatCurrency(Math.abs(t.amount))}</span>
      <button class="delete-btn" data-id="${t.id}" title="Delete">✕</button>
    `;
    list.appendChild(li);
  });
}

function renderChart() {
  const income   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const canvas   = document.getElementById('myChart');
  const emptyMsg = document.getElementById('chart-empty');
  const hasData  = income > 0 || expenses > 0;

  canvas.style.display   = hasData ? 'block' : 'none';
  emptyMsg.style.display = hasData ? 'none'  : 'block';

  if (!hasData) {
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  if (chart) chart.destroy();

  chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [income, expenses],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderWidth: 0,
      }],
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 13 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formatCurrency(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

function updateUI() {
  updateBalance();
  renderList();
  renderChart();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  return 'CFA ' + Math.abs(value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.getElementById('transaction-form').addEventListener('submit', addTransaction);

document.getElementById('transaction-list').addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (btn) deleteTransaction(Number(btn.dataset.id));
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    updateUI();
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').value = todayISO();
  updateUI();
});
