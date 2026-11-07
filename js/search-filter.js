export function normalize(text) {
  return String(text ?? '').trim().toLowerCase();
}

/**
 * กรองข้อมูลตามเงื่อนไข (ไม่แก้ไข array ต้นฉบับ)
 * @param {Array} places
 * @param {{ query?: string, type?: string, zone?: string }} criteria  ใช้ 'all' = ไม่กรอง
 */
export function filterPlaces(places, { query = '', type = 'all', zone = 'all' } = {}) {
  const q = normalize(query);
  return places.filter((p) => {
    const matchQuery = !q || normalize(p.name).includes(q) || normalize(p.code).includes(q);
    const matchType = type === 'all' || p.type === type;
    const matchZone = zone === 'all' || p.zone === zone;
    return matchQuery && matchType && matchZone;
  });
}