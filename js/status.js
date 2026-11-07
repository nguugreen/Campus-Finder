const CLOSING_SOON_MINUTES = 30; // ไม่บังคับใน spec ถ้าไม่ใช้ให้ตั้งเป็น 0
const MINUTES_PER_DAY = 24 * 60;

/** "08:30" -> 510 */
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** เช็กว่าเปิดอยู่ไหม รองรับกรณีปิดข้ามเที่ยงคืน เช่น 18:00–02:00 */
export function isOpenAt(place, date = new Date()) {
  const now = date.getHours() * 60 + date.getMinutes();
  const open = toMinutes(place.open);
  const close = toMinutes(place.close);

  if (open === close) return true;                    // ตกลงกันในทีมว่า 00:00–00:00 = เปิด 24 ชม.
  if (open < close) return now >= open && now < close; // กรณีปกติ
  return now >= open || now < close;                   // ข้ามเที่ยงคืน
}

/** คืนข้อมูลสำหรับสร้าง badge: { key, label } */
export function getStatus(place, date = new Date()) {
  if (!isOpenAt(place, date)) {
    return { key: 'closed', label: 'ปิดแล้ว' };
  }
  const now = date.getHours() * 60 + date.getMinutes();
  const minutesLeft = (toMinutes(place.close) - now + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  if (place.open !== place.close && minutesLeft > 0 && minutesLeft <= CLOSING_SOON_MINUTES) {
    return { key: 'closing-soon', label: `ใกล้ปิด (อีก ${minutesLeft} นาที)` };
  }
  return { key: 'open', label: 'เปิดอยู่' };
}