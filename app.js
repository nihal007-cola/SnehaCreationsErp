// ================================================================
// app.js – Sneha Creations ERP (Node-Based)
// Handles login, navigation, node rendering, notifications & demo
// ================================================================

// ----- state -----
let currentUser = null;
let sessionToken = 'demo-session';

// ----- DOM ready -----
document.addEventListener('DOMContentLoaded', function() {
  // Show login by default
  const loginPage = document.getElementById('loginPage');
  if (loginPage) {
    loginPage.classList.add('active');
    loginPage.style.display = 'flex';
  }
  // Set default date for production issue date
  const prodIssueDate = document.getElementById('prodIssueDate');
  if (prodIssueDate) {
    prodIssueDate.value = new Date().toISOString().split('T')[0];
  }
  // Set default date for FG delivery
  const fgDelivery = document.getElementById('fgDelivery');
  if (fgDelivery) {
    fgDelivery.value = new Date().toISOString().split('T')[0];
  }
  // Render nodes on dashboard equivalent (now per tab)
  renderAllNodes();
});

// ================================================================
// LOGIN
// ================================================================
function loginAs(role) {
  currentUser = { name: role, role: role };
  const display = document.getElementById('userDisplayName');
  if (display) display.textContent = role;
  
  const loginPage = document.getElementById('loginPage');
  if (loginPage) {
    loginPage.classList.remove('active');
    loginPage.style.display = 'none';
  }
  const mainApp = document.getElementById('mainApp');
  if (mainApp) mainApp.classList.add('active');
  
  showNotice('👋 Welcome', `Logged in as ${role} (demo mode)`, 'success');
  renderAllNodes();
}

function logoutUser() {
  currentUser = null;
  const mainApp = document.getElementById('mainApp');
  if (mainApp) mainApp.classList.remove('active');
  const loginPage = document.getElementById('loginPage');
  if (loginPage) {
    loginPage.style.display = 'flex';
    loginPage.classList.add('active');
  }
  showNotice('👋 Logged out', 'You have been logged out.', 'info');
  setTimeout(closeNotice, 1500);
}

// ================================================================
// TAB MANAGEMENT
// ================================================================
function openTab(evt, tabName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById(tabName);
  if (target) target.classList.add('active');
  
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('active');
  } else {
    // Fallback: find tab by onclick attribute
    document.querySelectorAll('.tab').forEach(t => {
      if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(tabName)) {
        t.classList.add('active');
      }
    });
  }
  closeNotice();
  renderAllNodes();
}

// ================================================================
// NODE RENDERING – per tab we show node cards
// ================================================================
function renderAllNodes() {
  // Each tab already has static node-grid HTML, but we keep this for dynamic updates if needed
  // No-op: static nodes are already in HTML
  // But we can add click handlers to all node cards for demo
  document.querySelectorAll('.node-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
      const title = this.querySelector('.node-title')?.textContent?.trim() || 'Node';
      const desc = this.querySelector('.node-desc')?.textContent?.trim() || '';
      const badge = this.querySelector('.node-badge')?.textContent?.trim() || '';
      showNotice(`📌 ${title}`, `Status: ${badge}\nDescription: ${desc}`, 'info');
    });
  });
}

// ================================================================
// NOTICE SYSTEM
// ================================================================
function showNotice(title, message, type) {
  const modal = document.getElementById('noticeModal');
  if (!modal) return;
  const icon = document.getElementById('noticeIcon');
  const titleEl = document.getElementById('noticeTitle');
  const msgEl = document.getElementById('noticeMessage');
  const icons = { 'success': '✅', 'error': '❌', 'warning': '⚠️', 'info': 'ℹ️' };
  if (icon) icon.textContent = icons[type] || '📢';
  if (titleEl) titleEl.textContent = title || 'Notice';
  if (msgEl) msgEl.textContent = message || '';
  modal.style.display = 'flex';
}

function closeNotice() {
  const modal = document.getElementById('noticeModal');
  if (modal) modal.style.display = 'none';
}

// ================================================================
// LOADER (fullscreen)
// ================================================================
function showFullscreenLoader(text) {
  const loader = document.getElementById('fullscreenLoader');
  if (!loader) return;
  const label = document.getElementById('loaderText');
  if (label) label.textContent = text || 'Loading...';
  loader.classList.add('active');
}

function hideFullscreenLoader() {
  const loader = document.getElementById('fullscreenLoader');
  if (loader) loader.classList.remove('active');
}

// ================================================================
// DEMO: Additional helper for "Print" from notice
// ================================================================
function showNoticeWithPrint(title, message, type) {
  showNotice(title, message, type);
  // Add print button if not exists
  const actions = document.querySelector('#noticeModal .notice-actions');
  if (actions && !document.getElementById('noticePrintBtn')) {
    const btn = document.createElement('button');
    btn.id = 'noticePrintBtn';
    btn.className = 'btn btn-purple';
    btn.textContent = '🖨️ Print';
    btn.onclick = function() {
      const content = document.getElementById('noticeMessage')?.textContent || '';
      const win = window.open('', '_blank', 'width=600,height=400');
      if (win) {
        win.document.write('<pre>' + content + '</pre>');
        win.document.close();
        win.print();
      }
    };
    actions.appendChild(btn);
  }
}

// ================================================================
// EXPOSE GLOBALLY for inline onclick
// ================================================================
window.loginAs = loginAs;
window.logoutUser = logoutUser;
window.openTab = openTab;
window.showNotice = showNotice;
window.closeNotice = closeNotice;
window.showFullscreenLoader = showFullscreenLoader;
window.hideFullscreenLoader = hideFullscreenLoader;
window.renderAllNodes = renderAllNodes;
window.showNoticeWithPrint = showNoticeWithPrint;

// ================================================================
// AUTO-RENDER NODES on any DOM change (optional)
// ================================================================
// Re-run render when tabs change (already called in openTab)
// Also re-run after any dynamic content load
document.addEventListener('DOMNodeInserted', function(e) {
  if (e.target.classList && e.target.classList.contains('node-card')) {
    renderAllNodes();
  }
});