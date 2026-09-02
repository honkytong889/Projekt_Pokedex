const BASE_URL = "https://pokeapi.co/api/v2";
const MAX_AMOUNT = 1025;
let loadingAmount = 20;
const pokemonDataFetched = {};
const pokemonImageCache = {};
const renderedPokemons = [];
let searchedPokemons = [];
let dialogArray = [];

// ==========================================
// INITIALIZATION & FETCHING
// ==========================================

async function init() {
    toggleLoadingSpinner(true);

    // Fetch initial batch
    await fetchPokemonBatch(1, loadingAmount);

    const initialIDs = Array.from({ length: loadingAmount }, (_, index) => index + 1);
    await renderPokemonCards(initialIDs);

    const pokemonListEl = document.getElementById("PokemonList");
    if (pokemonListEl) pokemonListEl.classList.add("d-flex");

    renderLoadMoreButton(loadingAmount);
    toggleLoadingSpinner(false);

    // Prefetch remaining data in the background
    fetchPokemonBatch(loadingAmount + 1, MAX_AMOUNT);
}

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
        console.error(`Error loading Pokémon #${pokeID}:`, error);
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
// RENDERING LOGIC
// ==========================================

async function renderPokemonCards(currentArray) {
    for (let index = 0; index < currentArray.length; index++) {
        await renderOnePokemonCard(currentArray[index]);
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

    container.innerHTML = types.map(type => templatePokemonTypes(type)).join("");
}

function renderLoadMoreButton(amount) {
    const container = document.getElementById("LoadMoreButton");
    if (container) {
        container.innerHTML = templateLoadMoreButton(amount);
    }
}

// ==========================================
// EVENT HANDLERS
// ==========================================

async function loadMorePokemon() {
    const inputEl = document.getElementById("LoadingAmount");
    const amount = inputEl ? parseInt(inputEl.value) || loadingAmount : loadingAmount;

    const currentCount = renderedPokemons.length;
    const nextStart = currentCount + 1;

    if (currentCount >= MAX_AMOUNT) {
        const buttonContainer = document.getElementById("LoadMoreButton");
        if (buttonContainer) {
            buttonContainer.innerHTML = `You have already loaded all ${MAX_AMOUNT} Pokémon.`;
        }
        return;
    }

    toggleLoadingSpinner(true);
    await fetchPokemonBatch(nextStart, nextStart + amount - 1);

    const nextIDs = Array.from(
        { length: Math.min(amount, MAX_AMOUNT - currentCount) },
        (_, i) => nextStart + i
    );
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
// OVERLAY & DIALOG LOGIC
// ==========================================

async function showDialog(pokeID) {
    dialogArray = searchedPokemons.length === 0 ? renderedPokemons : searchedPokemons;

    const dialog = document.getElementById("Dialog");
    if (!dialog) return;

    dialog.showModal();
    await renderPokemonOverlay(pokeID);
}

async function renderPokemonOverlay(pokeID) {
    const data = pokemonDataFetched[pokeID];
    if (!data) return;

    const { name, types, responsePokemon } = data;
    const type1 = types[0];
    const type2 = types.length === 2 ? types[1] : type1;

    const height = (responsePokemon.height / 10).toFixed(1).replace(".", ",") + " m";
    const weight = (responsePokemon.weight / 10).toFixed(1).replace(".", ",") + " kg";
    const stats = getPokemonStats(responsePokemon);

    const overlayContainer = document.getElementById("PokemonOverlay");
    if (overlayContainer) {
        overlayContainer.innerHTML = templatePokemonOverlay(
            pokeID, name, type1, type2, height, weight, stats.hp, stats.attack, stats.defense
        );
    }

    toggleLoadingSpinnerOverlay(true);

    renderPokemonTypes(pokeID, types, "TypesOverlay");
    renderPokemonTypes(pokeID, types, "TypesOverlayMobile");

    await renderEvolutionChain(pokeID);

    toggleLoadingSpinnerOverlay(false);
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

// ==========================================
// EVOLUTION CHAIN LOGIC
// ==========================================

async function renderEvolutionChain(pokeID) {
    await checkEvolutionChainLoaded(pokeID);
    const chain = pokemonDataFetched[pokeID]?.evolutionChain || [];
    const container = document.getElementById(`EvolutionChain${pokeID}`);
    if (!container) return;

    if (chain.length <= 1) {
        container.innerHTML = "<p>This Pokémon has no evolution chain.</p>";
        return;
    }

    container.innerHTML = "";
    for (const chainPokeID of chain) {
        if (!pokemonDataFetched[chainPokeID]) {
            await fetchSinglePokemon(chainPokeID);
        }

        const chainData = pokemonDataFetched[chainPokeID];
        if (chainData) {
            const { name, types } = chainData;
            const type1 = types[0];
            const type2 = types.length === 2 ? types[1] : type1;
            container.innerHTML += templateEvolutionChain(chainPokeID, name, type1, type2);
        }
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
        const speciesData = await speciesRes.json();

        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();

        addEvolutionDataToPokemonData(pokeID, evoData);
    } catch (error) {
        console.error(`Failed to fetch evolution chain for #${pokeID}:`, error);
    }
}

function addEvolutionDataToPokemonData(pokeID, evoData) {
    const evolutionChain = [];

    const getIDFromUrl = (url) => {
        const parts = url.split("/").filter(Boolean);
        return parseInt(parts[parts.length - 1]);
    };

    if (evoData.chain) {
        evolutionChain.push(getIDFromUrl(evoData.chain.species.url));

        if (evoData.chain.evolves_to.length > 0) {
            evolutionChain.push(getIDFromUrl(evoData.chain.evolves_to[0].species.url));

            if (evoData.chain.evolves_to[0].evolves_to.length > 0) {
                evolutionChain.push(getIDFromUrl(evoData.chain.evolves_to[0].evolves_to[0].species.url));
            }
        }
    }

    evolutionChain.forEach(id => {
        if (pokemonDataFetched[id]) {
            pokemonDataFetched[id].evolutionChain = evolutionChain;
        }
    });
}

// ==========================================
// SEARCH LOGIC
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

    searchedPokemons = Object.keys(pokemonDataFetched)
        .filter(id => {
            const poke = pokemonDataFetched[id];
            return poke.name.toLowerCase().includes(query) || id.toString() === query;
        })
        .map(Number);

    if (listContainer) listContainer.innerHTML = "";
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
    searchedPokemons = [];
    const allFetchedIds = Object.keys(pokemonDataFetched).map(Number).sort((a, b) => a - b);
    renderPokemonCards(allFetchedIds);
}
