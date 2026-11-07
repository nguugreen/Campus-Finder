import { getStatus } from './status.js';
import { isFavorite } from './favorites.js';

/** ตัวช่วยสร้าง element แบบสั้น */
export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function createStatusBadge(place) {
  const { key, label } = getStatus(place);
  const badge = el('span', `badge badge--${key}`, label);
  badge.dataset.statusFor = place.id; // ใช้ตอนอัปเดตสถานะทุกนาที
  return badge;
}

export function createPlaceCard(place) {
  const li = el('li');
  const article = el('article', 'card');

  const img = el('img', 'card-img');
  img.src = place.image;
  img.alt = `ภาพ ${place.name}`;
  img.loading = 'lazy';
  img.width = 640;
  img.height = 360;

  const body = el('div', 'card-body');
  const title = el('h3', 'card-title');
  const link = el('a', '', place.name);
  link.href = `place.html?id=${encodeURIComponent(place.id)}`;
  title.append(link);

  const meta = el('p', 'card-meta',
    `${place.code} · โซน ${place.zone} · ${place.open}–${place.close} น.`);

  const actions = el('div', 'card-actions');
  const favBtn = el('button', 'btn btn-ghost fav-btn');
  favBtn.type = 'button';
  favBtn.dataset.id = place.id;
  setFavButtonState(favBtn, isFavorite(place.id));
  actions.append(favBtn);

  body.append(title, createStatusBadge(place), meta, actions);
  article.append(img, body);
  li.append(article);
  return li;
}

export function setFavButtonState(button, active) {
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? '★ บันทึกแล้ว' : '☆ บันทึก';
}

/** แสดงรายการ ถ้าไม่มีข้อมูลให้แสดงข้อความแทน */
export function renderPlaceList(container, places, emptyText = 'ไม่พบสถานที่ที่ตรงกับเงื่อนไข') {
  container.replaceChildren();
  if (places.length === 0) {
    container.append(el('li', 'status-message', emptyText));
    return;
  }
  const fragment = document.createDocumentFragment();
  places.forEach((p) => fragment.append(createPlaceCard(p)));
  container.append(fragment);
}

/** เติม <option> ใน <select> ของตัวกรอง */
export function renderOptions(select, values, allLabel = 'ทั้งหมด') {
  select.replaceChildren(new Option(allLabel, 'all'), ...values.map((v) => new Option(v, v)));
}

/** อัปเดต badge ทุกตัวบนหน้า (เรียกจาก setInterval) */
export function refreshStatusBadges(places) {
  document.querySelectorAll('[data-status-for]').forEach((badge) => {
    const place = places.find((p) => p.id === Number(badge.dataset.statusFor));
    if (!place) return;
    const { key, label } = getStatus(place);
    badge.className = `badge badge--${key}`;
    badge.textContent = label;
  });
}

/** ใช้ event delegation: ติด listener ที่ container ตัวเดียว ไม่ต้องติดทุกปุ่ม */
export function bindFavoriteButtons(container, toggleFn, onChange) {
  container.addEventListener('click', (event) => {
    const button = event.target.closest('.fav-btn');
    if (!button) return;
    const active = toggleFn(button.dataset.id);
    setFavButtonState(button, active);
    onChange?.(Number(button.dataset.id), active);
  });
}