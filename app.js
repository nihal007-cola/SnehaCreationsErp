// ================================================================
// Sneha Creations ERP – Trims Module
// Complete Application Logic with Dynamic Node Loading
// ================================================================

// ===== STATE =====
let currentUser = { id: 'ADMIN', role: 'CHECKER' };
let sessionToken = 'demo-session-' + Date.now();
let formDataStore = {};
let currentTab = 'fgorder';
let loadedNodes = {};

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(el => {
    if (!el.value) el.value = today;
  });
  // Show login
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('loginPage').style.display = 'flex';
  // Load first node by default
  setTimeout(() => {
    loadNode('node01', 'FG Order Acceptance', null);
  }, 300);
});

// ===== LOGIN =====
function handleLogin() {
  const userId = document.getElementById('loginUserId').value || 'USER';
  const role = document.getElementById('loginRole').value;
  currentUser = { id: userId, role: role };
  document.getElementById('userDisplayName').textContent = userId;
  document.getElementById('userRoleBadge').textContent = role;
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainApp').classList.add('active');
  showNotice('✅ Welcome', `Logged in as ${userId} (${role})`, 'success');
}

function logoutUser() {
  currentUser = null;
  document.getElementById('mainApp').classList.remove('active');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginPage').classList.add('active');
  showNotice('👋 Logged out', 'Session terminated.', 'info');
  setTimeout(closeNotice, 1500);
}

// ===== TAB MANAGEMENT =====
function openTab(evt, tabName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(tabName);
  if (target) target.classList.add('active');
  
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('active');
  } else {
    document.querySelectorAll('.tab').forEach(t => {
      if (t.getAttribute('data-tab') === tabName) t.classList.add('active');
    });
  }
  currentTab = tabName;
  
  // Auto-load first node if none loaded
  const container = document.getElementById(`node-content-${tabName}`);
  if (container && container.querySelector('.loading-placeholder')) {
    const firstSubTab = document.querySelector(`#${tabName} .sub-tab`);
    if (firstSubTab) {
      const nodeId = firstSubTab.getAttribute('data-sub');
      const nodeName = firstSubTab.textContent.trim();
      loadNode(nodeId, nodeName, null);
    }
  }
}

