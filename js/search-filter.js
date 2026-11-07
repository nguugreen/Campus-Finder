

/**
 * 
 * @param {string} text 
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase();
}

/**
 * 
 * 
 * @param {string} text
 * @returns {string}
 */
function stripSeparators(text) {
  return normalizeText(text).replace(/[-\s]/g, '');
}

/**
 * 
 *
 * @param {Object} place 
 * @param {string} keyword 
 * @returns {boolean}
 */
export function matchesKeyword(place, keyword) {
  const cleanKeyword = normalizeText(keyword);
  if (!cleanKeyword) return true; 

  const compactKeyword = stripSeparators(cleanKeyword);


  const nameMatch = normalizeText(place.name).includes(cleanKeyword);
  const descMatch = normalizeText(place.description).includes(cleanKeyword);


  const codeNormalMatch = normalizeText(place.code).includes(cleanKeyword);
  const codeCompactMatch =
    compactKeyword.length > 0 &&
    stripSeparators(place.code).includes(compactKeyword);


  let roomMatch = false;
  if (Array.isArray(place.rooms)) {
    roomMatch = place.rooms.some(
      (room) =>
        normalizeText(room).includes(cleanKeyword) ||
        (compactKeyword.length > 0 &&
          stripSeparators(room).includes(compactKeyword))
    );
  }

  
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
 * 
 * @param {Object} place 
 * @param {string} selectedType 
 * @returns {boolean}
 */
export function matchesType(place, selectedType) {
  const cleanType = normalizeText(selectedType);
  if (!cleanType || cleanType === 'all') return true;

  return normalizeText(place.type) === cleanType;
}

/**
 * 
 * @param {Object} place 
 * @param {string} selectedZone 
 * @returns {boolean}
 */
export function matchesZone(place, selectedZone) {
  const cleanZone = normalizeText(selectedZone);
  if (!cleanZone || cleanZone === 'all') return true;

  return normalizeText(place.zone) === cleanZone;
}

/**
 * 
 *
 * @param {Array<Object>} places 
 * @param {Object} criteria 
 * @param {string} [criteria.keyword=''] 
 * @param {string} [criteria.type='all'] 
 * @param {string} [criteria.zone='all'] 
 * @returns {Array<Object>} 
 */
export function filterPlaces(places, criteria = {}) {
  if (!Array.isArray(places)) return [];

  const { keyword = '', type = 'all', zone = 'all' } = criteria;

  return places.filter((place) => {
    const isKeywordMatch = matchesKeyword(place, keyword);
    const isTypeMatch = matchesType(place, type);
    const isZoneMatch = matchesZone(place, zone);

    
    return isKeywordMatch && isTypeMatch && isZoneMatch;
  });
}

/**
 * 
 *
 * @param {Array<Object>} places 
 * @returns {Array<string>} 
 */
export function getUniqueTypes(places) {
  if (!Array.isArray(places)) return [];
  const types = places
    .map((place) => (place.type ? place.type.trim() : ''))
    .filter((type) => type !== '');
  return [...new Set(types)];
}

/**
 * 
 *
 * @param {Array<Object>} places 
 * @returns {Array<string>} 
 */
export function getUniqueZones(places) {
  if (!Array.isArray(places)) return [];
  const zones = places
    .map((place) => (place.zone ? place.zone.trim() : ''))
    .filter((zone) => zone !== '');
  return [...new Set(zones)].sort((a, b) => a.localeCompare(b, 'th'));
}