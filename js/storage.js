export const STORAGE_KEYS = Object.freeze({
  FAVORITES: 'favorites',
  FEEDBACK: 'feedback',
  THEME: 'theme',
});

/** อ่าน JSON จาก localStorage ถ้าข้อมูลเสียหรือไม่มี ให้คืน fallback */
export function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.warn(`อ่าน localStorage "${key}" ไม่สำเร็จ`, error);
    return fallback;
  }
}

/** เขียน JSON ลง localStorage แล้วคืน true/false ตามผลลัพธ์ */
export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`เขียน localStorage "${key}" ไม่สำเร็จ`, error);
    return false;
  }
}

/* ---------- favorites: Array ของ id (number) ---------- */
export function getFavoriteIds() {
  const ids = readJSON(STORAGE_KEYS.FAVORITES, []);
  return Array.isArray(ids) ? ids.filter(Number.isInteger) : [];
}

export function saveFavoriteIds(ids) {
  return writeJSON(STORAGE_KEYS.FAVORITES, [...new Set(ids)]);
}

/* ---------- feedback: Array ของ { type, placeName, message, submittedAt } ---------- */
export function getFeedbackList() {
  const list = readJSON(STORAGE_KEYS.FEEDBACK, []);
  return Array.isArray(list) ? list : [];
}

export function addFeedback({ type, placeName, message }) {
  const entry = {
    type,
    placeName: placeName.trim(),
    message: message.trim(),
    submittedAt: new Date().toISOString(), // ISO 8601 ตาม spec
  };
  const list = getFeedbackList();
  list.push(entry);
  return writeJSON(STORAGE_KEYS.FEEDBACK, list) ? entry : null;
}