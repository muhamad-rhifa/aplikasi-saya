const STORAGE_KEY = 'buku_utang_pelanggan_db';

// State aplikasi
let debts = [];
let activeFilter = 'all';
let searchQuery = '';

// Helper Format Rupiah
function formatRupiah(number) {
  return 'Rp ' + Number(number).toLocaleString('id-ID');
}

// Helper Format Tanggal
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('id-ID', options);
}

// Load & Save ke LocalStorage
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      debts = JSON.parse(raw);
    } catch (e) {
      debts = [];
    }
  } else {
    // Contoh data demo bila baru pertama kali buka
    debts = [
      {
        id: 'debt_1',
        customerName: 'Ibu Fatimah',
        customerPhone: '081234567890',
        totalAmount: 150000,
        paidAmount: 50000,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        desc: 'Minyak 2L, Beras 5Kg, Gula 1Kg',
        payments: [
          {
            id: 'pay_1',
            amount: 50000,
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            note: 'Dicicil tunai'
          }
        ]
      },
      {
        id: 'debt_2',
        customerName: 'Pak Joko',
        customerPhone: '085799988811',
        totalAmount: 75000,
        paidAmount: 0,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueDate: '',
        desc: 'Rokok 2 bungkus dan kopi',
        payments: []
      }
    ];
    saveData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
  render();
}

// Hitung Ringkasan / Summary
function updateSummary() {
  let totalUnpaid = 0;
  let totalPaid = 0;
  let unpaidCount = 0;
  let paidCount = 0;

  debts.forEach(item => {
    const remaining = item.totalAmount - (item.paidAmount || 0);
    if (remaining > 0) {
      totalUnpaid += remaining;
      unpaidCount++;
    } else {
      paidCount++;
    }
    totalPaid += (item.paidAmount || 0);
  });

  document.getElementById('totalUnpaid').innerText = formatRupiah(totalUnpaid);
  document.getElementById('countUnpaid').innerText = `${unpaidCount} Pelanggan`;
  document.getElementById('totalPaid').innerText = formatRupiah(totalPaid);
  document.getElementById('countPaid').innerText = `${paidCount} Catatan Lunas`;
  document.getElementById('totalRecords').innerText = debts.length;
}

