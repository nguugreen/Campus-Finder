import { getFavoriteIds, saveFavoriteIds } from './storage.js';

export function isFavorite(id) {
  return getFavoriteIds().includes(Number(id));
}

/** สลับสถานะ แล้วคืนค่าสถานะใหม่ (true = อยู่ในรายการโปรดแล้ว) */
export function toggleFavorite(id) {
  const numericId = Number(id);
  const ids = getFavoriteIds();
  const exists = ids.includes(numericId);
  saveFavoriteIds(exists ? ids.filter((x) => x !== numericId) : [...ids, numericId]);
  return !exists;
}

export function removeFavorite(id) {
  saveFavoriteIds(getFavoriteIds().filter((x) => x !== Number(id)));
}

/** แปลง id ที่บันทึกไว้เป็น object สถานที่จริง (ข้าม id ที่ไม่มีในข้อมูลแล้ว) */
export function getFavoritePlaces(places) {
  const ids = getFavoriteIds();
  return places.filter((p) => ids.includes(p.id));
}