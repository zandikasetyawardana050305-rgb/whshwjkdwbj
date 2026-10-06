const $ = id => document.getElementById(id);
const rp = n => "Rp" + n.toLocaleString("id-ID");
const esc = t => { const d = document.createElement("div"); d.textContent = t; return d.innerHTML; };
const KEY = "nissa_orders";
let qty = {};

document.title = TOKO.nama;
$("namaToko").textContent = "🥟 " + TOKO.nama + " – " + TOKO.lokasi;
$("tagline").textContent = TOKO.tagline;
$("qrisImg").src = TOKO.qris;

const loadOrders = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const saveOrders = o => localStorage.setItem(KEY, JSON.stringify(o));

function show(v) {
  ["menuView","checkoutView","resultView","ordersView"].forEach(x => $(x).classList.toggle("hide", x !== v));
  $("tMenu").classList.toggle("on", v !== "ordersView");
  $("tOrd").classList.toggle("on", v === "ordersView");
  if (v === "ordersView") renderOrders();
  scrollTo(0, 0);
}
const items = () => MENU.filter(m => qty[m.id] > 0).map(m => ({ ...m, q: qty[m.id] }));
const total = () => items().reduce((s, i) => s + i.harga * i.q, 0);
const lines = () => items().map(i => `<div class="row"><span>${esc(i.nama)} ×${i.q}</span><span>${rp(i.harga * i.q)}</span></div>`).join("") + `<div class="row total"><span>Total</span><span>${rp(total())}</span></div>`;

function renderMenu() {
  $("grid").innerHTML = MENU.map(m => `<div class="card"><img src="${m.gambar}" alt="${esc(m.nama)}"><div class="info"><b>${esc(m.nama)}</b><small>${esc(m.deskripsi || "")}</small><span class="price">${rp(m.harga)}</span><div class="qty"><button data-a="-" data-id="${m.id}">−</button><span id="q${m.id}">${qty[m.id] || 0}</span><button data-a="+" data-id="${m.id}">+</button></div></div></div>`).join("");
}
function renderCart() {
  const t = total();
  $("cart").innerHTML = t ? lines() : "Belum ada pesanan.";
  $("checkoutBtn").disabled = !t;
}
function renderOrders() {
  const orders = loadOrders();
  $("cnt").textContent = orders.length;
  $("ordList").innerHTML = orders.length ? orders.slice().sort((a, b) => b.no - a.no).map(o => `<div class="ord"><h3><span>Pesanan #${o.no} — ${esc(o.nama)}</span><span class="badge ${o.status === "Selesai" ? "done" : ""}">${o.status}</span></h3><div class="note">${esc(o.waktu)} • ${o.pay === "Cash" ? "💵 Cash" : "📱 QRIS"}</div>${o.items.map(i => `<div class="row"><span>${esc(i.nama)} ×${i.q}</span><span>${rp(i.harga * i.q)}</span></div>`).join("")}<div class="row total"><span>Total</span><span>${rp(o.total)}</span></div>${o.status === "Selesai" ? "" : `<button class="btn sm" data-done="${o.no}">Tandai selesai</button>`}</div>`).join("") : "Belum ada pesanan.";
}

$("grid").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const id = +b.dataset.id;
  qty[id] = Math.max(0, (qty[id] || 0) + (b.dataset.a === "+" ? 1 : -1));
  $("q" + id).textContent = qty[id]; renderCart();
});
$("checkoutBtn").onclick = () => { $("summary").innerHTML = lines(); $("qrisTotal").textContent = rp(total()); show("checkoutView"); };
$("backBtn").onclick = () => show("menuView");
document.querySelectorAll("input[name=pay]").forEach(r => r.onchange = () => $("qrisBox").classList.toggle("hide", r.value !== "QRIS" || !r.checked));

$("payBtn").onclick = () => {
  const nama = $("nama").value.trim();
  if (!nama) { alert("Isi nama pembeli dulu ya."); $("nama").focus(); return; }
  const pay = document.querySelector("input[name=pay]:checked").value;
  const orders = loadOrders();
  const no = orders.reduce((m, o) => Math.max(m, o.no), 0) + 1;
  const order = { no, nama, pay, status: "Baru", waktu: new Date().toLocaleString("id-ID"), items: items().map(i => ({ nama: i.nama, harga: i.harga, q: i.q })), total: total() };
  orders.push(order); saveOrders(orders);
  $("receipt").innerHTML = `<div class="row"><span>No. Pesanan</span><b>#${no}</b></div><div class="row"><span>Pembeli</span><b>${esc(nama)}</b></div><div class="row"><span>Waktu</span><span>${order.waktu}</span></div><hr>${lines()}<div class="row"><span>Pembayaran</span><b>${pay === "Cash" ? "💵 Cash (bayar di kasir)" : "📱 QRIS"}</b></div><p class="note center">${pay === "Cash" ? "Silakan siapkan uang tunai saat pesanan diambil." : "Terima kasih! Tunjukkan bukti bayar QRIS ke penjual."}</p>`;
  $("cnt").textContent = orders.length;
  show("resultView");
};
$("newBtn").onclick = () => { qty = {}; $("nama").value = ""; renderMenu(); renderCart(); show("menuView"); };
$("tMenu").onclick = () => show("menuView");
$("tOrd").onclick = () => show("ordersView");
$("ordList").addEventListener("click", e => {
  const n = e.target.dataset.done; if (!n) return;
  const orders = loadOrders(); orders.find(o => o.no == n).status = "Selesai"; saveOrders(orders); renderOrders();
});
$("resetBtn").onclick = () => { if (confirm("Hapus SEMUA pesanan?")) { saveOrders([]); renderOrders(); } };

renderMenu(); renderCart(); $("cnt").textContent = loadOrders().length;
