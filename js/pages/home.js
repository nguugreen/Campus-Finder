import { loadPlaces, getUniqueValues } from '../data.js';
import { renderPlaceList, refreshStatusBadges, bindFavoriteButtons, el } from '../render.js';
import { toggleFavorite } from '../favorites.js';

const FEATURED_COUNT = 3;

async function init() {
  const featuredList = document.querySelector('#featured-list');
  const statusMsg = document.querySelector('#featured-status');
  const categoryList = document.querySelector('#category-list');
  const searchForm = document.querySelector('#home-search-form');

  // ค้นหาจากหน้าแรก แล้วส่งต่อไปหน้า places.html?q=...
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = new FormData(searchForm).get('q').trim();
    window.location.href = q ? `places.html?q=${encodeURIComponent(q)}` : 'places.html';
  });

  statusMsg.textContent = 'กำลังโหลดข้อมูล...';

  try {
    const places = await loadPlaces();
    statusMsg.textContent = '';

    // หมวดหมู่: ลิงก์ไปหน้า places.html?type=...
    getUniqueValues(places, 'type').forEach((type) => {
      const li = el('li');
      const a = el('a', 'chip', type);
      a.href = `places.html?type=${encodeURIComponent(type)}`;
      li.append(a);
      categoryList.append(li);
    });

    renderPlaceList(featuredList, places.slice(0, FEATURED_COUNT));
    bindFavoriteButtons(featuredList, toggleFavorite);

    // อัปเดตสถานะเปิด/ปิดทุก 1 นาทีโดยไม่ต้องรีเฟรชหน้า
    setInterval(() => refreshStatusBadges(places), 60_000);
  } catch (error) {
    console.error(error);
    statusMsg.textContent = 'ขออภัย โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    statusMsg.classList.add('status-message--error');
  }
}

init();