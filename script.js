/* AniPortal - Massive Engine */

const manualOverrides = {
    // Add fixes here if API is wrong. Example:
    // "Naruto": { images: { jpg: { large_image_url: "link_here" } } }
};

const animeData = [
    "One Piece", "Re:Zero.Starting Life in Another World", "Naruto", 
    "Angel Next Door", "The Eminence in Shadows", "Horimiya", "Tokyo Ghoul", 
    "Zom 100:Bucket List of The Dead", "Heavenly Delusions", "Kingdom of the Ruins", 
    "86", "Another", "Solo Leveling", "Black Butler", "Fire Force", "Tower of God", 
    "Mushoku Tensei:Jobless Reincarnation", "Komi can't Communicate", "Hell's Paradise", 
    "My Tiny Monster", "Kaiju no. 8", "Misfit of the Demon Academy", "The Last Summoner"
    // Add the rest of your 100+ list here!
];

const mangaData = [
    "Domestic Girlfriend", "Rent a Girlfriend", "Kanojo Mo Kanojo", 
    "Wind Breaker", "Uzaki Chan Wants to Hang Out", "Solo Leveling"
    // Add the rest of your manga list here!
];

let currentCategory = 'anime';
let itemsLoaded = 0;
const batchSize = 12; 
let isLoading = false;

// Format dates nicely
function formatDate(dateString) {
    if (!dateString) return "TBA";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Fetch Core Data
async function fetchShowData(title, type) {
    const cacheKey = `aniportal_${type}_${title}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        return { ...JSON.parse(cached), ...(manualOverrides[title] || {}) };
    }

    try {
        await new Promise(res => setTimeout(res, 500)); 
        const response = await fetch(`https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(title)}&limit=1`);
        const data = await response.json();
        
        if (data.data && data.data[0]) {
            localStorage.setItem(cacheKey, JSON.stringify(data.data[0]));
            return { ...data.data[0], ...(manualOverrides[title] || {}) };
        }
    } catch (e) { console.error("API Limit hit", e); }
    return null;
}

// Infinite Scroll Loading
async function loadMoreItems() {
    if (isLoading) return;
    isLoading = true;
    document.getElementById('loading-spinner').style.display = 'block';
    
    const list = currentCategory === 'anime' ? animeData : mangaData;
    const type = currentCategory === 'anime' ? 'anime' : 'manga';
    const nextBatch = list.slice(itemsLoaded, itemsLoaded + batchSize);
    
    for (const title of nextBatch) {
        const item = await fetchShowData(title, type);
        if (item) {
            item.originalTitle = title;
            renderCard(item);
        }
    }
    
    itemsLoaded += batchSize;
    isLoading = false;
    document.getElementById('loading-spinner').style.display = 'none';
}

// Render Card with Status Badges
function renderCard(item) {
    const grid = document.getElementById('main-grid');
    const card = document.createElement('div');
    card.className = 'poster-card';
    card.dataset.title = item.originalTitle.toLowerCase();
    
    let badgeHtml = '';
    if (item.status) {
        let statusClass = 'badge-completed';
        let statusText = 'COMPLETED';
        if (item.status.includes('Currently Airing') || item.status.includes('Publishing')) {
            statusClass = 'badge-ongoing'; statusText = 'ONGOING';
        } else if (item.status.includes('Finished')) {
            statusClass = 'badge-completed'; statusText = 'COMPLETED';
        } else {
            statusClass = 'badge-cancelled'; statusText = item.status.toUpperCase();
        }
        badgeHtml = `<div class="card-badge ${statusClass}">${statusText}</div>`;
    }

    card.innerHTML = `
        ${badgeHtml}
        <img src="${item.images.jpg.large_image_url}" alt="${item.title}" loading="lazy">
        <div class="card-info">
            <h4>${item.originalTitle}</h4>
        </div>
    `;
    card.onclick = () => openModal(item);
    grid.appendChild(card);
}

// Global Search
function searchArchive() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    document.querySelectorAll('.poster-card').forEach(card => {
        card.style.display = card.dataset.title.includes(query) ? 'block' : 'none';
    });
}

// Sidebar Setup
function setupSidebar() {
    const listEl = document.getElementById('rank-list');
    listEl.innerHTML = '';
    const topPicks = currentCategory === 'anime' ? animeData.slice(0, 10) : mangaData.slice(0, 10);
    topPicks.forEach((title, index) => {
        listEl.innerHTML += `<li class="rank-item"><span class="rank-num">${index + 1}</span> <span style="font-weight:600">${title}</span></li>`;
    });
}

// Scroll Event
window.onscroll = function() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        loadMoreItems();
    }
};

function switchCategory(cat) {
    currentCategory = cat;
    itemsLoaded = 0;
    document.getElementById('main-grid').innerHTML = '';
    document.getElementById('category-title').innerText = cat === 'anime' ? 'Anime Archive' : 'Manga Archive';
    document.querySelectorAll('.side-menu li').forEach(li => li.classList.remove('active-tab'));
    document.getElementById(`tab-${cat}`).classList.add('active-tab');
    setupSidebar();
    loadMoreItems();
    toggleMenu();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('active'); }

// Deep Episode Fetch & Modal
async function openModal(item) {
    const modal = document.getElementById('modal');
    
    // Process Genres
    let genresHtml = '';
    if (item.genres) {
        item.genres.forEach(g => genresHtml += `<span class="genre-tag">${g.name}</span>`);
    }

    // Basic Structure
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-flex">
            <img src="${item.images.jpg.large_image_url}" class="modal-img">
            <div class="modal-text">
                <h2>${item.originalTitle}</h2>
                <div class="tags-row">
                    <div class="status-badge">${item.status || 'Unknown'}</div>
                    ${genresHtml}
                </div>
                <p style="color: #a0a6b1; font-size: 0.95rem;">${item.synopsis || 'No description available.'}</p>
                
                <div class="ep-list-container" id="ep-container">
                    <p style="text-align:center; color: #8b949e;">Fetching episode timeline...</p>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'block';

    // Fetch Deep Episodes (Only for Anime)
    const epContainer = document.getElementById('ep-container');
    if (currentCategory === 'anime' && item.mal_id) {
        try {
            const epRes = await fetch(`https://api.jikan.moe/v4/anime/${item.mal_id}/episodes`);
            const epData = await epRes.json();
            
            if (epData.data && epData.data.length > 0) {
                epContainer.innerHTML = `<h4 style="margin-bottom:10px; color:var(--accent);">Episode Timeline</h4>`;
                epData.data.forEach(ep => {
                    const title = ep.title || `Episode ${ep.mal_id}`;
                    const date = formatDate(ep.aired);
                    epContainer.innerHTML += `
                        <div class="ep-item">
                            <span class="ep-title">${ep.mal_id}. ${title}</span>
                            <span class="ep-date">${date}</span>
                        </div>
                    `;
                });
            } else {
                epContainer.innerHTML = `<p style="text-align:center; color: #8b949e;">No detailed episode data found.</p>`;
            }
        } catch(e) {
            epContainer.innerHTML = `<p style="text-align:center; color: #e74c3c;">Failed to load episodes.</p>`;
        }
    } else {
        epContainer.style.display = 'none'; // Hide for manga
    }
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

window.onload = () => { 
    setupSidebar();
    loadMoreItems(); 
};
