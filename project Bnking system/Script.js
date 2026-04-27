/* ============================================================
   MiniBank – script.js
   Advanced JavaScript (ES6+) — Frontend Only
   Uses: DOM manipulation, localStorage, ES6 classes,
         arrow functions, array methods, event listeners,
         modular functions, template literals
   ============================================================ */

'use strict';

// ════════════════════════════════════════════════════════════
// SECTION 1 — CONSTANTS & CONFIG
// ════════════════════════════════════════════════════════════

const CONFIG = {
  DEFAULT_BALANCE : 5000,          // Starting balance (₹)
  DEMO_USER       : 'AbhiBank',       // Demo username
  DEMO_PASS       : '935961',        // Demo password
  SPINNER_DELAY   : 1000,          // Milliseconds for fake loader
  STORAGE_KEYS: {
    balance      : 'mb_balance',
    transactions : 'mb_transactions',
    user         : 'mb_user',
    accNumber    : 'mb_acc',
  }
};

// ════════════════════════════════════════════════════════════
// SECTION 2 — LOCALSTORAGE HELPERS
// Wrapper functions to safely read/write localStorage
// ════════════════════════════════════════════════════════════

/**
 * Save any value to localStorage (converts to JSON string)
 * @param {string} key
 * @param {*} value
 */
const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

/**
 * Read a value from localStorage (parses JSON)
 * Returns null if key not found
 * @param {string} key
 * @returns {*}
 */
const readFromStorage = (key) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

/**
 * Remove a key from localStorage
 * @param {string} key
 */
const removeFromStorage = (key) => {
  localStorage.removeItem(key);
};

// ════════════════════════════════════════════════════════════
// SECTION 3 — UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Format a number as Indian Rupee string
 * e.g. 5000 → "₹5,000.00"
 * @param {number} amount
 * @returns {string}
 */
const formatCurrency = (amount) => {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Get current date & time as a readable string
 * e.g. "19 Apr 2026, 10:35 AM"
 * @returns {string}
 */
const getCurrentDateTime = () => {
  return new Date().toLocaleString('en-IN', {
    day  : '2-digit',
    month: 'short',
    year : 'numeric',
    hour : '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Generate a random account number string like "MB-482931"
 * @returns {string}
 */
const generateAccNumber = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `MB-${num}`;
};

/**
 * Show a message box (success or error)
 * @param {string} elementId  - The ID of the msg-box div
 * @param {string} text       - Message text
 * @param {string} type       - 'success' or 'error'
 */
const showMessage = (elementId, text, type) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.className = `msg-box ${type}`;  // applies CSS class
  el.classList.remove('hidden');

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
};

/**
 * Show a loading spinner and hide a button
 * @param {string} spinnerId
 * @param {string} btnId
 */
const showSpinner = (spinnerId, btnId) => {
  document.getElementById(spinnerId)?.classList.remove('hidden');
  document.getElementById(btnId)?.classList.add('hidden');
};

/**
 * Hide a loading spinner and show a button again
 * @param {string} spinnerId
 * @param {string} btnId
 */
const hideSpinner = (spinnerId, btnId) => {
  document.getElementById(spinnerId)?.classList.add('hidden');
  document.getElementById(btnId)?.classList.remove('hidden');
};

// ════════════════════════════════════════════════════════════
// SECTION 4 — LOGIN PAGE LOGIC
// ════════════════════════════════════════════════════════════

/**
 * Handle login form submission
 * — Validates username and password
 * — Shows spinner for 1 second (simulates network request)
 * — Redirects to dashboard.html on success
 */
function handleLogin() {
  const username = document.getElementById('username')?.value.trim();
  const password = document.getElementById('password')?.value.trim();

  // Clear old messages
  document.getElementById('loginMsg')?.classList.add('hidden');

  // ── Validation ──
  if (!username || !password) {
    showMessage('loginMsg', '⚠ Please enter both username and password.', 'error');
    return;
  }

  if (username !== CONFIG.DEMO_USER || password !== CONFIG.DEMO_PASS) {
    showMessage('loginMsg', '✗ Invalid credentials. Use admin / 1234', 'error');
    return;
  }

  // ── Show spinner, then redirect ──
  showSpinner('loginSpinner', 'loginBtn');

  setTimeout(() => {
    // Save logged-in user info to localStorage
    saveToStorage(CONFIG.STORAGE_KEYS.user, username);

    // Initialize balance if first login
    if (readFromStorage(CONFIG.STORAGE_KEYS.balance) === null) {
      saveToStorage(CONFIG.STORAGE_KEYS.balance, CONFIG.DEFAULT_BALANCE);
    }

    // Generate account number if not set
    if (!readFromStorage(CONFIG.STORAGE_KEYS.accNumber)) {
      saveToStorage(CONFIG.STORAGE_KEYS.accNumber, generateAccNumber());
    }

    // Initialize transaction list if empty
    if (!readFromStorage(CONFIG.STORAGE_KEYS.transactions)) {
      saveToStorage(CONFIG.STORAGE_KEYS.transactions, []);
    }

    // ── Redirect to dashboard ──
    window.location.href = 'dashboard.html';
  }, CONFIG.SPINNER_DELAY);
}

// Allow pressing Enter key to submit login
document.getElementById('password')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});

