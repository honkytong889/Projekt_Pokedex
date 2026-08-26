const BASE_URL = "https://pokeapi.co/api/v2";
const MAX_AMOUNT = 1025;
let loadingAmount = 20;
const pokemonDataFetched = {};
const pokemonImageCache = {};
const renderedPokemons = [];
let searchedPokemons = [];

// ==========================================
// INITIALISIERUNG & FETCHING
// ==========================================

async function init() {
    toggleLoadingSpinner(true);

    // Erste 20 Pokémon parallel laden
    await fetchPokemonBatch(1, loadingAmount);

    const initialIDs = Array.from({ length: loadingAmount }, (_, index) => index + 1);
    await renderPokemonCards(initialIDs);

    const pokemonListEl = document.getElementById("PokemonList");
    if (pokemonListEl) pokemonListEl.classList.add("d-flex");

    renderLoadMoreButton(loadingAmount);
    toggleLoadingSpinner(false);

    // Restliche Pokémon im Hintergrund im Cache vorhalten
    fetchPokemonBatch(loadingAmount + 1, MAX_AMOUNT);
}

function toggleLoadingSpinner(show) {
    const spinner = document.getElementById("LoadingSpinner");
    if (!spinner) return;
    spinner.classList.toggle("loading-spinner", show);
}

async function fetchPokemonBatch(start, end) {
    const fetchPromises = [];

    for (let pokeID = start; pokeID <= end && pokeID <= MAX_AMOUNT; pokeID++) {
        if (!pokemonDataFetched[pokeID]) {
            fetchPromises.push(fetchSinglePokemon(pokeID));
        }
    }

    await Promise.all(fetchPromises);
}