// Render Daftar Utang
function render() {
  updateSummary();
  const container = document.getElementById('debtList');
  const emptyState = document.getElementById('emptyState');

  // Filter & Search
  const filtered = debts.filter(item => {
    const remaining = item.totalAmount - (item.paidAmount || 0);
    const isPaid = remaining <= 0;
    let matchStatus = true;
    if (activeFilter === 'unpaid') matchStatus = !isPaid;
    if (activeFilter === 'paid') matchStatus = isPaid;

    const nameMatch = item.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (item.desc || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && (nameMatch || descMatch);
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  // Urutkan: yang belum lunas di atas, kemudian tanggal terbaru
  filtered.sort((a, b) => {
    const remA = a.totalAmount - (a.paidAmount || 0);
    const remB = b.totalAmount - (b.paidAmount || 0);
    const aUnpaid = remA > 0 ? 1 : 0;
    const bUnpaid = remB > 0 ? 1 : 0;
    if (aUnpaid !== bUnpaid) return bUnpaid - aUnpaid;
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = filtered.map(item => {
    const remaining = item.totalAmount - (item.paidAmount || 0);
    const isLunas = remaining <= 0;
    const isPartial = item.paidAmount > 0 && remaining > 0;

    let statusBadge = '';
    if (isLunas) {
      statusBadge = '<span class="status-badge paid"><i class="fa-solid fa-check"></i> Lunas</span>';
    } else if (isPartial) {
      statusBadge = '<span class="status-badge partial"><i class="fa-solid fa-hourglass-half"></i> Cicilan</span>';
    } else {
      statusBadge = '<span class="status-badge unpaid"><i class="fa-solid fa-circle-exclamation"></i> Belum Lunas</span>';
    }

    // WhatsApp Link generator
    let waBtn = '';
    if (item.customerPhone && !isLunas) {
      let phone = item.customerPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.substring(1);
      const textMsg = encodeURIComponent(
        `Halo Kak ${item.customerName},\n\nSekadar mengingatkan terkait catatan belanja kasbon di toko kami:\n- Rincian: ${item.desc || '-'}\n- Sisa Tagihan: ${formatRupiah(remaining)}\n\nMohon untuk diselesaikan jika sudah ada kelonggaran rezeki ya. Terima kasih banyak!`
      );
      waBtn = `<a href="https://wa.me/${phone}?text=${textMsg}" target="_blank" class="btn btn-sm btn-wa" title="Kirim Pengingat WhatsApp"><i class="fa-brands fa-whatsapp"></i> Ingatkan</a>`;
    }

    return `
      <div class="debt-card" data-id="${item.id}">
        <div class="card-top">
          <div class="customer-meta">
            <h4>${escapeHtml(item.customerName)}</h4>
            <span class="phone"><i class="fa-solid fa-phone"></i> ${item.customerPhone || 'Tidak ada no. telp'}</span>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="card-amount-box">
          <div class="amount-item">
            <span class="label">Total Utang</span>
            <span class="value">${formatRupiah(item.totalAmount)}</span>
          </div>
          <div class="amount-item">
            <span class="label">Sudah Dibayar</span>
            <span class="value paid-val">${formatRupiah(item.paidAmount || 0)}</span>
          </div>
          <div class="amount-item">
            <span class="label">Sisa Tagihan</span>
            <span class="value debt">${formatRupiah(remaining)}</span>
          </div>
        </div>

        ${item.desc ? `<div class="card-details"><i class="fa-solid fa-bag-shopping"></i> ${escapeHtml(item.desc)}</div>` : ''}

        <div class="card-dates">
          <span><i class="fa-regular fa-calendar"></i> Catat: ${formatDate(item.date)}</span>
          ${item.dueDate ? `<span><i class="fa-regular fa-calendar-check"></i> Tempo: ${formatDate(item.dueDate)}</span>` : ''}
        </div>

        <div class="card-actions">
          ${!isLunas ? `<button class="btn btn-sm btn-primary" onclick="openPaymentModal('${item.id}')"><i class="fa-solid fa-money-bill-wave"></i> Bayar</button>` : ''}
          <button class="btn btn-sm btn-secondary" onclick="openHistoryModal('${item.id}')"><i class="fa-solid fa-list-check"></i> Riwayat</button>
          ${waBtn}
          <button class="btn btn-sm btn-danger-light" onclick="deleteDebt('${item.id}')" title="Hapus Catatan"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

// Utility Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Event Listeners Filter & Search
document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    activeFilter = e.target.dataset.status;
    render();
  });
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

// Modal Tambah Utang
const debtModal = document.getElementById('debtModal');
const debtForm = document.getElementById('debtForm');
const btnOpenAddModal = document.getElementById('btnOpenAddModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelForm = document.getElementById('btnCancelForm');

btnOpenAddModal.addEventListener('click', () => {
  debtForm.reset();
  document.getElementById('debtDate').value = new Date().toISOString().split('T')[0];
  debtModal.classList.remove('hidden');
});

function hideDebtModal() {
  debtModal.classList.add('hidden');
}

btnCloseModal.addEventListener('click', hideDebtModal);
btnCancelForm.addEventListener('click', hideDebtModal);

debtForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const amount = parseFloat(document.getElementById('debtAmount').value) || 0;
  const date = document.getElementById('debtDate').value;
  const dueDate = document.getElementById('dueDate').value;
  const desc = document.getElementById('debtDesc').value.trim();

  if (!name || amount <= 0 || !date) {
    alert('Harap isi nama, nominal utang, dan tanggal secara valid!');
    return;
  }

  const newRecord = {
    id: 'debt_' + Date.now(),
    customerName: name,
    customerPhone: phone,
    totalAmount: amount,
    paidAmount: 0,
    date: date,
    dueDate: dueDate,
    desc: desc,
    payments: []
  };

  debts.unshift(newRecord);
  saveData();
  hideDebtModal();
});

// Modal Bayar Utang
const payModal = document.getElementById('paymentModal');
const payForm = document.getElementById('payForm');
const btnClosePayModal = document.getElementById('btnClosePayModal');
const btnCancelPay = document.getElementById('btnCancelPay');
const btnPayFull = document.getElementById('btnPayFull');
let selectedDebtForPay = null;

window.openPaymentModal = function(id) {
  const found = debts.find(d => d.id === id);
  if (!found) return;
  selectedDebtForPay = found;
  const remaining = found.totalAmount - (found.paidAmount || 0);

  document.getElementById('payRecordId').value = found.id;
  document.getElementById('payCustomerName').innerText = found.customerName;
  document.getElementById('payRemainingAmount').innerText = formatRupiah(remaining);
  document.getElementById('payAmount').value = remaining;
  document.getElementById('payAmount').max = remaining;
  document.getElementById('payDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('payNote').value = '';

  payModal.classList.remove('hidden');
};

btnPayFull.addEventListener('click', () => {
  if (!selectedDebtForPay) return;
  const rem = selectedDebtForPay.totalAmount - (selectedDebtForPay.paidAmount || 0);
  document.getElementById('payAmount').value = rem;
});

function hidePayModal() {
  payModal.classList.add('hidden');
  selectedDebtForPay = null;
}

btnClosePayModal.addEventListener('click', hidePayModal);
btnCancelPay.addEventListener('click', hidePayModal);

payForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!selectedDebtForPay) return;

  const payAmount = parseFloat(document.getElementById('payAmount').value) || 0;
  const payDate = document.getElementById('payDate').value;
  const payNote = document.getElementById('payNote').value.trim();
  const remaining = selectedDebtForPay.totalAmount - (selectedDebtForPay.paidAmount || 0);

  if (payAmount <= 0) {
    alert('Nominal pembayaran harus lebih dari 0.');
    return;
  }

  if (payAmount > remaining) {
    alert(`Nominal pembayaran melebihi sisa utang (${formatRupiah(remaining)})`);
    return;
  }

  // Tambah pembayaran
  selectedDebtForPay.paidAmount = (selectedDebtForPay.paidAmount || 0) + payAmount;
  if (!selectedDebtForPay.payments) selectedDebtForPay.payments = [];
  
  selectedDebtForPay.payments.push({
    id: 'pay_' + Date.now(),
    amount: payAmount,
    date: payDate,
    note: payNote || 'Pembayaran cicilan/lunas'
  });

  saveData();
  hidePayModal();
});

// Modal Riwayat
const historyModal = document.getElementById('historyModal');
const btnCloseHistModal = document.getElementById('btnCloseHistModal');
const btnCloseHistoryBottom = document.getElementById('btnCloseHistoryBottom');

window.openHistoryModal = function(id) {
  const found = debts.find(d => d.id === id);
  if (!found) return;

  const remaining = found.totalAmount - (found.paidAmount || 0);
  document.getElementById('histTitle').innerText = `Riwayat: ${found.customerName}`;
  document.getElementById('historyDetails').innerHTML = `
    <strong>Total Utang:</strong> ${formatRupiah(found.totalAmount)} | 
    <strong>Terbayar:</strong> <span class="text-success">${formatRupiah(found.paidAmount || 0)}</span> | 
    <strong>Sisa:</strong> <span class="text-danger">${formatRupiah(remaining)}</span>
  `;

  const histContainer = document.getElementById('historyList');
  if (!found.payments || found.payments.length === 0) {
    histContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding: 10px;">Belum ada riwayat pembayaran.</p>';
  } else {
    histContainer.innerHTML = found.payments.slice().reverse().map(p => `
      <div class="history-item">
        <div>
          <strong>+ ${formatRupiah(p.amount)}</strong>
          <div class="hist-desc">${escapeHtml(p.note || '-')}</div>
        </div>
        <span class="hist-date"><i class="fa-regular fa-clock"></i> ${formatDate(p.date)}</span>
      </div>
    `).join('');
  }

  historyModal.classList.remove('hidden');
};

function hideHistoryModal() {
  historyModal.classList.add('hidden');
}

btnCloseHistModal.addEventListener('click', hideHistoryModal);
btnCloseHistoryBottom.addEventListener('click', hideHistoryModal);

// Hapus Catatan
window.deleteDebt = function(id) {
  const found = debts.find(d => d.id === id);
  if (!found) return;
  const confirmDel = confirm(`Hapus catatan utang pelanggan "${found.customerName}"?`);
  if (confirmDel) {
    debts = debts.filter(d => d.id !== id);
    saveData();
  }
};

// Klik di luar modal untuk tutup
window.addEventListener('click', (e) => {
  if (e.target === debtModal) hideDebtModal();
  if (e.target === payModal) hidePayModal();
  if (e.target === historyModal) hideHistoryModal();
});

// Inisialisasi awal
loadData();
render();
