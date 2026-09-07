const BASE_URL = "https://pokeapi.co/api/v2";
const MAX_AMOUNT = 1025;
let loadingAmount = 20;
const pokemonDataFetched = {};
const pokemonImageCache = {};
const renderedPokemons = [];
let searchedPokemons = [];
let dialogArray = [];
let searchTimeout = null;
let preSearchRenderedState = [];


// APPLICATION INITIALIZATION

async function init() {
    setupDialogListeners();
    toggleLoadingSpinner(true);
    const success = await loadInitialPokemonBatch();
    if (!success) {
        handleInitError();
        return;
    }
    const initialIDs = createIdArray(1, loadingAmount);
    await renderPokemonCards(initialIDs);
    showPokemonListContainer();
    renderLoadMoreButton(loadingAmount);
    toggleLoadingSpinner(false);
    prefetchRemainingPokemonInBackground();
}

function handleInitError() {
    showGlobalErrorMessage("Fehler beim Laden der ersten Pokémon. Bitte versuche es später noch einmal.");
    toggleLoadingSpinner(false);
}

async function loadInitialPokemonBatch() {
    try {
        await fetchPokemonBatch(1, loadingAmount);
        return true;
    } catch (error) {
        console.error("Failed to load initial batch:", error);
        return false;
    }
}

function prefetchRemainingPokemonInBackground() {
    fetchPokemonBatch(loadingAmount + 1, MAX_AMOUNT).catch(err => {
        console.warn("Background prefetch hit an issue:", err);
    });
}

function showPokemonListContainer() {
    const pokemonListEl = document.getElementById("PokemonList");
    if (pokemonListEl) pokemonListEl.classList.add("d-flex");
}

function createIdArray(start, count) {
    return Array.from({ length: count }, (_, index) => start + index);
}


// UI SPINNER & FEEDBACK HANDLERS

function toggleLoadingSpinner(show) {
    const spinner = document.getElementById("LoadingSpinner");
    if (!spinner) return;
    spinner.classList.toggle("d-none", !show);
    spinner.classList.toggle("loading-spinner", show);
}

function toggleLoadingSpinnerOverlay(show) {
    const spinner = document.getElementById("LoadingSpinnerOverlay");
    if (!spinner) return;
    spinner.classList.toggle("d-none", !show);
    spinner.classList.toggle("loading-spinner", show);
}

function showGlobalErrorMessage(message) {
    const listContainer = document.getElementById("PokemonList");
    if (listContainer) {
        listContainer.innerHTML = `<div class="error-message-box"><p>${message}</p></div>`;
    }
    const loadMoreBtn = document.getElementById("LoadMoreButton");
    if (loadMoreBtn) loadMoreBtn.innerHTML = "";
}


// FETCHING LOGIC & DATA CACHING

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
        saveFetchedPokemonData(pokeID, data);
    } catch (error) {
        console.error(`Error loading Pokémon #${pokeID}:`, error);
        throw error;
    }
}

function saveFetchedPokemonData(pokeID, data) {
    pokemonDataFetched[pokeID] = {
        id: pokeID,
        responsePokemon: data,
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        types: data.types.map(t => t.type.name),
        evolutionChain: pokemonDataFetched[pokeID]?.evolutionChain || null
    };
}

