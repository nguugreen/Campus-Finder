

import {
  filterPlaces,
  getUniqueTypes,
  getUniqueZones
} from '../search-filter.js';


let allPlaces = [];


const filterForm = document.getElementById('search-filter-form');
const searchInput = document.getElementById('search-input');
const typeSelect = document.getElementById('type-select');
const zoneSelect = document.getElementById('zone-select');
const resultsCountEl = document.getElementById('results-count');
const errorMessageEl = document.getElementById('error-message');
const emptyStateEl = document.getElementById('empty-state');
const placesGridEl = document.getElementById('places-grid');

/**
 * 
 * @returns {Promise<Array<Object>>}
 */
async function loadPlacesData() {
  try {
    const dataModule = await import('../data.js');
    if (typeof dataModule.fetchPlaces === 'function') {
      return await dataModule.fetchPlaces();
    }
  } catch (err) {

  }


  const response = await fetch('data/places.json');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * 
 *
 * @param {Array<Object>} places - 
 */
async function displayPlaces(places) {
  if (!placesGridEl) return;


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

  }


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
 * 
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


function applyUrlQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const queryKeyword = params.get('q') || params.get('keyword');
  const queryType = params.get('type');
  const queryZone = params.get('zone');

  if (queryKeyword && searchInput) {
    searchInput.value = queryKeyword;
  }

  if (queryType && typeSelect) {

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


async function updateFilteredResults() {
  const criteria = {
    keyword: searchInput ? searchInput.value : '',
    type: typeSelect ? typeSelect.value : 'all',
    zone: zoneSelect ? zoneSelect.value : 'all'
  };

  const filtered = filterPlaces(allPlaces, criteria);


  if (resultsCountEl) {
    resultsCountEl.textContent = `พบสถานที่ทั้งหมด ${filtered.length} แห่ง (จาก ${allPlaces.length} แห่ง)`;
  }


  if (filtered.length === 0) {
    if (emptyStateEl) emptyStateEl.hidden = false;
    if (placesGridEl) placesGridEl.replaceChildren();
    return;
  }

  if (emptyStateEl) emptyStateEl.hidden = true;
  await displayPlaces(filtered);
}


function bindEvents() {

  if (filterForm) {
    filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      updateFilteredResults();
    });


    filterForm.addEventListener('reset', () => {

      setTimeout(() => {

        if (window.location.search) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        updateFilteredResults();
      }, 0);
    });
  }


  if (searchInput) {
    searchInput.addEventListener('input', () => {
      updateFilteredResults();
    });
  }


  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      updateFilteredResults();
    });
  }


  if (zoneSelect) {
    zoneSelect.addEventListener('change', () => {
      updateFilteredResults();
    });
  }
}


async function initPlacesPage() {
  try {
    if (errorMessageEl) errorMessageEl.hidden = true;


    const data = await loadPlacesData();
    allPlaces = Array.isArray(data) ? data : [];


    populateFilterOptions(allPlaces);


    applyUrlQueryParams();


    bindEvents();


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


document.addEventListener('DOMContentLoaded', initPlacesPage);