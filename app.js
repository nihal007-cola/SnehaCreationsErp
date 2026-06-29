function openModule(evt, moduleName) {
    document.querySelectorAll(".module-content").forEach(m => m.style.display = "none");
    document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
    document.getElementById(moduleName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

document.getElementById('form-n1').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("ART Token Generated for: " + document.getElementById('fg-item').value);
});