// ============================================================
// SNEHA ERP - CORE ENGINE
// ============================================================

// 1. Tab Navigation Logic
function openModule(evt, moduleName) {
    const modules = document.getElementsByClassName("module-content");
    for (let i = 0; i < modules.length; i++) {
        modules[i].style.display = "none";
    }
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(moduleName).style.display = "block";
    evt.currentTarget.className += " active";
}

// 2. Security Sanitizer (Anti-XSS & Anti-Formula Injection)
function sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    // Strip HTML/Script Tags
    let sanitized = value.replace(/[<>]/g, '');
    // Neutralize Excel/CSV Injection prefixes (=, +, -, @)
    if (/^[=+\-@\t\r]/.test(sanitized)) {
        sanitized = "'" + sanitized;
    }
    return sanitized.trim();
}

// 3. Bulk CSV Upload Handler (PapaParse Integration)
document.getElementById('n1-bulk-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const securePayload = results.data.map(row => {
                let sanitizedRow = {};
                for (let key in row) {
                    sanitizedRow[sanitizeInput(key)] = sanitizeInput(row[key]);
                }
                return sanitizedRow;
            });
            console.log("Secure Bulk Payload Ready:", securePayload);
            // Future step: send securePayload to FastAPI
        }
    });
});

// 4. Form Submission Handler (N1)
document.getElementById('form-n1').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        buyerName: sanitizeInput(document.getElementById('buyer-name').value),
        buyerGstin: sanitizeInput(document.getElementById('buyer-gstin').value),
        stateCode: document.getElementById('buyer-state-code').value,
        fgItem: sanitizeInput(document.getElementById('fg-item').value),
        hsnCode: sanitizeInput(document.getElementById('hsn-code').value),
        orderQty: document.getElementById('order-qty').value,
        deliveryDate: document.getElementById('delivery-date').value,
        sizeMatrix: sanitizeInput(document.getElementById('size-matrix').value),
        notes: sanitizeInput(document.getElementById('n1-notes').value)
    };

    console.log("ART Token Payload Ready:", formData);
    alert("FG Order Token (ART) Generated Locally!");
});