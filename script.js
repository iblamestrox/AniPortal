/* AniPortal - Master Update Engine */

const animeData = [
    "One Piece", "Re:Zero.Starting Life in Another World", "Naruto", 
    "Angel Next Door", "The Eminence in Shadows", "Horimiya", "Tokyo Ghoul", 
    "Zom 100:Bucket List of The Dead", "Heavenly Delusions", "Kingdom of the Ruins", 
    "86", "Another", "Solo Leveling", "Black Butler", "Fire Force", "Tower of God", 
    "Mushoku Tensei:Jobless Reincarnation", "Komi can't Communicate", "Hell's Paradise", 
    "My Tiny Monster", "Kaiju no. 8", "Misfit of the Demon Academy", "The Last Summoner", 
    "Cupid Chocolate", "Golden Times", "7th Time Loop", "Tomo Chan is a Girl", 
    "More Than a Married Couple", "Blue Exorcist", "Danger in My Hearts", 
    "Danmachi", "Attack on Titan", "Demon Slayer", "Jujutsu Kaisen", "Chainsaw Man", 
    "Parasyte: The Maxim", "Your Name", "Weathering With You", "Josse, The Tiger and the Fish", 
    "A Silent Voice", "Drifting Home", "Redo of Healer", "That Time I Got Reincarnated as a Slime", 
    "Gate", "Konosuba", "Chilling Life in Another World", "Villainess Lv 99", 
    "Bunny Girl Senpai", "Domestic Girlfriend", "My Dress Up Darling", "Rental Girlfriend", 
    "Kanojo mo Kanojo", "Date a Live", "Spirit Chronicles", "Highschool Babysitters",
    "Shikimori is Not Just a Cutie", "Kubo Won't Let Me Be Invisible", "Shinka No Mi", 
    "Future Diaries", "Scissor Seven", "Kokoro Connect", "Isekai Cheat Magician", 
    "Mission: Yozakura Family", "Ryuzoku The Blazing Dawn", "The New Gate", 
    "The World's Finest Assasin", "I'm Quitting Heroing", "Combatants Will be Dispatched", 
    "Plunderer", "Shironeko Project", "Servamp", "Blood Blockade Battlefront", 
    "I'm Standing On a Million Lives", "Hybrid X Heart Magias Academy", "Arifureta", 
    "The Devil Is a Part Timer", "Love, Chunibyo & Other Delusions", "Tales Of Wedding Rings", 
    "Campione", "Plastic Memories", "The 100 Girlfriends", "Our Dating Story", 
    "A Girl and Her Guard Dog", "Berserk Of Gluttony", "Aesthetica Of a Rogue Hero", 
    "The Demon Sword Master", "The Dreaming Is a Realist", "Engage Kiss", 
    "The Café Terrace and It's Goddesses", "Aura:Koga Maryuin's Last War", 
    "The Tunnel To Summer,The Exit of Goodbyes", "Aharen-San", "Toradora", 
    "Yosuga No Sora", "And You Thought There Was Never a Girl Online", 
    "The Greatest Demon Lord Reincarnates", "The Testament of Sister New Devil", 
    "Clean Freak", "Actually, I Am", "Why The Hell Are You Here Sensei?", 
    "Higehiro", "Fena Pirate Princess", "My Wife Is The Student Council President"
];

const comicData = [
    "Domestic Girlfriend", "Rent a Girlfriend", "Kanojo Mo Kanojo", 
    "More Than a Married Couple But Not lovers", "An Archdemon's Dilemma", 
    "Wind Breaker", "Uzaki Chan Wants to Hang Out", "Kaiju no. 8", 
    "A Couple of Cuckoos", "Solo Leveling", "Omniscient Reader's Viewpoint", 
    "World After The Fall", "The Beginning After The End", "The Greatest Estate Developer", 
    "Reincarnation of The Suicidal Battle God", "Reincarnated Son of The Duke is An Assassin", 
    "Stepmother's Friends", "Revenge of The Iron Blooded Sword Hound", "The Book Eating Magician"
];

let currentItems = [];
let currentCategory = 'anime';

function setupFilters() {
    const azContainer = document.getElementById('az-filter');
    azContainer.innerHTML = `<button class="az-btn active" onclick="filterByLetter('All')">All</button>`;
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        azContainer.innerHTML += `<button class="az-btn" onclick="filterByLetter('${letter}')">${letter}</button>`;
    }
}

