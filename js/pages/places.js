import { loadPlaces, getUniqueValues, getQueryParam } from '../data.js';
import { filterPlaces } from '../search-filter.js';
import { renderPlaceList, renderOptions, bindFavoriteButtons, refreshStatusBadges } from '../render.js';
import { toggleFavorite } from '../favorites.js';

async function init() {
  const list = document.querySelector('#place-list');
  const searchInput = document.querySelector('#search');
  const typeSelect = document.querySelector('#filter-type');
  const zoneSelect = document.querySelector('#filter-zone');
  const resultCount = document.querySelector('#result-count'); // ใส่ aria-live="polite" ใน HTML

  const places = await loadPlaces();
  renderOptions(typeSelect, getUniqueValues(places, 'type'));
  renderOptions(zoneSelect, getUniqueValues(places, 'zone'));

  // รับค่าที่ส่งมาจากหน้าแรก
  searchInput.value = getQueryParam('q') ?? '';
  typeSelect.value = getQueryParam('type') ?? 'all';

  const update = () => {
    const result = filterPlaces(places, {
      query: searchInput.value,
      type: typeSelect.value,
      zone: zoneSelect.value,
    });
    renderPlaceList(list, result);
    resultCount.textContent = `พบ ${result.length} แห่ง`;
  };

  searchInput.addEventListener('input', update); // real-time
  typeSelect.addEventListener('change', update);
  zoneSelect.addEventListener('change', update);
  bindFavoriteButtons(list, toggleFavorite);
  setInterval(() => refreshStatusBadges(places), 60_000);

  update();
}

init();