function pushPokemonImageToCache(pokeID, name) {
    return new Promise((resolve, reject) => {
        if (pokemonImageCache[pokeID]) {
            resolve(pokemonImageCache[pokeID]);
            return;
        }
        const img = new Image();
        img.role = "button";
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png`;
        img.alt = name;
        img.onload = () => {
            pokemonImageCache[pokeID] = img;
            resolve(img);
        };
        img.onerror = reject;
    });
}


// RENDERING LOGIC (Parallelisiert für maximale Performance)

async function renderPokemonCards(currentArray) {
    const renderPromises = currentArray.map(pokeID => renderOnePokemonCard(pokeID));
    await Promise.all(renderPromises);
}

async function renderOnePokemonCard(pokeID) {
    const data = pokemonDataFetched[pokeID];
    if (!data) return;

    try {
        const pokeImage = await pushPokemonImageToCache(pokeID, data.name);
        appendCardToDom(pokeID, data.name, pokeImage, data.types);
        trackRenderedPokemon(pokeID);
    } catch (err) {
        console.error(`Failed rendering card #${pokeID}:`, err);
    }
}

function appendCardToDom(pokeID, name, pokeImage, types) {
    const listContainer = document.getElementById("PokemonList");
    if (listContainer) {
        listContainer.insertAdjacentHTML("beforeend", templatePokemonCard(pokeID, name));
    }
    const imageContainer = document.getElementById(`Image${pokeID}`);
    if (imageContainer) {
        imageContainer.appendChild(pokeImage);
    }
    renderPokemonTypes(pokeID, types, "Types");
}

function trackRenderedPokemon(pokeID) {
    if (!renderedPokemons.includes(pokeID)) {
        renderedPokemons.push(pokeID);
    }
}

function renderPokemonTypes(pokeID, types, containerIdPrefix) {
    const container = document.getElementById(`${containerIdPrefix}${pokeID}`);
    if (!container) return;
    container.innerHTML = types.map(type => templatePokemonTypes(type)).join("");
}

function renderLoadMoreButton(amount) {
    const container = document.getElementById("LoadMoreButton");
    if (container) {
        container.innerHTML = templateLoadMoreButton(amount);
    }
}


// EVENT HANDLERS & BUTTONS

async function loadMorePokemon() {
    const inputEl = document.getElementById("LoadingAmount");
    const amount = inputEl ? parseInt(inputEl.value) || loadingAmount : loadingAmount;
    const currentCount = renderedPokemons.length;

    if (currentCount >= MAX_AMOUNT) {
        handleMaxReachedUI();
        return;
    }
    await executeLoadMore(currentCount, amount);
}

async function executeLoadMore(currentCount, amount) {
    const nextStart = currentCount + 1;
    toggleLoadingSpinner(true);
    try {
        await fetchPokemonBatch(nextStart, nextStart + amount - 1);
        const countToFetch = Math.min(amount, MAX_AMOUNT - currentCount);
        await renderPokemonCards(createIdArray(nextStart, countToFetch));
    } catch (err) {
        showGlobalErrorMessage("Fehler beim Nachladen neuer Pokémon.");
    } finally {
        toggleLoadingSpinner(false);
    }
}

function handleMaxReachedUI() {
    const buttonContainer = document.getElementById("LoadMoreButton");
    if (buttonContainer) {
        buttonContainer.innerHTML = `<p>Alle ${MAX_AMOUNT} Pokémon geladen.</p>`;
    }
}

function pressEnter(event, action) {
    if (event.key !== "Enter") return;
    if (action === "loadMore") loadMorePokemon();
    if (action === "search") checkSearchInput();
}


// OVERLAY, DIALOG & LIGHT DISMISS

function setupDialogListeners() {
    const dialog = document.getElementById("Dialog");
    if (!dialog) return;

    dialog.addEventListener("click", (event) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
            rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX && event.clientX <= rect.left + rect.width
        );
        if (!isInDialog) dialog.close();
    });
}

async function showDialog(pokeID) {
    dialogArray = searchedPokemons.length > 0 ? searchedPokemons : renderedPokemons;
    const dialog = document.getElementById("Dialog");
    if (!dialog) return;

    dialog.showModal();
    await renderPokemonOverlay(pokeID);
}

async function renderPokemonOverlay(pokeID) {
    const data = pokemonDataFetched[pokeID];
    if (!data) return;

    const formattedData = formatOverlayData(data);
    updateOverlayTemplate(pokeID, formattedData);

    toggleLoadingSpinnerOverlay(true);
    renderPokemonTypes(pokeID, data.types, "TypesOverlay");
    renderPokemonTypes(pokeID, data.types, "TypesOverlayMobile");
    await renderEvolutionChain(pokeID);
    toggleLoadingSpinnerOverlay(false);
}

function updateOverlayTemplate(pokeID, formattedData) {
    const overlayContainer = document.getElementById("PokemonOverlay");
    if (overlayContainer) {
        overlayContainer.innerHTML = templatePokemonOverlay(
            pokeID, formattedData.name, formattedData.type1, formattedData.type2,
            formattedData.height, formattedData.weight,
            formattedData.stats.hp, formattedData.stats.attack, formattedData.stats.defense
        );
    }
}

function formatOverlayData(data) {
    const { name, types, responsePokemon } = data;
    return {
        name,
        type1: types[0],
        type2: types.length === 2 ? types[1] : types[0],
        height: (responsePokemon.height / 10).toFixed(1).replace(".", ",") + " m",
        weight: (responsePokemon.weight / 10).toFixed(1).replace(".", ",") + " kg",
        stats: getPokemonStats(responsePokemon)
    };
}

function closeDialog() {
    const dialog = document.getElementById("Dialog");
    if (dialog) dialog.close();
}