async function fetchShowData(title, type) {
    const cacheKey = `aniportal_${type}_${title}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        await new Promise(res => setTimeout(res, 500)); 
        const response = await fetch(`https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(title)}&limit=1`);
        const data = await response.json();
        
        if (data.data && data.data[0]) {
            localStorage.setItem(cacheKey, JSON.stringify(data.data[0]));
            return data.data[0];
        }
    } catch (e) { console.error("API Limit Reached:", e); }
    return null;
}

async function loadLibrary(category) {
    currentCategory = category;
    const list = category === 'anime' ? animeData : comicData;
    const searchType = category === 'anime' ? 'anime' : 'manga'; 
    
    document.getElementById('category-title').innerText = category === 'anime' ? 'Anime Archive' : 'Mangas Archive';
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';
    currentItems = [];
    updateSidebar(list.slice(0, 3)); 

    for (const title of list) {
        const itemInfo = await fetchShowData(title, searchType);
        if (itemInfo) {
            itemInfo.originalTitle = title;
            currentItems.push(itemInfo);
            renderCard(itemInfo);
            
            if (currentItems.length > 3) {
                updateSidebar(list.slice(0, 3), currentItems.slice(3).sort((a,b) => b.score - a.score).slice(0, 7));
            }
        }
    }
}

function renderCard(item) {
    const grid = document.getElementById('main-grid');
    const card = document.createElement('div');
    card.className = 'poster-card';
    card.dataset.title = item.originalTitle.toLowerCase();
    card.innerHTML = `
        <img src="${item.images.jpg.large_image_url}" alt="${item.title}" loading="lazy">
        <div class="card-info">
            <h4>${item.originalTitle}</h4>
            <span class="score">⭐ ${item.score || 'N/A'}</span>
        </div>
    `;
    card.onclick = () => openModal(item);
    grid.appendChild(card);
}

function updateSidebar(top3Titles, sortedOthers = []) {
    const listEl = document.getElementById('rank-list');
    listEl.innerHTML = '';
    top3Titles.forEach((title, index) => {
        listEl.innerHTML += `<li class="rank-item"><span class="rank-num">${index + 1}</span> <span style="font-weight:600">${title}</span></li>`;
    });
    sortedOthers.forEach((item, index) => {
        listEl.innerHTML += `<li class="rank-item"><span class="rank-num" style="background:transparent; border:1px solid #333">${index + 4}</span> <span>${item.originalTitle}</span></li>`;
    });
}

function toggleMenu() { 
    document.getElementById('side-menu').classList.toggle('active'); 
}

function switchCategory(cat) {
    document.querySelectorAll('.side-menu li').forEach(li => li.classList.remove('active-tab'));
    document.getElementById(`tab-${cat}`).classList.add('active-tab');
    toggleMenu();
    loadLibrary(cat);
}

function searchArchive() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    document.querySelectorAll('.poster-card').forEach(card => {
        card.style.display = card.dataset.title.includes(query) ? 'block' : 'none';
    });
}

function filterByLetter(letter) {
    document.querySelectorAll('.az-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.poster-card').forEach(card => {
        card.style.display = (letter === 'All' || card.dataset.title.startsWith(letter.toLowerCase())) ? 'block' : 'none';
    });
}

function openModal(item) {
    const modal = document.getElementById('modal');
    
    // Formatting episodes/chapters based on anime or manga
    const episodesCount = item.episodes ? `${item.episodes} Episodes` : (item.chapters ? `${item.chapters} Chapters` : 'Ongoing');
    const premiereData = item.season ? `Premiered: ${item.season.charAt(0).toUpperCase() + item.season.slice(1)} ${item.year}` : `Released: ${item.published ? item.published.prop.from.year : 'Unknown'}`;

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-flex">
            <img src="${item.images.jpg.large_image_url}" class="modal-img">
            <div class="modal-text">
                <h2>${item.originalTitle}</h2>
                <div class="tags-row">
                    <div class="status-badge">${item.status || 'Unknown'}</div>
                    <div class="ep-badge">${episodesCount}</div>
                    <div class="status-badge">${premiereData}</div>
                </div>
                <p style="margin-bottom: 20px; color: #a0a6b1; line-height: 1.8;">${item.synopsis ? item.synopsis.substring(0, 450) + '...' : 'No description available.'}</p>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

window.onload = () => {
    setupFilters();
    loadLibrary('anime');
};