// ===== DYNAMIC NODE LOADING =====
function loadNode(nodeId, nodeName, evt) {
  // Update sub-tab active state
  if (evt && evt.currentTarget) {
    const parent = evt.currentTarget.closest('.card');
    parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    evt.currentTarget.classList.add('active');
  } else {
    // Find and activate the corresponding sub-tab
    document.querySelectorAll('.sub-tab').forEach(t => {
      if (t.getAttribute('data-sub') === nodeId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
  }
  
  // Find the container
  const parentTab = document.querySelector(`.page.active`);
  if (!parentTab) return;
  const containerId = `node-content-${parentTab.id}`;
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Check if already loaded
  if (loadedNodes[nodeId]) {
    container.innerHTML = loadedNodes[nodeId];
    // Re-bind form events
    bindFormEvents(nodeId);
    return;
  }
  
  // Show loader
  container.innerHTML = `<div class="loading-spinner">Loading ${nodeName}...</div>`;
  
  // Fetch node HTML
  fetch(`nodes/${nodeId}.html`)
    .then(response => {
      if (!response.ok) throw new Error('Node not found');
      return response.text();
    })
    .then(html => {
      loadedNodes[nodeId] = html;
      container.innerHTML = html;
      bindFormEvents(nodeId);
      // Trigger any node-specific initialization
      if (window[`initNode${nodeId}`]) {
        window[`initNode${nodeId}`]();
      }
    })
    .catch(error => {
      console.error('Error loading node:', error);
      container.innerHTML = `
        <div class="error-message">
          <p>⚠️ Failed to load ${nodeName}</p>
          <p style="font-size:0.8rem;color:#64748b;">${error.message}</p>
          <button class="btn btn-primary" onclick="loadNode('${nodeId}','${nodeName}',null)">Retry</button>
        </div>
      `;
    });
}

// ===== BIND FORM EVENTS =====
function bindFormEvents(nodeId) {
  // Find the form in the loaded content
  const form = document.querySelector(`#node-content-${currentTab} .form-section`);
  if (!form) return;
  
  // Bind submit button
  const submitBtn = form.querySelector('.btn-submit');
  if (submitBtn) {
    submitBtn.onclick = function() {
      submitForm(nodeId);
    };
  }
  
  // Bind bulk upload
  const bulkInput = form.querySelector('.bulk-upload-input');
  if (bulkInput) {
    bulkInput.onchange = function(e) {
      handleBulkUpload(e, nodeId);
    };
  }
  
  // Bind download format
  const downloadBtn = form.querySelector('.btn-download');
  if (downloadBtn) {
    downloadBtn.onclick = function() {
      downloadFormat(nodeId);
    };
  }
  
  // Bind calculation events
  form.querySelectorAll('[data-calc]').forEach(el => {
    el.oninput = function() {
      const calcType = el.getAttribute('data-calc');
      if (calcType === 'costing') calculateCosting();
      else if (calcType === 'po') calculatePO();
      else if (calcType === 'qc') calculateQC();
    };
  });
}

// ===== FORM SUBMISSION =====
function submitForm(nodeId) {
  const form = document.querySelector(`#node-content-${currentTab} .form-section`);
  if (!form) {
    showNotice('⚠️ Error', 'Form section not found.', 'error');
    return;
  }
  
  const inputs = form.querySelectorAll('input, select, textarea');
  let data = {};
  inputs.forEach(el => {
    if (el.id) {
      data[el.id] = el.value;
    }
  });
  
  const formType = nodeId.toUpperCase();
  const art = generateART(formType);
  data['ART'] = art;
  data['submittedBy'] = currentUser.id;
  data['submittedAt'] = new Date().toISOString();
  data['role'] = currentUser.role;
  data['formType'] = formType;
  
  if (!formDataStore[formType]) formDataStore[formType] = [];
  formDataStore[formType].push(data);
  
  // GSTIN validation
  const gstinFields = ['fgGstin', 'supplierGstin', 'logGstin', 'configGstin'];
  let hasError = false;
  gstinFields.forEach(fid => {
    const el = document.getElementById(fid);
    if (el && el.value && el.value.length !== 15 && el.value.length > 0) {
      hasError = true;
      showNotice('❌ Validation Error', `GSTIN must be exactly 15 characters.\nField: ${fid}`, 'error');
    }
  });
  if (hasError) return;
  
  showNotice(
    '✅ Transaction Complete',
    `Node: ${nodeId}\nART: ${art}\nRecords: ${formDataStore[formType].length}\nStatus: Committed`,
    'success'
  );
  
  console.log(`[${nodeId}] Transaction:`, data);
}

// ===== GENERATE ART =====
function generateART(formType) {
  const fy = document.getElementById('configFy')?.value || 'FY26';
  const prefix = 'SC';
  const map = {
    'NODE01': 'FG', 'NODE02': 'BOM', 'NODE03': 'COST', 'NODE04': 'BAPPR',
    'NODE05': 'SUPP', 'NODE06': 'PR', 'NODE07': 'PO', 'NODE08': 'POAPPR',
    'NODE09': 'LOG', 'NODE10': 'DISP', 'NODE11': 'QC', 'NODE12': 'RET',
    'NODE13': 'GRN', 'NODE14': 'PROD', 'NODE15': 'MISS',
    'NODE16': 'TTL', 'NODE17': 'CONFIG', 'NODE18': 'NOTIFY'
  };
  const suffix = map[formType] || formType;
  const seq = String(formDataStore[formType]?.length + 1 || 1).padStart(4, '0');
  return `${prefix}-${fy}-${suffix}-${seq}`;
}

// ===== CALCULATIONS =====
function calculateCosting() {
  const rm = parseFloat(document.getElementById('costRmCost')?.value) || 0;
  const labor = parseFloat(document.getElementById('costLabor')?.value) || 0;
  const overhead = parseFloat(document.getElementById('costOverhead')?.value) || 0;
  const tax = parseFloat(document.getElementById('costTax')?.value) || 18;
  const subtotal = rm + labor + overhead;
  const total = subtotal * (1 + tax/100);
  const totalField = document.getElementById('costTotal');
  if (totalField) totalField.value = total.toFixed(2);
}

function calculatePO() {
  const base = parseFloat(document.getElementById('poBaseRate')?.value) || 0;
  const cgst = parseFloat(document.getElementById('poCgst')?.value) || 0;
  const sgst = parseFloat(document.getElementById('poSgst')?.value) || 0;
  const igst = parseFloat(document.getElementById('poIgst')?.value) || 0;
  const total = base * (1 + (cgst + sgst + igst)/100);
  const totalField = document.getElementById('poTotal');
  if (totalField) totalField.value = total.toFixed(2);
}

function calculateQC() {
  const passed = parseFloat(document.getElementById('qcPassed')?.value) || 0;
  const failed = parseFloat(document.getElementById('qcFailed')?.value) || 0;
}

// ===== BULK UPLOAD =====
function handleBulkUpload(event, nodeId) {
  const file = event.target.files[0];
  if (!file) return;
  
  showFullscreenLoader('Processing CSV...');
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      hideFullscreenLoader();
      showNotice('⚠️ Error', 'CSV must have headers and data rows.', 'error');
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        let row = {};
        headers.forEach((h, idx) => row[h] = values[idx]);
        rows.push(row);
      }
    }
    
    const formType = nodeId.toUpperCase();
    if (!formDataStore[formType]) formDataStore[formType] = [];
    rows.forEach(row => {
      row['ART'] = generateART(formType);
      row['bulkUpload'] = true;
      row['submittedBy'] = currentUser.id;
      row['submittedAt'] = new Date().toISOString();
      formDataStore[formType].push(row);
    });
    
    hideFullscreenLoader();
    showNotice(
      '📤 Bulk Upload Complete',
      `Node: ${nodeId}\nRecords: ${rows.length}\nTotal: ${formDataStore[formType].length}`,
      'success'
    );
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ===== DOWNLOAD FORMAT =====
function downloadFormat(nodeId) {
  const templates = {
    'NODE01': 'BuyerName,GSTIN,Item,HSN,SizeMatrix,Qty,TaxRate,DeliveryDate,Notes',
    'NODE02': 'FGToken,RMItem,UOM,ConsumptionPct,WastagePct,QtyRequired,Notes',
    'NODE03': 'BOMToken,RMCost,LaborCost,Overheads,TaxPct,Notes',
    'NODE04': 'CostToken,Status,Maker,Checker,Remarks,Timestamp',
    'NODE05': 'SupplierName,GSTIN,PAN,Udyam,Address,Notes',
    'NODE06': 'BOMToken,RMItem,Qty,NeedByDate,Notes',
    'NODE07': 'Supplier,BaseRate,CGST,SGST,IGST,Notes',
    'NODE08': 'POToken,Status,RejectionReason',
    'NODE09': 'Transporter,GSTIN,VehicleNo,EstArrival,Notes',
    'NODE10': 'DispatchToken,InvoiceNo,Date,EWayBill,AWB,Notes',
    'NODE11': 'DispatchToken,PassedQty,FailedQty,InspectorID,DefectPhoto,Notes',
    'NODE12': 'FailedRef,DebitNote,TaxReversal,ReturnEWB,Notes',
    'NODE13': 'PassedRef,GodownBin,GRNNo,Notes',
    'NODE14': 'BOMToken,BatchNo,ScheduledDate,TargetOutput,Notes',
    'NODE15': 'BatchToken,IssueQty,FIFOLogic,IssuerID,Notes',
    'NODE16': 'NodeID,TTLDays,EscalationID',
    'NODE17': 'CompanyName,GSTIN,FinancialYear,Notes',
    'NODE18': 'TelegramID,WhatsappID,TriggerEvents,Notes'
  };
  
  const content = templates[nodeId.toUpperCase()] || 'Field1,Field2,Field3,Notes';
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nodeId}_format.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotice('📥 Format Downloaded', `Template for ${nodeId} is ready.`, 'info');
}

// ===== REPORTS =====
function loadReport(type) {
  const container = document.getElementById('node-content-reports');
  if (!container) return;
  
  const reportContent = {
    'stock': `
      <div class="form-section">
        <h4>📊 Stock Position</h4>
        <div style="padding:30px;background:#0f172a;border-radius:10px;border:1px solid #2a3a5a;color:#94a3b8;text-align:center;">
          <p style="font-size:1.2rem;color:#38bdf8;">📦 Stock Report</p>
          <p>Real-time inventory position will be displayed here.</p>
          <button class="btn btn-success" onclick="generateReport('STOCK')" style="margin-top:16px;">Generate Report</button>
        </div>
      </div>
    `,
    'requirement': `
      <div class="form-section">
        <h4>📊 RM Requirement</h4>
        <div style="padding:30px;background:#0f172a;border-radius:10px;border:1px solid #2a3a5a;color:#94a3b8;text-align:center;">
          <p style="font-size:1.2rem;color:#38bdf8;">🧾 Raw Material Requirement</p>
          <p>Aggregated demand from all active BOMs.</p>
          <button class="btn btn-purple" onclick="generateReport('REQUIREMENT')" style="margin-top:16px;">Generate Report</button>
        </div>
      </div>
    `,
    'print': `
      <div class="form-section">
        <h4>🖨️ Print</h4>
        <div style="padding:30px;background:#0f172a;border-radius:10px;border:1px solid #2a3a5a;color:#94a3b8;text-align:center;">
          <p style="font-size:1.2rem;color:#38bdf8;">🖨️ Print Reports</p>
          <p>Select a report to print:</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
            <button class="btn btn-secondary" onclick="printReport('STOCK')">📦 Stock</button>
            <button class="btn btn-secondary" onclick="printReport('REQUIREMENT')">🧾 Requirement</button>
            <button class="btn btn-secondary" onclick="printReport('ALL')">📋 All</button>
          </div>
        </div>
      </div>
    `
  };
  
  container.innerHTML = reportContent[type] || '<div class="error-message">Report not found</div>';
  
  // Update sub-tab active state
  document.querySelectorAll('#reports .sub-tab').forEach(t => {
    t.classList.remove('active');
    if (t.getAttribute('data-sub') === `report-${type}`) {
      t.classList.add('active');
    }
  });
}

function generateReport(type) {
  showFullscreenLoader(`Generating ${type} report...`);
  setTimeout(() => {
    hideFullscreenLoader();
    const data = formDataStore[type === 'STOCK' ? 'NODE13' : 'NODE06'] || [];
    showNotice(
      `📊 ${type} Report`,
      `Total Records: ${data.length}\n\n${JSON.stringify(data.slice(0,5), null, 2)}`,
      'info'
    );
  }, 1500);
}

function printReport(type) {
  const data = formDataStore[type === 'STOCK' ? 'NODE13' : type === 'REQUIREMENT' ? 'NODE06' : 'NODE01'] || [];
  const content = JSON.stringify(data, null, 2);
  const win = window.open('', '_blank', 'width=800,height=600');
  if (win) {
    win.document.write(`
      <html><head><title>Report - ${type}</title>
      <style>body{background:#0f172a;color:#e2e8f0;font-family:monospace;padding:20px;}
      pre{white-space:pre-wrap;word-wrap:break-word;}</style>
      </head><body>
      <h1 style="color:#38bdf8;">${type} Report</h1>
      <p>Generated: ${new Date().toISOString()}</p>
      <hr>
      <pre>${content}</pre>
      <script>
        setTimeout(() => { window.print(); }, 500);
      <\/script>
      </body></html>
    `);
    win.document.close();
  }
}

// ===== NOTICE SYSTEM =====
function showNotice(title, message, type) {
  const modal = document.getElementById('noticeModal');
  if (!modal) return;
  const icon = document.getElementById('noticeIcon');
  const titleEl = document.getElementById('noticeTitle');
  const msgEl = document.getElementById('noticeMessage');
  const icons = { 'success': '✅', 'error': '❌', 'warning': '⚠️', 'info': 'ℹ️' };
  if (icon) icon.textContent = icons[type] || '📢';
  if (titleEl) {
    titleEl.textContent = title || 'Notice';
    titleEl.className = type || 'info';
  }
  if (msgEl) msgEl.textContent = message || '';
  modal.style.display = 'flex';
}

function closeNotice() {
  const modal = document.getElementById('noticeModal');
  if (modal) modal.style.display = 'none';
}

// ===== LOADER =====
function showFullscreenLoader(text) {
  const loader = document.getElementById('fullscreenLoader');
  if (!loader) return;
  const label = document.getElementById('loaderText');
  if (label) label.textContent = text || 'Processing...';
  loader.classList.add('active');
}

function hideFullscreenLoader() {
  const loader = document.getElementById('fullscreenLoader');
  if (loader) loader.classList.remove('active');
}

// ===== GLOBAL EXPOSURE =====
window.handleLogin = handleLogin;
window.logoutUser = logoutUser;
window.openTab = openTab;
window.loadNode = loadNode;
window.loadReport = loadReport;
window.submitForm = submitForm;
window.handleBulkUpload = handleBulkUpload;
window.downloadFormat = downloadFormat;
window.calculateCosting = calculateCosting;
window.calculatePO = calculatePO;
window.calculateQC = calculateQC;
window.generateReport = generateReport;
window.printReport = printReport;
window.showNotice = showNotice;
window.closeNotice = closeNotice;
window.showFullscreenLoader = showFullscreenLoader;
window.hideFullscreenLoader = hideFullscreenLoader;
window.generateART = generateART;

console.log('✅ Sneha Creations ERP – Trims Module loaded');
console.log('📋 Dynamic node loading enabled for 18 nodes');
