/**
 * js/pages/places.js
 * สคริปต์ควบคุมหน้า places.html (รับผิดชอบโดย สมาชิกคนที่ 3 - Branch: feature/search-filter)
 * ทำหน้าที่:
 * 1. ดึงข้อมูลสถานที่จาก js/data.js (F1)
 * 2. สร้างตัวเลือก <option> ประเภทและโซนอัตโนมัติด้วย DOM (T6)
 * 3. อ่านค่า Query Parameters จาก URL (เช่น ?q=SC-201 หรือ ?type=อาคารเรียน จากหน้าแรก)
 * 4. ผูก Event 'input' (F2 Real-time search) และ 'change' / 'reset' (F3 Filter)
 * 5. ส่งรายการที่ผ่านการกรองไปวาดการ์ดด้วย js/render.js
 */

import {
  filterPlaces,
  getUniqueTypes,
  getUniqueZones
} from '../search-filter.js';

// เก็บข้อมูลสถานที่ทั้งหมดไว้ในหน่วยความจำหลังจาก fetch ครั้งแรก
let allPlaces = [];

// อ้างอิง DOM Elements จากหน้า places.html
const filterForm = document.getElementById('search-filter-form');
const searchInput = document.getElementById('search-input');
const typeSelect = document.getElementById('type-select');
const zoneSelect = document.getElementById('zone-select');
const resultsCountEl = document.getElementById('results-count');
const errorMessageEl = document.getElementById('error-message');
const emptyStateEl = document.getElementById('empty-state');
const placesGridEl = document.getElementById('places-grid');

/**
 * โหลดข้อมูลสถานที่จากโมดูล js/data.js (ของคนที่ 1)
 * หากไฟล์ js/data.js ยังไม่ถูก merge จะ fallback ไปใช้ fetch('data/places.json') โดยตรง
 * @returns {Promise<Array<Object>>}
 */
async function loadPlacesData() {
  try {
    const dataModule = await import('../data.js');
    if (typeof dataModule.fetchPlaces === 'function') {
      return await dataModule.fetchPlaces();
    }
  } catch (err) {
    // กรณีอยู่ใน branch feature/search-filter แล้วเพื่อนคนที่ 1 ยังไม่ได้ merge js/data.js
  }

  // Fallback: ดึงจาก data/places.json โดยตรงด้วย relative path (T7)
  const response = await fetch('data/places.json');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * วาดรายการการ์ดสถานที่ลงใน #places-grid
 * เรียกใช้ renderPlaceList หรือ createPlaceCard จาก js/render.js (ของคนที่ 2)
 * พร้อม Fallback สร้างการ์ดพื้นฐานด้วย DOM หาก js/render.js ยังไม่ถูก merge
 *
 * @param {Array<Object>} places - รายการสถานที่ที่ผ่านการกรองแล้ว
 */
async function displayPlaces(places) {
  if (!placesGridEl) return;

  // ล้างการ์ดเก่าออกก่อนวาดใหม่
  placesGridEl.replaceChildren();

  try {
    const renderModule = await import('../render.js');
    if (typeof renderModule.renderPlaceList === 'function') {
      renderModule.renderPlaceList(placesGridEl, places);
      return;
    }
    if (typeof renderModule.createPlaceCard === 'function') {
      const fragment = document.createDocumentFragment();
      places.forEach((place) => {
        fragment.appendChild(renderModule.createPlaceCard(place));
      });
      placesGridEl.appendChild(fragment);
      return;
    }
  } catch (err) {
    // กรณีเพื่อนคนที่ 2 ยังไม่ได้ merge js/render.js ใช้ Fallback ด้านล่างแทน
  }

  // Fallback DOM Card (สร้างด้วย document.createElement และ textContent ตามกฎ T6)
  const fragment = document.createDocumentFragment();
  places.forEach((place) => {
    const card = document.createElement('article');
    card.className = 'place-card card';

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = `${place.name} (${place.code || '-'})`;

    const meta = document.createElement('p');
    meta.className = 'card-meta';
    meta.textContent = `ประเภท: ${place.type || '-'} | โซน: ${place.zone || '-'} | เวลา: ${place.open || '-'}-${place.close || '-'}`;

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = place.description || '';

    const link = document.createElement('a');
    link.className = 'btn btn-primary';
    link.href = `place.html?id=${encodeURIComponent(place.id)}`;
    link.textContent = 'ดูรายละเอียด';

    body.append(title, meta, desc, link);
    card.appendChild(body);
    fragment.appendChild(card);
  });

  placesGridEl.appendChild(fragment);
}

/**
 * สร้างตัวเลือก <option> ใน <select> สำหรับประเภทและโซนจากข้อมูลจริงด้วย DOM (T6)
 * @param {Array<Object>} places
 */
function populateFilterOptions(places) {
  const types = getUniqueTypes(places);
  const zones = getUniqueZones(places);

  if (typeSelect) {
    types.forEach((type) => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      typeSelect.appendChild(option);
    });
  }

  if (zoneSelect) {
    zones.forEach((zone) => {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = `โซน ${zone}`;
      zoneSelect.appendChild(option);
    });
  }
}

