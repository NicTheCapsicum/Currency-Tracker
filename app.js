const nameInput = document.getElementById("currencyName");
const categoryInput = document.getElementById("category");
const awardedDateInput = document.getElementById("awardedDate");
const validityValueInput = document.getElementById("validityValue");
const validityUnitInput = document.getElementById("validityUnit");
const fixedExpiryDateInput = document.getElementById("fixedExpiryDate");
const expiryModeInput = document.getElementById("expiryMode");

if (!nameInput) {
  alert("currencyName input not found — check index.html IDs");
}

const STORAGE_KEY = "currencies";
let currencies = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingId = null;

const list = document.getElementById("list");
const dialog = document.getElementById("currencyDialog");

const expiryMode = document.getElementById("expiryMode");
expiryMode.addEventListener("change", toggleExpiryFields);

document.getElementById("addBtn").onclick = () => openForm();

document.getElementById("currencyForm").onsubmit = e => {
  e.preventDefault();
  saveCurrency();
};

document.getElementById("deleteBtn").onclick = () => {
  if (!editingId) return;

  if (!confirm("Delete this currency?")) return;

  currencies = currencies.filter(c => c.id !== editingId);
  editingId = null;
  persist();
  dialog.close();
};

function toggleExpiryFields() {
  document.getElementById("relativeFields").hidden = expiryMode.value !== "relative";
  document.getElementById("fixedField").hidden = expiryMode.value !== "fixed";
}

function saveCurrency() {
  const nameValue = nameInput.value.trim();

  if (!nameValue) {
    alert("Currency name is required");
    return;
  }

  const data = {
    id: editingId || crypto.randomUUID(),
    name: nameValue,
    category: categoryInput.value,
    expiryMode: expiryModeInput.value,
    validityValue: Number(validityValueInput.value),
    validityUnit: validityUnitInput.value,
    fixedExpiryDate: fixedExpiryDateInput.value,
    awardedDate: awardedDateInput.value
  };

  currencies = currencies.filter(c => c.id !== data.id);
  currencies.push(data);

  persist();
  dialog.close();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currencies));
  render();
}

function render() {
  list.innerHTML = "";

  currencies
    .map(c => {
      const expiry = calculateExpiry(c);
      return { ...c, expiry };
    })
    .sort((a, b) => a.expiry - b.expiry)
    .forEach(c => list.append(renderCurrency(c)));
}

function renderCurrency(c) {
  const div = document.createElement("div");
  const days = Math.ceil((c.expiry - Date.now()) / 86400000);
  const colour = getColour(days, c);

  const displayName = typeof c.name === "string" && c.name.trim()
    ? c.name
    : "Unnamed currency";

  div.className = `currency ${colour}`;
  div.innerHTML = `
    <strong>${displayName}</strong><br>
    Expires: ${new Date(c.expiry).toLocaleDateString()} (${days} days)
    <br>
    <button onclick="complete('${c.id}')">Completed</button>
    <button onclick="edit('${c.id}')">Edit</button>
  `;
  return div;
}

function calculateExpiry(c) {
  const base = new Date(c.awardedDate);
  if (c.expiryMode === "fixed") return new Date(c.fixedExpiryDate);

  const d = new Date(base);
  if (c.validityUnit === "days") d.setDate(d.getDate() + c.validityValue);
  if (c.validityUnit === "months") d.setMonth(d.getMonth() + c.validityValue);
  if (c.validityUnit === "years") d.setFullYear(d.getFullYear() + c.validityValue);
  return d;
}

function getColour(days, c) {
  if (days < 0) return "red";

  const long = c.validityUnit === "years" && c.validityValue > 1;
  const t = days;

  if (!long) {
    if (t > 90) return "black";
    if (t > 60) return "blue";
    if (t > 30) return "green";
    if (t > 14) return "yellow";
    if (t > 7) return "amber";
    return "red";
  } else {
    if (t > 365) return "black";
    if (t > 180) return "blue";
    if (t > 90) return "green";
    if (t > 60) return "yellow";
    if (t > 30) return "amber";
    return "red";
  }
}

window.complete = id => {
  const c = currencies.find(x => x.id === id);
  c.awardedDate = new Date().toISOString().slice(0, 10);
  persist();
};

window.edit = id => {
  const c = currencies.find(x => x.id === id);
  editingId = id;

  document.getElementById("formTitle").textContent = "Edit currency";
  document.getElementById("deleteBtn").style.display = "inline-block";

  nameInput.value = c.name || "";
  categoryInput.value = c.category;
  expiryModeInput.value = c.expiryMode;
  validityValueInput.value = c.validityValue || "";
  validityUnitInput.value = c.validityUnit || "days";
  fixedExpiryDateInput.value = c.fixedExpiryDate || "";
  awardedDateInput.value = c.awardedDate;

  toggleExpiryFields();
  dialog.showModal();
};

function openForm() {
  editingId = null;
  document.getElementById("formTitle").textContent = "Add currency";
  document.getElementById("currencyForm").reset();
  document.getElementById("deleteBtn").style.display = "none";
  toggleExpiryFields();
  dialog.showModal();
}

function scheduleMidnightRefresh() {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  setTimeout(() => {
    render();
    scheduleMidnightRefresh();
  }, nextMidnight - now);
}

render();
scheduleMidnightRefresh();

window.saveCurrency = saveCurrency;
window.openForm = openForm;