document.getElementById('username')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});


// ════════════════════════════════════════════════════════════
// SECTION 5 — DASHBOARD INIT
// ════════════════════════════════════════════════════════════

/**
 * Initialize the dashboard page
 * — Checks if user is logged in
 * — Loads balance, username, account number
 * — Renders transactions
 */
function initDashboard() {
  // If not on dashboard page, skip
  if (!document.getElementById('balanceDisplay')) return;

  // Guard: redirect to login if not authenticated
  const user = readFromStorage(CONFIG.STORAGE_KEYS.user);
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Set username in navbar
  document.getElementById('navUsername').textContent = user;

  // Set account number
  const acc = readFromStorage(CONFIG.STORAGE_KEYS.accNumber) || generateAccNumber();
  document.getElementById('accNumber').textContent = acc;

  // Load and display balance
  refreshBalance();

  // Render transaction history
  renderTransactions();

  // Update stats cards
  updateStats();
}

/**
 * Read balance from localStorage and update the display
 */
function refreshBalance() {
  const balance = readFromStorage(CONFIG.STORAGE_KEYS.balance) ?? CONFIG.DEFAULT_BALANCE;
  const el = document.getElementById('balanceDisplay');
  if (el) el.textContent = formatCurrency(balance);
}

// ════════════════════════════════════════════════════════════
// SECTION 6 — TRANSACTION LOGIC
// ════════════════════════════════════════════════════════════

// Track which transaction mode is active: 'deposit' | 'withdraw' | 'transfer'
let currentMode = '';

/**
 * Open the modal popup for a transaction
 * @param {string} mode - 'deposit' | 'withdraw' | 'transfer'
 */
function openModal(mode) {
  currentMode = mode;

  // Set modal title based on mode
  const titles = {
    deposit  : '⬆ Deposit Money',
    withdraw : '⬇ Withdraw Money',
    transfer : '↔ Transfer Money'
  };
  document.getElementById('modalTitle').textContent = titles[mode];

  // Show/hide recipient field (only for transfer)
  const recipientGroup = document.getElementById('recipientGroup');
  recipientGroup.style.display = (mode === 'transfer') ? 'block' : 'none';

  // Clear previous inputs and messages
  document.getElementById('modalAmount').value   = '';
  document.getElementById('modalRecipient').value = '';
  document.getElementById('modalMsg').classList.add('hidden');

  // Style the confirm button based on mode
  const btnColors = { deposit: 'btn-green', withdraw: 'btn-red', transfer: 'btn-blue' };
  const confirmBtn = document.getElementById('modalConfirmBtn');
  confirmBtn.className = `btn btn-full ${btnColors[mode]}`;
  confirmBtn.textContent = 'Confirm';

  // Show the modal
  document.getElementById('modalOverlay').classList.remove('hidden');

  // Focus the amount input
  setTimeout(() => document.getElementById('modalAmount').focus(), 100);
}

/**
 * Close the modal popup
 */
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  currentMode = '';
}

/**
 * Close modal if clicking on the dark overlay (outside modal box)
 * @param {Event} e
 */
