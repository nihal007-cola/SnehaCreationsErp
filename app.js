// Tab Navigation
function openModule(evt, moduleName) {
    const modules = document.getElementsByClassName("module-content");
    for (let i = 0; i < modules.length; i++) modules[i].style.display = "none";
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) tablinks[i].classList.remove("active");
    document.getElementById(moduleName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

// Security: Strip HTML and neutralize CSV formula injection
function sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    let sanitized = value.replace(/[<>]/g, '');
    if (/^[=+\-@\t\r]/.test(sanitized)) sanitized = "'" + sanitized;
    return sanitized.trim();
}

// Bulk Upload Logic
document.getElementById('n1-bulk-upload').addEventListener('change', function(e) {
    Papa.parse(e.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const securePayload = results.data.map(row => {
                let s = {};
                for (let k in row) s[sanitizeInput(k)] = sanitizeInput(row[k]);
                return s;
            });
            console.log("Bulk Payload Ready for API:", securePayload);
        }
    });
});

// Single Entry Submission
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
    console.log("ART Token Payload:", formData);
    alert("FG Token generated. Ready for API injection.");
});

function downloadCSVTemplate() {
    alert("Downloading CSV template for N1 FG Order...");
}