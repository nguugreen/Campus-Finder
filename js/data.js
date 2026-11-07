// path อ้างอิงจากไฟล์ HTML ที่อยู่ระดับ root จึงใช้ได้ทั้งบน Live Server และ GitHub Pages
const DATA_URL = 'data/places.json';
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

let placesCache = null;

/** ตรวจว่า object หนึ่งรายการมี field และชนิดข้อมูลถูกต้องตาม spec */
export function isValidPlace(p) {
  return (
    p !== null && typeof p === 'object' &&
    Number.isInteger(p.id) &&
    typeof p.name === 'string' && p.name.trim() !== '' &&
    typeof p.code === 'string' &&
    typeof p.type === 'string' &&
    typeof p.zone === 'string' &&
    Number.isInteger(p.floors) &&
    TIME_PATTERN.test(p.open) &&
    TIME_PATTERN.test(p.close) &&
    Array.isArray(p.facilities) && p.facilities.every((f) => typeof f === 'string') &&
    typeof p.image === 'string' &&
    typeof p.description === 'string'
  );
}

/** โหลดข้อมูลทั้งหมด (fetch แค่ครั้งแรก ครั้งต่อไปคืนค่าจาก cache) */
export async function loadPlaces() {
  if (placesCache) return placesCache;

  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${response.status})`);
  }

  const raw = await response.json();
  if (!Array.isArray(raw)) {
    throw new Error('รูปแบบ places.json ไม่ถูกต้อง: ต้องเป็น Array');
  }

  placesCache = raw.filter((item, index) => {
    const ok = isValidPlace(item);
    if (!ok) console.warn(`places.json: ข้อมูลลำดับที่ ${index} ไม่ถูกต้อง ถูกข้ามไป`, item);
    return ok;
  });

  return placesCache;
}

/** หาสถานที่จาก id (รับได้ทั้ง string จาก query string และ number) */
export async function getPlaceById(id) {
  const places = await loadPlaces();
  const numericId = Number(id);
  return places.find((p) => p.id === numericId) ?? null;
}

/** ดึงค่าที่ไม่ซ้ำของ field หนึ่ง เช่น 'type' หรือ 'zone' เพื่อสร้างตัวกรอง */
export function getUniqueValues(places, key) {
  return [...new Set(places.map((p) => p[key]))].sort((a, b) =>
    String(a).localeCompare(String(b), 'th')
  );
}

/** อ่านพารามิเตอร์จาก URL เช่น place.html?id=3 */
export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}