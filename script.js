const API = ''; 
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

async function loadMetrics() {
  const [logbook, beds, supplies] = await Promise.all([
    api('/api/logbook'),
    api('/api/beds'),
    api('/api/supplies')
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logbook.filter(
    e => e.dateVisited && e.dateVisited.slice(0, 10) === today
  );
  document.getElementById('logbookCount').textContent = todayLogs.length;
  const available = beds.filter(b => b.status === 'Available').length;
  document.getElementById('bedCount').textContent =
    `${available} / ${beds.length}`;

  const lowStock = supplies.filter(s => s.quantity < 10).length;
  document.getElementById('supplyAlert').textContent =
    lowStock > 0 ? `⚠ ${lowStock}` : '✅ OK';
}

async function loadLogbook() {
  const data = await api('/api/logbook');
  const container = document.getElementById('logbookList');
  container.innerHTML = '';

  data.slice(-10).reverse().forEach(entry => {
    const badgeClass =
      entry.status === 'Treated'   ? 'badge-treated' :
      entry.status === 'Referred'  ? 'badge-referred' :
                                     'badge-observing';

    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `
      <span><strong>${entry.patientName}</strong> — ${entry.complaint}
        <em>(${entry.treatment})</em></span>
      <span class="badge ${badgeClass}">${entry.status}</span>
    `;
    container.appendChild(div);
  });
}

document.getElementById('logbookForm').addEventListener('submit', async e => {
  e.preventDefault();
  await api('/api/logbook', {
    method: 'POST',
    body: JSON.stringify({
      patientName: document.getElementById('patientName').value,
      complaint:   document.getElementById('complaint').value,
      treatment:   document.getElementById('treatment').value,
      status:      document.getElementById('logStatus').value
    })
  });
  e.target.reset();
  loadLogbook();
  loadMetrics();
});

async function loadBeds() {
  const data = await api('/api/beds');
  const grid = document.getElementById('bedGrid');
  grid.innerHTML = '';

  data.forEach(bed => {
    const statusClass =
      bed.status === 'Available'   ? 'bed-available' :
      bed.status === 'Occupied'    ? 'bed-occupied' :
                                     'bed-maintenance';
    const icon =
      bed.status === 'Available'   ? '🟢' :
      bed.status === 'Occupied'    ? '🔴' : '🟡';

    const div = document.createElement('div');
    div.className = `bed-tile ${statusClass}`;
    div.innerHTML = `${icon}<br>${bed.bedLabel}<br><small>${bed.status}</small>`;
    grid.appendChild(div);
  });
}

document.getElementById('bedForm').addEventListener('submit', async e => {
  e.preventDefault();
  await api('/api/beds', {
    method: 'POST',
    body: JSON.stringify({
      bedLabel: document.getElementById('bedLabel').value,
      status:   document.getElementById('bedStatus').value
    })
  });
  e.target.reset();
  loadBeds();
  loadMetrics();
});

async function loadSupplies() {
  const data = await api('/api/supplies');
  const table = document.getElementById('supplyTable');
  table.innerHTML = '';

  data.forEach(item => {
    const isLow = item.quantity < 10;
    const div = document.createElement('div');
    div.className = 'supply-row';
    div.innerHTML = `
      <span>${item.itemName} <small>(${item.category})</small></span>
      <span class="${isLow ? 'supply-low' : ''}">
        ${item.quantity} ${isLow ? '⚠ LOW' : '✅'}
      </span>
    `;
    table.appendChild(div);
  });
}

document.getElementById('supplyForm').addEventListener('submit', async e => {
  e.preventDefault();
  await api('/api/supplies', {
    method: 'POST',
    body: JSON.stringify({
      itemName: document.getElementById('itemName').value,
      quantity: Number(document.getElementById('itemQty').value),
      category: document.getElementById('itemCategory').value
    })
  });
  e.target.reset();
  loadSupplies();
  loadMetrics();
});

document.addEventListener('DOMContentLoaded', () => {
  loadMetrics();
  loadLogbook();
  loadBeds();
  loadSupplies();
});