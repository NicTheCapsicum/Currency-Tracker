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

function toggleExpiryFields() {
  document.getElementById("relativeFields").hidden = expiryMode.value !== "relative";
  document.getElementById("fixedField").hidden = expiryMode.value !== "fixed";
}

function saveCurrency() {
  const data = {
    id: editingId || crypto.randomUUID(),
    name: name.value,
    category: category.value,
    expiryMode: expiryMode.value,
    validityValue: Number(validityValue.value),
    validityUnit: validityUnit.value,
    fixedExpiryDate: fixedExpiryDate.value,
    awardedDate: awardedDate.value
  };

  currencies = currencies.filter(c => c.id !== data.id).concat(data);
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
    .map(c => ({ ...c, expiry: calculateExpiry(c) }))
    .sort((a, b) => a.expiry - b.expiry)
    .forEach(c => list.append(renderCurrency(c)));
}

function renderCurrency(c) {
  const div = document.createElement("div");
  const days = Math.ceil((c.expiry - Date.now()) / 86400000);
  const colour = getColour(days, c);

  div.className = `currency ${colour}`;
  div.innerHTML = `
    <strong>${c.name}</strong><br>
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

  name.value = c.name;
  category.value = c.category;
  expiryMode.value = c.expiryMode;
  validityValue.value = c.validityValue || "";
  validityUnit.value = c.validityUnit || "days";
  fixedExpiryDate.value = c.fixedExpiryDate || "";
  awardedDate.value = c.awardedDate;

  toggleExpiryFields();
  dialog.showModal();
};

function openForm() {
  editingId = null;
  document.getElementById("formTitle").textContent = "Add currency";
  document.getElementById("currencyForm").reset();
  toggleExpiryFields();
  dialog.showModal();
}

render();
