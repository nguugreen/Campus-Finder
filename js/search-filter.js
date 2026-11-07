/**
 * js/search-filter.js
 * โมดูลสำหรับค้นหาและกรองสถานที่ (รับผิดชอบโดย สมาชิกคนที่ 3 - Branch: feature/search-filter)
 * รองรับฟีเจอร์ F2 (ค้นหาจากชื่อ/รหัสแบบไม่สนตัวพิมพ์เล็ก-ใหญ่) และ F3 (กรองตามประเภทและโซนร่วมกัน)
 */

/**
 * ฟังก์ชันจัดระเบียบข้อความ (Normalize) สำหรับเปรียบเทียบการค้นหา
 * - แปลงเป็นตัวพิมพ์เล็กทั้งหมด (Case-insensitive)
 * - ตัดช่องว่างหัวท้าย
 * @param {string} text - ข้อความที่ต้องการจัดรูปแบบ
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase();
}

/**
 * ฟังก์ชันตัดขีดและช่องว่างออก เพื่อช่วยให้ค้นหารหัสห้อง/รหัสอาคารได้ยืดหยุ่นขึ้น
 * เช่น พิมพ์ "sc201" หรือ "sc-201" หรือ "sc 201" ก็จะตรงกันทั้งหมด
 * @param {string} text
 * @returns {string}
 */
function stripSeparators(text) {
  return normalizeText(text).replace(/[-\s]/g, '');
}

/**
 * F2: ตรวจสอบว่าสถานที่ตรงกับคำค้นหา (Keyword) หรือไม่
 * ค้นหาครอบคลุม: ชื่อสถานที่ (name), รหัสอาคาร (code), รหัสห้องเรียน (rooms - ถ้ามี),
 * คำอธิบาย (description) และสิ่งอำนวยความสะดวก (facilities)
 *
 * @param {Object} place - ออบเจกต์ข้อมูลสถานที่ 1 แห่งจาก places.json
 * @param {string} keyword - คำค้นหาจากผู้ใช้
 * @returns {boolean}
 */
export function matchesKeyword(place, keyword) {
  const cleanKeyword = normalizeText(keyword);
  if (!cleanKeyword) return true; // ถ้าไม่ได้พิมพ์ค้นหา ให้ถือว่าผ่านเงื่อนไข

  const compactKeyword = stripSeparators(cleanKeyword);

  // 1. ตรวจเช็กจากชื่อสถานที่ (name) และคำอธิบาย (description)
  const nameMatch = normalizeText(place.name).includes(cleanKeyword);
  const descMatch = normalizeText(place.description).includes(cleanKeyword);

  // 2. ตรวจเช็กจากรหัสอาคาร (code) เช่น "SC1" หรือ "sc-1"
  const codeNormalMatch = normalizeText(place.code).includes(cleanKeyword);
  const codeCompactMatch =
    compactKeyword.length > 0 &&
    stripSeparators(place.code).includes(compactKeyword);

  // 3. ตรวจเช็กจากรหัสห้องเรียน (กรณีใน places.json มีฟิลด์ rooms: ["SC-201", ...])
  // หรือกรณีผู้ใช้พิมพ์รหัสห้องเช่น "SC-201" แล้วตรงกับรหัสอาคาร "SC1" / "SC"
  let roomMatch = false;
  if (Array.isArray(place.rooms)) {
    roomMatch = place.rooms.some(
      (room) =>
        normalizeText(room).includes(cleanKeyword) ||
        (compactKeyword.length > 0 &&
          stripSeparators(room).includes(compactKeyword))
    );
  }

  // 4. ตรวจเช็กจากสิ่งอำนวยความสะดวก (facilities) เช่น พิมพ์ "ตู้กดเงิน", "ลิฟต์", "ATM"
  let facilityMatch = false;
  if (Array.isArray(place.facilities)) {
    facilityMatch = place.facilities.some((item) =>
      normalizeText(item).includes(cleanKeyword)
    );
  }

  return (
    nameMatch ||
    codeNormalMatch ||
    codeCompactMatch ||
    roomMatch ||
    facilityMatch ||
    descMatch
  );
}

