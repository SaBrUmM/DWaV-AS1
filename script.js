// ============================================
// FILMS DATABASE APPLICATION
// ============================================

// State management
const state = {
    allFilms: [],
    filteredFilms: [],
    searchTerm: '',
    sortKey: null,
    sortOrder: 'asc' // 'asc' or 'desc'
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const sortByYearBtn = document.getElementById('sortByYearBtn');
const sortByBoxOfficeBtn = document.getElementById('sortByBoxOfficeBtn');
const resetBtn = document.getElementById('resetBtn');
const filmsTableBody = document.getElementById('filmsTableBody');
const filmCount = document.getElementById('filmCount');

// ============================================
// FETCH AND LOAD DATA
// ============================================

async function loadFilms() {
    try {
        const response = await fetch('films.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const films = await response.json();
        
        // Validate data
        if (!Array.isArray(films)) {
            throw new Error('Invalid data format: expected array');
        }
        
        // Add rank/index
        state.allFilms = films.map((film, index) => ({
            ...film,
            rank: index + 1
        }));
        
        state.filteredFilms = [...state.allFilms];
        
        console.log(`✅ Loaded ${state.allFilms.length} films`);
        renderTable();
        updateFilmCount();
        
    } catch (error) {
        console.error('Error loading films:', error);
        showError('Failed to load films data. Please refresh the page.');
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function searchFilms(term) {
    state.searchTerm = term.toLowerCase().trim();
    state.sortKey = null; // Reset sort when searching
    
    if (state.searchTerm === '') {
        state.filteredFilms = [...state.allFilms];
    } else {
        state.filteredFilms = state.allFilms.filter(film => {
            const title = (film.title || '').toLowerCase();
            const director = (film.director || '').toLowerCase();
            const country = (film.country || '').toLowerCase();
            
            return title.includes(state.searchTerm) ||
                   director.includes(state.searchTerm) ||
                   country.includes(state.searchTerm);
        });
    }
    
    renderTable();
    updateFilmCount();
    updateButtonStates();
}

// ============================================
// SORTING FUNCTIONALITY
// ============================================

function sortFilms(key) {
    // If clicking the same button, toggle sort order
    if (state.sortKey === key) {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        // New sort key, default to ascending
        state.sortKey = key;
        state.sortOrder = 'asc';
    }
    
    state.filteredFilms.sort((a, b) => {
        let aValue, bValue;
        
        if (key === 'year') {
            aValue = a.release_year || 0;
            bValue = b.release_year || 0;
        } else if (key === 'box_office') {
            aValue = a.box_office || 0;
            bValue = b.box_office || 0;
        }
        
        // Handle null/undefined
        if (aValue === null || aValue === undefined) aValue = 0;
        if (bValue === null || bValue === undefined) bValue = 0;
        
        // Compare
        let comparison = 0;
        if (aValue > bValue) comparison = 1;
        if (aValue < bValue) comparison = -1;
        
        return state.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    renderTable();
    updateButtonStates();
}

// ============================================
// RESET FUNCTIONALITY
// ============================================

function resetAll() {
    state.searchTerm = '';
    state.sortKey = null;
    state.sortOrder = 'asc';
    state.filteredFilms = [...state.allFilms];
    
    searchInput.value = '';
    renderTable();
    updateFilmCount();
    updateButtonStates();
}

// ============================================
// RENDERING
// ============================================

function renderTable() {
    // Clear table
    filmsTableBody.innerHTML = '';
    
    // Handle empty results
    if (state.filteredFilms.length === 0) {
        filmsTableBody.innerHTML = `
            <tr class="no-results">
                <td colspan="6">
                    <p>No films found matching your search.</p>
                    <small>Try a different search term or reset filters.</small>
                </td>
            </tr>
        `;
        return;
    }
    
    // Render each film
    state.filteredFilms.forEach(film => {
        const row = createFilmRow(film);
        filmsTableBody.appendChild(row);
    });
}

function createFilmRow(film) {
    const row = document.createElement('tr');
    
    const boxOffice = formatCurrency(film.box_office);
    const director = film.director || 'N/A';
    const country = film.country || 'N/A';
    
    row.innerHTML = `
        <td class="rank">${film.rank}</td>
        <td class="title">${escapeHtml(film.title)}</td>
        <td class="year">${film.release_year || 'N/A'}</td>
        <td class="director">${escapeHtml(director)}</td>
        <td class="box-office">${boxOffice}</td>
        <td class="country">${escapeHtml(country)}</td>
    `;
    
    return row;
}

function updateFilmCount() {
    const total = state.allFilms.length;
    const showing = state.filteredFilms.length;
    
    if (showing === total) {
        filmCount.textContent = `Showing all ${total} films`;
    } else {
        filmCount.textContent = `Showing ${showing} of ${total} films`;
    }
}

function updateButtonStates() {
    // Update sort button states
    sortByYearBtn.classList.toggle('active', state.sortKey === 'year');
    sortByBoxOfficeBtn.classList.toggle('active', state.sortKey === 'box_office');
    
    // Update button labels with sort direction
    if (state.sortKey === 'year') {
        sortByYearBtn.textContent = state.sortOrder === 'asc' ? '⬆ Year' : '⬇ Year';
        sortByYearBtn.innerHTML = `<span class="sort-icon">${state.sortOrder === 'asc' ? '⬆' : '⬇'}</span> Year`;
    } else {
        sortByYearBtn.innerHTML = `<span class="sort-icon">↕</span> Year`;
    }
    
    if (state.sortKey === 'box_office') {
        sortByBoxOfficeBtn.innerHTML = `<span class="sort-icon">${state.sortOrder === 'asc' ? '⬆' : '⬇'}</span> Box Office`;
    } else {
        sortByBoxOfficeBtn.innerHTML = `<span class="sort-icon">↕</span> Box Office`;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(value) {
    if (!value || value === 0) return 'N/A';
    
    const billion = 1_000_000_000;
    const million = 1_000_000;
    
    if (value >= billion) {
        return '$' + (value / billion).toFixed(2) + 'B';
    } else if (value >= million) {
        return '$' + (value / million).toFixed(0) + 'M';
    } else {
        return '$' + value.toLocaleString();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    filmsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="no-results">
                <p style="color: #e74c3c;">⚠️ ${message}</p>
            </td>
        </tr>
    `;
}

// ============================================
// EVENT LISTENERS
// ============================================

searchInput.addEventListener('input', (e) => {
    searchFilms(e.target.value);
});

sortByYearBtn.addEventListener('click', () => {
    sortFilms('year');
});

sortByBoxOfficeBtn.addEventListener('click', () => {
    sortFilms('box_office');
});

resetBtn.addEventListener('click', resetAll);

// Support Enter key in search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchInput.blur();
    }
});

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application initialized');
    loadFilms();
});