async function renderPreviousOrNextPokemonOverlay(currentID, direction) {
    if (dialogArray.length === 0) return;
    const currentIndex = dialogArray.indexOf(currentID);
    let targetIndex;

    if (direction === "next") {
        targetIndex = (currentIndex + 1) % dialogArray.length;
    } else {
        targetIndex = (currentIndex - 1 + dialogArray.length) % dialogArray.length;
    }
    await renderPokemonOverlay(dialogArray[targetIndex]);
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


// EVOLUTION CHAIN LOGIC

async function renderEvolutionChain(pokeID) {
    await checkEvolutionChainLoaded(pokeID);
    const chain = pokemonDataFetched[pokeID]?.evolutionChain || [];
    const container = document.getElementById(`EvolutionChain${pokeID}`);
    if (!container) return;

    if (chain.length <= 1) {
        container.innerHTML = "<p>Keine weiteren Entwicklungsstufen.</p>";
        return;
    }
    container.innerHTML = "";
    for (const chainPokeID of chain) {
        await renderSingleEvolutionMember(chainPokeID, container);
    }
}

async function renderSingleEvolutionMember(chainPokeID, container) {
    if (!pokemonDataFetched[chainPokeID]) {
        try { await fetchSinglePokemon(chainPokeID); }
        catch (e) { return; }
    }
    const chainData = pokemonDataFetched[chainPokeID];
    if (chainData) {
        const type1 = chainData.types[0];
        const type2 = chainData.types.length === 2 ? chainData.types[1] : type1;
        container.innerHTML += templateEvolutionChain(chainPokeID, chainData.name, type1, type2);
    }
}

async function checkEvolutionChainLoaded(pokeID) {
    if (pokemonDataFetched[pokeID] && !pokemonDataFetched[pokeID].evolutionChain) {
        await getEvolutionChain(pokeID);
    }
}

async function getEvolutionChain(pokeID) {
    try {
        const speciesRes = await fetch(`${BASE_URL}/pokemon-species/${pokeID}`);
        if (!speciesRes.ok) return;
        const speciesData = await speciesRes.json();

        const evoRes = await fetch(speciesData.evolution_chain.url);
        if (!evoRes.ok) return;
        const evoData = await evoRes.json();
        addEvolutionDataToPokemonData(pokeID, evoData);
    } catch (error) {
        console.error(`Failed to fetch evolution chain for #${pokeID}:`, error);
    }
}

function addEvolutionDataToPokemonData(pokeID, evoData) {
    const evolutionChain = extractEvolutionChainIds(evoData);
    evolutionChain.forEach(id => {
        if (!pokemonDataFetched[id]) {
            pokemonDataFetched[id] = { evolutionChain };
        } else {
            pokemonDataFetched[id].evolutionChain = evolutionChain;
        }
    });
}

function extractEvolutionChainIds(evoData) {
    const chain = [];
    const getID = (url) => parseInt(url.split("/").filter(Boolean).pop());
    if (!evoData.chain) return chain;

    chain.push(getID(evoData.chain.species.url));
    if (evoData.chain.evolves_to.length > 0) {
        chain.push(getID(evoData.chain.evolves_to[0].species.url));
        if (evoData.chain.evolves_to[0].evolves_to.length > 0) {
            chain.push(getID(evoData.chain.evolves_to[0].evolves_to[0].species.url));
        }
    }
    return chain;
}


// SEARCH & RESET LOGIC

function checkSearchInput() {
    const searchInput = document.getElementById("Search");
    if (!searchInput) return;
    const query = searchInput.value.trim().toLowerCase();
    const noResultsEl = document.getElementById("NoPokemonsFound");
    if (searchTimeout) clearTimeout(searchTimeout);

    if (query.length < 3) {
        showShortSearchWarning(noResultsEl);
        return;
    }

    if (noResultsEl) noResultsEl.classList.remove("show");
    executePokemonSearch(query, noResultsEl);
}

function handleSearchQuery(query, noResultsEl) {
    if (query.length < 3) {
        showShortSearchWarning(noResultsEl);
        return;
    }
    if (noResultsEl) noResultsEl.classList.remove("show");
    executePokemonSearch(query, noResultsEl);
}

function showShortSearchWarning(noResultsEl) {
    if (!noResultsEl) return;
    noResultsEl.innerText = "Bitte gib mindestens 3 Zeichen ein...";
    noResultsEl.classList.add("show");
    searchTimeout = setTimeout(() => noResultsEl.classList.remove("show"), 2000);
}

function executePokemonSearch(query, noResultsEl) {
    if (preSearchRenderedState.length === 0 && renderedPokemons.length > 0) {
        preSearchRenderedState = [...renderedPokemons];
    }

    const filteredResults = filterPokemonsByQuery(query, Object.keys(pokemonDataFetched).map(Number));
    resetListContainerAndState();
    searchedPokemons = filteredResults;

    if (searchedPokemons.length === 0 && noResultsEl) {
        noResultsEl.innerText = "Keine Pokémon gefunden.";
        noResultsEl.classList.add("show");
    } else {
        renderPokemonCards(searchedPokemons);
    }
}

function filterPokemonsByQuery(query, sourceList) {
    return sourceList.filter(id => {
        if (!id) return false;
        const poke = pokemonDataFetched[id];
        if (!poke || !poke.name) return false;

        const nameMatch = poke.name.toLowerCase().includes(query);
        const idMatch = poke.id !== undefined ? poke.id.toString() === query : id.toString() === query;

        return nameMatch || idMatch;
    });
}

function resetListContainerAndState() {
    const listContainer = document.getElementById("PokemonList");
    if (listContainer) listContainer.innerHTML = "";
    renderedPokemons.length = 0;
    searchedPokemons = [];
}

function showAllLoadedPokemon() {
    const noResultsEl = document.getElementById("NoPokemonsFound");
    const searchInput = document.getElementById("Search");

    if (searchInput) searchInput.value = "";
    if (noResultsEl) noResultsEl.classList.remove("show");

    const idsToRestore = preSearchRenderedState.length > 0 ? [...preSearchRenderedState] : [1];
    preSearchRenderedState = [];
    resetListContainerAndState();

    renderPokemonCards(idsToRestore);
}