async function fetchSinglePokemon(pokeID) {
    try {
        const response = await fetch(`${BASE_URL}/pokemon/${pokeID}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();

        pokemonDataFetched[pokeID] = {
            responsePokemon: data,
            name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
            types: data.types.map(t => t.type.name)
        };
    } catch (error) {
        console.error(`Fehler beim Laden von Pokémon #${pokeID}:`, error);
    }
}

function pushPokemonImageToCache(pokeID, name, type1, type2) {
    return new Promise((resolve, reject) => {
        if (pokemonImageCache[pokeID]) {
            resolve(pokemonImageCache[pokeID]);
            return;
        }

        const img = new Image();
        img.role = "button";
        img.style.background = `linear-gradient(to right top, var(--${type1}) 0 40%, var(--${type2}) 60% 100%)`;
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png`;
        img.alt = name;

        img.onload = () => {
            pokemonImageCache[pokeID] = img;
            resolve(img);
        };
        img.onerror = reject;
    });
}

// ==========================================
// RENDERING LOGIK
// ==========================================

async function renderPokemonCards(currentArray) {
    for (let index = 0; index < currentArray.length; index++) {
        const pokeID = currentArray[index];
        await renderOnePokemonCard(pokeID);
    }
}

async function renderOnePokemonCard(pokeID) {
    const data = pokemonDataFetched[pokeID];
    if (!data) return;

    const { name, types } = data;
    const type1 = types[0];
    const type2 = types.length === 2 ? types[1] : type1;

    const pokeImage = await pushPokemonImageToCache(pokeID, name, type1, type2);

    const listContainer = document.getElementById("PokemonList");
    if (listContainer) {
        listContainer.insertAdjacentHTML("beforeend", templatePokemonCard(pokeID, name));
    }

    const imageContainer = document.getElementById(`Image${pokeID}`);
    if (imageContainer) {
        imageContainer.appendChild(pokeImage);
    }

    renderPokemonTypes(pokeID, types, "Types");

    if (!renderedPokemons.includes(pokeID)) {
        renderedPokemons.push(pokeID);
    }
}

function renderPokemonTypes(pokeID, types, containerIdPrefix) {
    const container = document.getElementById(`${containerIdPrefix}${pokeID}`);
    if (!container) return;

    container.innerHTML = "";
    for (let i = 0; i < types.length; i++) {
        container.innerHTML += templatePokemonTypes(types[i]);
    }
}

function renderLoadMoreButton(amount) {
    const container = document.getElementById("LoadMoreButton");
    if (container) {
        container.innerHTML = templateLoadMoreButton(amount);
    }
}

// ==========================================
// LOAD MORE & EVENT HANDLER
// ==========================================

async function loadMorePokemon() {
    const inputEl = document.getElementById("LoadingAmount");
    const amount = inputEl ? parseInt(inputEl.value) || loadingAmount : loadingAmount;

    const currentCount = renderedPokemons.length;
    const nextStart = currentCount + 1;
    const nextEnd = currentCount + amount;

    toggleLoadingSpinner(true);
    await fetchPokemonBatch(nextStart, nextEnd);

    const nextIDs = Array.from({ length: Math.min(amount, MAX_AMOUNT - currentCount) }, (_, i) => nextStart + i);
    await renderPokemonCards(nextIDs);
    toggleLoadingSpinner(false);
}

function pressEnter(event, action) {
    if (event.key === "Enter") {
        if (action === "loadMore") loadMorePokemon();
        if (action === "search") checkSearchInput();
    }
}

// ==========================================
// OVERLAY & DIALOG LOGIK
// ==========================================

async function showDialog(pokeID) {
    const data = pokemonDataFetched[pokeID];
    if (!data) return;

    const response = data.responsePokemon;
    const name = data.name;
    const types = data.types;
    const type1 = types[0];
    const type2 = types.length === 2 ? types[1] : type1;

    const stats = getPokemonStats(response);

    const overlayHtml = templatePokemonOverlay(
        pokeID,
        name,
        type1,
        type2,
        response.height,
        response.weight,
        stats.hp,
        stats.attack,
        stats.defense
    );

    let dialogContainer = document.getElementById("DialogContainer");
    if (!dialogContainer) {
        dialogContainer = document.createElement("dialog");
        dialogContainer.id = "DialogContainer";
        dialogContainer.className = "pokemon-dialog";
        document.body.appendChild(dialogContainer);
    }

    dialogContainer.innerHTML = overlayHtml;
    renderPokemonTypes(pokeID, types, "TypesOverlay");
    renderPokemonTypes(pokeID, types, "TypesOverlayMobile");

    dialogContainer.showModal();
}

function closeDialog() {
    const dialogContainer = document.getElementById("DialogContainer");
    if (dialogContainer) dialogContainer.close();
}

function renderPreviousOrNextPokemonOverlay(currentID, direction) {
    let nextID = direction === 'next' ? currentID + 1 : currentID - 1;
    if (nextID < 1) nextID = MAX_AMOUNT;
    if (nextID > MAX_AMOUNT) nextID = 1;

    if (pokemonDataFetched[nextID]) {
        showDialog(nextID);
    }
}

function getPokemonStats(data) {
    const stats = { hp: 0, attack: 0, defense: 0 };
    if (!data.stats) return stats;

    data.stats.forEach(s => {
        if (s.stat.name === "hp") stats.hp = s.base_stat;
        if (s.stat.name === "attack") stats.attack = s.base_stat;
        if (s.stat.name === "defense") stats.defense = s.base_stat;
    });
    return stats;
}

// ==========================================
// SEARCH LOGIK
// ==========================================

function checkSearchInput() {
    const searchInput = document.getElementById("Search");
    if (!searchInput) return;

    const query = searchInput.value.trim().toLowerCase();
    const noResultsEl = document.getElementById("NoPokemonsFound");
    const listContainer = document.getElementById("PokemonList");

    if (query.length < 3) {
        showAllLoadedPokemon();
        return;
    }

    searchedPokemons = Object.keys(pokemonDataFetched).filter(id => {
        const poke = pokemonDataFetched[id];
        return poke.name.toLowerCase().includes(query) || id.toString() === query;
    }).map(Number);

    listContainer.innerHTML = "";
    renderedPokemons.length = 0;

    if (searchedPokemons.length === 0) {
        if (noResultsEl) noResultsEl.innerHTML = "<p>No Pokémon found.</p>";
    } else {
        if (noResultsEl) noResultsEl.innerHTML = "";
        renderPokemonCards(searchedPokemons);
    }
}

function showAllLoadedPokemon() {
    const noResultsEl = document.getElementById("NoPokemonsFound");
    const listContainer = document.getElementById("PokemonList");
    const searchInput = document.getElementById("Search");

    if (searchInput) searchInput.value = "";
    if (noResultsEl) noResultsEl.innerHTML = "";
    if (listContainer) listContainer.innerHTML = "";

    renderedPokemons.length = 0;
    const allFetchedIds = Object.keys(pokemonDataFetched).map(Number).sort((a, b) => a - b);
    renderPokemonCards(allFetchedIds);
}