function closeModalOutside(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}

/**
 * Handle the confirm button inside the modal
 * Reads amount, validates, updates balance & history
 */
function handleTransaction() {
  const amountInput = document.getElementById('modalAmount').value.trim();
  const recipient   = document.getElementById('modalRecipient')?.value.trim();

  // ── Validation ──
  if (!amountInput) {
    showMessage('modalMsg', '⚠ Please enter an amount.', 'error');
    return;
  }

  const amount = parseFloat(amountInput);

  if (isNaN(amount) || amount <= 0) {
    showMessage('modalMsg', '⚠ Enter a valid positive amount.', 'error');
    return;
  }

  if (amount > 1_000_000) {
    showMessage('modalMsg', '⚠ Maximum single transaction is ₹10,00,000.', 'error');
    return;
  }

  // For transfer: require recipient
  if (currentMode === 'transfer' && !recipient) {
    showMessage('modalMsg', '⚠ Please enter recipient name or account.', 'error');
    return;
  }

  // ── Read current balance ──
  let balance = readFromStorage(CONFIG.STORAGE_KEYS.balance) ?? CONFIG.DEFAULT_BALANCE;

  // For withdraw/transfer: check if sufficient balance
  if ((currentMode === 'withdraw' || currentMode === 'transfer') && amount > balance) {
    showMessage('modalMsg', `✗ Insufficient balance. Available: ${formatCurrency(balance)}`, 'error');
    return;
  }

  // ── Show spinner ──
  showSpinner('modalSpinner', 'modalConfirmBtn');

  // Simulate a slight delay (like a real transaction)
  setTimeout(() => {
    // ── Update balance ──
    if (currentMode === 'deposit') {
      balance += amount;
    } else {
      // withdraw or transfer both reduce balance
      balance -= amount;
    }

    saveToStorage(CONFIG.STORAGE_KEYS.balance, balance);

    // ── Build transaction record ──
    const icons = { deposit: '⬆', withdraw: '⬇', transfer: '↔' };

    const tx = {
      id       : Date.now(),                     // unique ID using timestamp
      type     : currentMode,
      amount   : amount,
      date     : getCurrentDateTime(),
      desc     : buildDescription(currentMode, amount, recipient),
      icon     : icons[currentMode],
      balance  : balance,                        // snapshot of balance after tx
    };

    // ── Save transaction to localStorage ──
    const transactions = readFromStorage(CONFIG.STORAGE_KEYS.transactions) || [];
    transactions.unshift(tx);                    // add newest first
    saveToStorage(CONFIG.STORAGE_KEYS.transactions, transactions);

    // ── Update UI ──
    hideSpinner('modalSpinner', 'modalConfirmBtn');
    refreshBalance();
    renderTransactions();
    updateStats();

    showMessage('modalMsg', `✓ ${capitalize(currentMode)} of ${formatCurrency(amount)} successful!`, 'success');

    // Close modal after short delay
    setTimeout(closeModal, 1800);
  }, CONFIG.SPINNER_DELAY);
}

/**
 * Build a human-readable description for a transaction
 * @param {string} mode
 * @param {number} amount
 * @param {string} recipient
 * @returns {string}
 */
function buildDescription(mode, amount, recipient) {
  if (mode === 'deposit')  return `Cash deposit`;
  if (mode === 'withdraw') return `Cash withdrawal`;
  if (mode === 'transfer') return `Transfer to ${recipient || 'Unknown'}`;
  return 'Transaction';
}

/**
 * Capitalize the first letter of a string
 * @param {string} str
 * @returns {string}
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// ════════════════════════════════════════════════════════════
// SECTION 7 — RENDER TRANSACTIONS (uses array methods)
// ════════════════════════════════════════════════════════════

/**
 * Render the transaction list in the UI
 * Applies filter from the dropdown
 * Uses Array.filter() and Array.map()
 */