/**
 * อ่านค่าพารามิเตอร์จาก URL (เช่น มาจากการค้นหาหน้า index.html?q=SC-201 หรือ ?type=อาคารเรียน)
 * แล้วนำมาตั้งค่าเริ่มต้นให้ช่องค้นหาและตัวกรอง
 */
function applyUrlQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const queryKeyword = params.get('q') || params.get('keyword');
  const queryType = params.get('type');
  const queryZone = params.get('zone');

  if (queryKeyword && searchInput) {
    searchInput.value = queryKeyword;
  }

  if (queryType && typeSelect) {
    // ตรวจสอบว่ามี option ที่ตรงกับค่าใน URL หรือไม่
    const hasTypeOption = Array.from(typeSelect.options).some(
      (opt) => opt.value.toLowerCase() === queryType.toLowerCase()
    );
    if (hasTypeOption) {
      typeSelect.value = queryType;
    }
  }

  if (queryZone && zoneSelect) {
    const hasZoneOption = Array.from(zoneSelect.options).some(
      (opt) => opt.value.toLowerCase() === queryZone.toLowerCase()
    );
    if (hasZoneOption) {
      zoneSelect.value = queryZone;
    }
  }
}

/**
 * ฟังก์ชันหลักในการประมวลผลการค้นหาและตัวกรอง (F2 + F3)
 * แล้วอัปเดตจำนวนผลลัพธ์ สถานะไม่พบข้อมูล และวาดการ์ดใหม่
 */
async function updateFilteredResults() {
  const criteria = {
    keyword: searchInput ? searchInput.value : '',
    type: typeSelect ? typeSelect.value : 'all',
    zone: zoneSelect ? zoneSelect.value : 'all'
  };

  const filtered = filterPlaces(allPlaces, criteria);

  // อัปเดตข้อความจำนวนผลลัพธ์ (รองรับ Screen Reader ด้วย aria-live)
  if (resultsCountEl) {
    resultsCountEl.textContent = `พบสถานที่ทั้งหมด ${filtered.length} แห่ง (จาก ${allPlaces.length} แห่ง)`;
  }

  // จัดการการแสดงผลกรณีไม่พบข้อมูล (Empty State)
  if (filtered.length === 0) {
    if (emptyStateEl) emptyStateEl.hidden = false;
    if (placesGridEl) placesGridEl.replaceChildren();
    return;
  }

  if (emptyStateEl) emptyStateEl.hidden = true;
  await displayPlaces(filtered);
}

/**
 * ผูก Event Listeners สำหรับการค้นหาและตัวกรอง (T6: ห้ามใช้ inline event)
 */
function bindEvents() {
  // ป้องกันการรีเฟรชหน้าเมื่อกด Enter ในฟอร์มค้นหา
  if (filterForm) {
    filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      updateFilteredResults();
    });

    // เมื่อกดปุ่ม "ล้างตัวกรอง" (type="reset")
    filterForm.addEventListener('reset', () => {
      // ใช้ setTimeout(..., 0) เพื่อรอให้เบราว์เซอร์รีเซ็ตค่าใน input/select เป็นค่าเริ่มต้นก่อนคำนวณใหม่
      setTimeout(() => {
        // ล้างพารามิเตอร์บน URL ออกด้วยเพื่อให้สะอาด
        if (window.location.search) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        updateFilteredResults();
      }, 0);
    });
  }

  // F2: ค้นหาแบบ Real-time ขณะพิมพ์ด้วย event 'input'
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      updateFilteredResults();
    });
  }

  // F3: กรองตามประเภททันทีเมื่อเปลี่ยนตัวเลือก
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      updateFilteredResults();
    });
  }

  // F3: กรองตามโซนทันทีเมื่อเปลี่ยนตัวเลือก
  if (zoneSelect) {
    zoneSelect.addEventListener('change', () => {
      updateFilteredResults();
    });
  }
}

/**
 * ฟังก์ชันเริ่มต้นทำงานเมื่อโหลดหน้า places.html เสร็จ
 */
async function initPlacesPage() {
  try {
    if (errorMessageEl) errorMessageEl.hidden = true;

    // 1. ดึงข้อมูลสถานที่ทั้งหมด (F1, T7)
    const data = await loadPlacesData();
    allPlaces = Array.isArray(data) ? data : [];

    // 2. สร้างตัวเลือกประเภทและโซนจากข้อมูลจริง
    populateFilterOptions(allPlaces);

    // 3. อ่านค่าจาก URL (ถ้าถูกส่งมาจากหน้า index.html)
    applyUrlQueryParams();

    // 4. ผูก Event Listeners
    bindEvents();

    // 5. แสดงผลลัพธ์ครั้งแรก
    await updateFilteredResults();
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่:', error);
    if (resultsCountEl) {
      resultsCountEl.textContent = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    }
    if (errorMessageEl) {
      errorMessageEl.hidden = false;
    }
  }
}

// เริ่มทำงานเมื่อ DOM โหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', initPlacesPage);