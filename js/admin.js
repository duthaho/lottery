// admin.js - Admin panel controls

import { i18n } from './i18n.js';
import { storage } from './storage.js';

// CSV parsing utilities
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    data.push(row);
  }

  return data;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current);

  return values;
}

function escapeCSVField(field) {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function generateCSV(data, columns) {
  const header = columns.map(col => escapeCSVField(col.label || col.key)).join(',');
  const rows = data.map(row =>
    columns.map(col => escapeCSVField(row[col.key])).join(',')
  );
  return header + '\n' + rows.join('\n');
}

export class AdminPanel {
  constructor(drawManager, originalParticipants, originalPrizes) {
    this.drawManager = drawManager;
    this.originalParticipants = [...originalParticipants];
    this.originalPrizes = [...originalPrizes];

    this.modal = document.getElementById('adminModal');
    this.undoBtn = document.getElementById('undoBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.importParticipantsInput = document.getElementById('importParticipants');
    this.importPrizesInput = document.getElementById('importPrizes');

    this.onDataImport = null;

    this.bindEvents();
  }

  setOnDataImport(callback) {
    this.onDataImport = callback;
  }

  bindEvents() {
    // Undo
    if (this.undoBtn) {
      this.undoBtn.addEventListener('click', () => {
        const undone = this.drawManager.undoLastDraw();
        if (undone) {
          console.log('Undid draw for:', undone.name);
        }
      });
    }

    // Reset
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        if (confirm(i18n.t('confirmReset'))) {
          this.drawManager.reset(this.originalParticipants);
          storage.clear();
          console.log('Reset complete');
          // Close modal after reset
          if (this.modal) {
            this.modal.hidden = true;
          }
        }
      });
    }

    // Export
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        this.exportResults();
      });
    }

    // Import Participants
    if (this.importParticipantsInput) {
      this.importParticipantsInput.addEventListener('change', (e) => {
        this.handleImport(e, 'participants');
      });
    }

    // Import Prizes
    if (this.importPrizesInput) {
      this.importPrizesInput.addEventListener('change', (e) => {
        this.handleImport(e, 'prizes');
      });
    }
  }

  handleImport(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    // Security: Limit file size to 1MB
    const MAX_FILE_SIZE = 1024 * 1024; // 1MB
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 1MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Parse CSV format
        const rawData = parseCSV(e.target.result);

        if (!Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('No data found in CSV file. Make sure there is a header row and at least one data row.');
        }

        // Security: Limit array size
        const MAX_ITEMS = 10000;
        if (rawData.length > MAX_ITEMS) {
          throw new Error(`Too many items. Maximum is ${MAX_ITEMS}`);
        }

        let data;
        if (type === 'participants') {
          // Expected CSV columns: id, name
          data = rawData.map(row => ({
            id: String(row.id || '').trim(),
            name: String(row.name || '').trim()
          }));

          // Validate participant structure
          const valid = data.every(p =>
            p.id.length > 0 && p.id.length <= 50 &&
            p.name.length > 0 && p.name.length <= 100
          );
          if (!valid) {
            throw new Error('CSV must have columns: id, name. Each row must have id (1-50 chars) and name (1-100 chars)');
          }
          this.originalParticipants = data;
        } else if (type === 'prizes') {
          // Expected CSV columns: id, name, name_vi, quantity
          data = rawData.map(row => ({
            id: parseInt(row.id, 10) || 0,
            name: String(row.name || '').trim(),
            name_vi: String(row.name_vi || row.name || '').trim(),
            quantity: parseInt(row.quantity, 10) || 0
          }));

          // Validate prize structure
          const valid = data.every(p =>
            p.id > 0 &&
            p.name.length > 0 && p.name.length <= 100 &&
            p.quantity > 0 && p.quantity <= 1000 &&
            Number.isInteger(p.quantity)
          );
          if (!valid) {
            throw new Error('CSV must have columns: id, name, name_vi (optional), quantity. Each row must have valid values.');
          }
          this.originalPrizes = data;
        }

        // Notify the app to reload
        if (this.onDataImport) {
          this.onDataImport(type, data);
        }

        console.log(`Imported ${data.length} ${type}`);

        // Reset file input
        event.target.value = '';
      } catch (err) {
        console.error('Import error:', err);
        alert(`Failed to import ${type}: ${err.message}`);
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  }

  exportResults() {
    const winners = this.drawManager.winnerManager.getWinners();
    const dateStr = new Date().toISOString().split('T')[0];

    // Generate winners CSV
    const winnersData = winners.map(w => ({
      id: w.id,
      name: w.name,
      prize: i18n.getPrizeName(w.prize),
      prize_id: w.prize.id,
      timestamp: new Date(w.timestamp).toLocaleString()
    }));

    const winnersCSV = generateCSV(winnersData, [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'prize', label: 'Prize' },
      { key: 'prize_id', label: 'Prize ID' },
      { key: 'timestamp', label: 'Time' }
    ]);

    // Download winners CSV
    const blob = new Blob(['\ufeff' + winnersCSV], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucky-draw-winners-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  isOpen() {
    return this.modal && !this.modal.hidden;
  }

  setOriginalData(participants, prizes) {
    this.originalParticipants = [...participants];
    this.originalPrizes = [...prizes];
  }
}