function renderTransactions() {
  const container  = document.getElementById('txList');
  if (!container) return;

  // Get all transactions from localStorage
  const allTx = readFromStorage(CONFIG.STORAGE_KEYS.transactions) || [];

  // Read current filter value
  const filter = document.getElementById('filterType')?.value || 'all';

  // ── Array.filter() — keep only matching type ──
  const filtered = (filter === 'all')
    ? allTx
    : allTx.filter(tx => tx.type === filter);

  // If no transactions, show empty state
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="tx-empty">
        <p>📭 No transactions found.</p>
      </div>
    `;
    return;
  }

  // ── Array.map() — convert each tx object into HTML string ──
  const htmlRows = filtered.map(tx => `
    <div class="tx-item">
      <div class="tx-icon ${tx.type}">${tx.icon}</div>
      <div class="tx-info">
        <p class="tx-desc">${tx.desc}</p>
        <p class="tx-date">${tx.date}</p>
      </div>
      <div class="tx-amount ${tx.type}">
        ${tx.type === 'deposit' ? '+' : '-'}${formatCurrency(tx.amount)}
      </div>
    </div>
  `);

  // Join array of HTML strings and inject into DOM
  container.innerHTML = htmlRows.join('');
}

// ════════════════════════════════════════════════════════════
// SECTION 8 — STATS (uses Array.reduce)
// ════════════════════════════════════════════════════════════

/**
 * Calculate and display stats:
 * — Total deposited
 * — Total withdrawn
 * — Total transaction count
 * Uses Array.reduce() to sum amounts
 */
function updateStats() {
  const allTx = readFromStorage(CONFIG.STORAGE_KEYS.transactions) || [];

  // Array.reduce() — sum deposit amounts
  const totalDeposit = allTx
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Array.reduce() — sum withdraw + transfer amounts
  const totalWithdraw = allTx
    .filter(tx => tx.type === 'withdraw' || tx.type === 'transfer')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Update DOM
  const depEl  = document.getElementById('statDeposit');
  const witEl  = document.getElementById('statWithdraw');
  const cntEl  = document.getElementById('statCount');

  if (depEl) depEl.textContent = formatCurrency(totalDeposit);
  if (witEl) witEl.textContent = formatCurrency(totalWithdraw);
  if (cntEl) cntEl.textContent = allTx.length;
}

// ════════════════════════════════════════════════════════════
// SECTION 9 — CLEAR HISTORY
// ════════════════════════════════════════════════════════════

/**
 * Clear all transaction history after user confirmation
 */
function clearHistory() {
  const confirmed = window.confirm(
    '⚠ Are you sure you want to clear all transaction history?\nThis cannot be undone.'
  );
  if (!confirmed) return;

  saveToStorage(CONFIG.STORAGE_KEYS.transactions, []);
  renderTransactions();
  updateStats();
}

// ════════════════════════════════════════════════════════════
// SECTION 10 — LOGOUT
// ════════════════════════════════════════════════════════════

/**
 * Log the user out:
 * — Removes user session from localStorage
 * — Keeps balance & transactions (simulates persistent account)
 * — Redirects to login page
 */
function handleLogout() {
  const confirmed = window.confirm('Are you sure you want to logout?');
  if (!confirmed) return;

  removeFromStorage(CONFIG.STORAGE_KEYS.user);
  window.location.href = 'index.html';
}

// ════════════════════════════════════════════════════════════
// SECTION 11 — KEYBOARD SHORTCUTS
// ════════════════════════════════════════════════════════════

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();

  // Press Enter inside modal to confirm
  if (e.key === 'Enter' && currentMode) {
    // Only if modal is open and focus is in an input
    const active = document.activeElement;
    if (active?.tagName === 'INPUT') handleTransaction();
  }
});

// ════════════════════════════════════════════════════════════
// SECTION 12 — AUTO INIT
// Runs on page load — detects which page we're on
// ════════════════════════════════════════════════════════════

/**
 * Automatically initialize the correct page logic
 * based on what elements exist in the DOM
 */
(function autoInit() {
  // If dashboard elements exist → init dashboard
  if (document.getElementById('balanceDisplay')) {
    initDashboard();
  }

  // If login elements exist → check if already logged in
  if (document.getElementById('loginBtn')) {
    const user = readFromStorage(CONFIG.STORAGE_KEYS.user);
    if (user) {
      // Already logged in — skip login page
      window.location.href = 'dashboard.html';
    }
  }
})();