/**
 * F3: ตรวจสอบว่าสถานที่ตรงกับประเภท (type) ที่เลือกหรือไม่
 * @param {Object} place - ออบเจกต์ข้อมูลสถานที่
 * @param {string} selectedType - ประเภทที่เลือก (ถ้าเป็น '' หรือ 'all' คือแสดงทั้งหมด)
 * @returns {boolean}
 */
export function matchesType(place, selectedType) {
  const cleanType = normalizeText(selectedType);
  if (!cleanType || cleanType === 'all') return true;

  return normalizeText(place.type) === cleanType;
}

/**
 * F3: ตรวจสอบว่าสถานที่ตรงกับโซน (zone) ที่เลือกหรือไม่
 * @param {Object} place - ออบเจกต์ข้อมูลสถานที่
 * @param {string} selectedZone - โซนที่เลือก (ถ้าเป็น '' หรือ 'all' คือแสดงทั้งหมด)
 * @returns {boolean}
 */
export function matchesZone(place, selectedZone) {
  const cleanZone = normalizeText(selectedZone);
  if (!cleanZone || cleanZone === 'all') return true;

  return normalizeText(place.zone) === cleanZone;
}

/**
 * F2 + F3: ฟังก์ชันหลักสำหรับกรองรายการสถานที่ด้วยหลายเงื่อนไขพร้อมกัน
 * ใช้ Array.prototype.filter() ร่วมกับเงื่อนไข keyword, type และ zone
 *
 * @param {Array<Object>} places - รายการสถานที่ทั้งหมดจาก places.json
 * @param {Object} criteria - เงื่อนไขการกรอง
 * @param {string} [criteria.keyword=''] - คำค้นหา (ชื่อ/รหัสอาคาร/รหัสห้อง)
 * @param {string} [criteria.type='all'] - ประเภทสถานที่ (เช่น "อาคารเรียน", "จุดบริการ")
 * @param {string} [criteria.zone='all'] - โซนของมหาวิทยาลัย (เช่น "A", "B", "C")
 * @returns {Array<Object>} รายการสถานที่ที่ผ่านการกรองทั้งหมด
 */
export function filterPlaces(places, criteria = {}) {
  if (!Array.isArray(places)) return [];

  const { keyword = '', type = 'all', zone = 'all' } = criteria;

  return places.filter((place) => {
    const isKeywordMatch = matchesKeyword(place, keyword);
    const isTypeMatch = matchesType(place, type);
    const isZoneMatch = matchesZone(place, zone);

    // ต้องผ่านทั้ง 3 เงื่อนไข (AND logic) เพื่อให้ค้นหาร่วมกับตัวกรองได้ตามข้อกำหนด F3
    return isKeywordMatch && isTypeMatch && isZoneMatch;
  });
}

/**
 * ฟังก์ชันช่วยดึงรายการประเภท (types) ทั้งหมดที่มีใน JSON แบบไม่ซ้ำกัน
 * เพื่อนำไปสร้าง <option> ใน <select> อัตโนมัติด้วย DOM
 *
 * @param {Array<Object>} places - รายการสถานที่ทั้งหมด
 * @returns {Array<string>} รายการประเภทที่ไม่ซ้ำกัน
 */
export function getUniqueTypes(places) {
  if (!Array.isArray(places)) return [];
  const types = places
    .map((place) => (place.type ? place.type.trim() : ''))
    .filter((type) => type !== '');
  return [...new Set(types)];
}

/**
 * ฟังก์ชันช่วยดึงรายการโซน (zones) ทั้งหมดที่มีใน JSON แบบไม่ซ้ำกันและเรียงตามตัวอักษร
 * เพื่อนำไปสร้าง <option> ใน <select> หรือปุ่มเลือกโซนอัตโนมัติ
 *
 * @param {Array<Object>} places - รายการสถานที่ทั้งหมด
 * @returns {Array<string>} รายการโซนที่เรียงลำดับแล้ว
 */
export function getUniqueZones(places) {
  if (!Array.isArray(places)) return [];
  const zones = places
    .map((place) => (place.zone ? place.zone.trim() : ''))
    .filter((zone) => zone !== '');
  return [...new Set(zones)].sort((a, b) => a.localeCompare(b, 'th'));
}