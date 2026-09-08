const BASE_URL = "https://pokeapi.co/api/v2";
const MAX_AMOUNT = 1025;
let loadingAmount = 20;
const pokemonDataFetched = {};
const pokemonImageCache = {};
const renderedPokemons = [];
let searchedPokemons = [];
let dialogArray = [];

async function init() {
    toggleSpinner('LoadingSpinner', true);
    await fetchAllInitialData();
    await renderPokemonCards(Object.keys(pokemonDataFetched).map(Number));
    document.getElementById('PokemonList').classList.add("d-flex");
    await renderLoadMoreButton(loadingAmount);
    toggleSpinner('LoadingSpinner', false);
    await getPokemonsData("id", loadingAmount + 1, MAX_AMOUNT - loadingAmount);
}

async function fetchAllInitialData() {
    await getPokemonsData("id", 1, loadingAmount);
    await getPokemonsData("name", 1, loadingAmount);
    await getPokemonsData("type", 1, loadingAmount);
}

async function getPokemonsData(data, start, end) {
    for (let pokeID = start; (pokeID < (start + end)) && (pokeID <= MAX_AMOUNT); pokeID++) {
        if (data == "id") await getOnePokemonId(pokeID);
        if (data == "name" && !checkPokemonDataIsLoaded(data, pokeID)) {
            await getOnePokemonName(pokeID);
        }
        if (data == "type" && !checkPokemonDataIsLoaded(data, pokeID)) {
            await getOnePokemonType(pokeID);
        }
    }
}

async function getOnePokemonId(pokeID) {
    pokemonDataFetched[pokeID] = {};
}

async function getOnePokemonName(pokeID) {
    const response = await fetch(`${BASE_URL}/pokemon/${pokeID}`);
    const data = await response.json();
    pokemonDataFetched[pokeID].responsePokemon = data;
    pokemonDataFetched[pokeID].name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
}

async function getOnePokemonType(pokeID) {
    const types = [];
    const sourceTypes = pokemonDataFetched[pokeID].responsePokemon.types;
    for (let i = 0; i < sourceTypes.length; i++) {
        types.push(sourceTypes[i].type.name);
    }
    pokemonDataFetched[pokeID].types = types;
}

function pushPokemonImageToCache(pokeID, name) {
    return new Promise((resolve, reject) => {
        if (pokemonImageCache[pokeID]) return resolve(pokemonImageCache[pokeID]);
        const img = new Image();
        img.role = `button`;
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png`;
        img.alt = name;
        img.onload = () => { pokemonImageCache[pokeID] = img; resolve(img); };
        img.onerror = reject;
    });
}

async function renderPokemonCards(currentArray) {
    for (let index = 0; index < currentArray.length; index++) {
        await renderOnePokemonCard(currentArray[index]);
    }
}

async function renderOnePokemonCard(pokeID) {
    const { name, types } = pokemonDataFetched[pokeID];
    const pokeImage = await pushPokemonImageToCache(pokeID, name);
    appendHTML('PokemonList', templatePokemonCard(pokeID, name));
    document.getElementById(`Image${pokeID}`).appendChild(pokeImage);
    await renderPokemonTypes(pokeID, types, 'Types');
    if (!renderedPokemons.includes(pokeID)) renderedPokemons.push(pokeID);
}

function renderPokemonTypes(pokeID, types, typesID) {
    for (let i = 0; i < types.length; i++) {
        appendHTML(`${typesID}${pokeID}`, templatePokemonTypes(types[i]));
    }
}

function clearPokemonList() {
    document.getElementById('PokemonList').innerHTML = "";
}

function checkPokemonDataIsLoaded(data, pokeID) {
    return pokemonDataFetched[pokeID].hasOwnProperty(data);
}

function checkForLoadMoreButton() {
    if (renderedPokemons.length < MAX_AMOUNT) {
        renderLoadMoreButton(loadingAmount);
    } else {
        renderMessageMaxAmount();
    }
}

function pressEnter(event, task) {
    if (event.key == "Enter" && task == "search") checkSearchInput();
    if (event.key == "Enter" && task == "loadMore") loadMorePokemon();
}

async function checkSearchInput() {
    const searchInput = document.getElementById('Search');
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 3) {
        clearPokemonList();
        renderMessageMinLetters();
        renderShowAllLoadedPokemonButton();
        searchInput.value = "";
        return;
    }
    toggleSpinner('LoadingSpinner', true);
    prepareSearchExecution();
    try {
        await searchForPokemon(q);
        renderShowAllLoadedPokemonButton();
        searchInput.value = "";
    } catch (err) {
        renderApiErrorMessage("API konnte nicht geladen werden.");
    } finally {
        toggleSpinner('LoadingSpinner', false);
    }
}

function handleInvalidSearchInput() {
    clearPokemonList();
    removeLoadMoreShowAllButton();
    renderMessageMinLetters();
}

function prepareSearchExecution() {
    removeLoadMoreShowAllButton();
    clearPokemonList();
    clearMessageMinLetters();
}

async function searchForPokemon(searchInput) {
    searchedPokemons = [];
    clearMessageMinLetters();
    for (let pokeID = 1; pokeID <= renderedPokemons.length; pokeID++) {
        if (pokemonDataFetched[pokeID].name.toLowerCase().includes(searchInput)) {
            searchedPokemons.push(pokeID);
        }
    }
    if (searchedPokemons.length > 0) await renderPokemonCards(searchedPokemons);
    else renderMassageNoPokemonsFound(searchInput);
}

function renderMassageNoPokemonsFound(searchInput) {
    const errorContainer = document.getElementById('NoPokemonsFound');
    errorContainer.innerHTML = `<p data-id="not-found">Sorry, there are no Pokémon with "${searchInput}"!</p>`;
    errorContainer.classList.add("show");
}

function renderMessageMinLetters() {
    const errorContainer = document.getElementById('NoPokemonsFound');
    errorContainer.innerHTML = `<p data-id="min-letters">Please enter at least 3 letters for search.</p>`;
    errorContainer.classList.add("show");
}

function clearMessageMinLetters() {
    const errorContainer = document.getElementById('NoPokemonsFound');
    errorContainer.innerHTML = ``;
    errorContainer.classList.remove("show");
}
async function showAllLoadedPokemon() {
    toggleSpinner('LoadingSpinner', true);
    searchedPokemons = [];
    removeLoadMoreShowAllButton();
    clearPokemonList();
    clearMessageMinLetters();
    await renderPokemonCards(renderedPokemons);
    checkForLoadMoreButton();
    toggleSpinner('LoadingSpinner', false);
}

async function loadMorePokemon() {
    toggleSpinner('LoadingSpinner', true);
    loadingAmount = parseInt(document.getElementById('LoadingAmount').value);
    const missing = MAX_AMOUNT - renderedPokemons.length;
    const loading = (loadingAmount < missing) ? loadingAmount : missing;
    removeLoadMoreShowAllButton();
    await renderLoadingRequest(renderedPokemons.length + 1, loading);
    checkForLoadMoreButton();
    toggleSpinner('LoadingSpinner', false);
}

async function renderLoadingRequest(start, loading) {
    const toRender = [];
    for (let i = 0; i < loading; i++) toRender.push(start + i);
    await getPokemonsData("name", start, loading);
    await getPokemonsData("type", start, loading);
    await renderPokemonCards(toRender);
}

function removeLoadMoreShowAllButton() {
    document.getElementById('LoadMoreButton').innerHTML = "";
}

function renderShowAllLoadedPokemonButton() {
    document.getElementById('LoadMoreButton').innerHTML = templateShowAllLoadedPokemonButton();
}

function renderLoadMoreButton(amount) {
    document.getElementById('LoadMoreButton').innerHTML = templateLoadMoreButton(amount);
}

function renderMessageMaxAmount() {
    document.getElementById('LoadMoreButton').innerHTML = `You have already loaded all ${MAX_AMOUNT} Pokémon.`;
}

function showDialog(pokeID) {
    document.getElementById('Dialog').showModal();
    dialogArray = (searchedPokemons.length == 0) ? renderedPokemons : searchedPokemons;
    renderPokemonOverlay(pokeID);
}

function hideButtonPreviousNextPokemon() {
    document.getElementById('ButtonPreviousPokemon').classList.add("d-none");
    document.getElementById('ButtonNextPokemon').classList.add("d-none");
}

async function renderPokemonOverlay(pokeID) {
    toggleSpinner('LoadingSpinnerOverlay', true);
    const { name, types, responsePokemon } = pokemonDataFetched[pokeID];
    const stats = formatPokemonStats(responsePokemon);
    const html = await templatePokemonOverlay(pokeID, name, types[0], types[1] || types[0], stats.h, stats.w, stats.hp, stats.atk, stats.def);
    document.getElementById('PokemonOverlay').innerHTML = html;
    if (!dialogArray.includes(pokeID)) hideButtonPreviousNextPokemon();
    await renderPokemonTypes(pokeID, types, 'TypesOverlay');
    await renderPokemonTypes(pokeID, types, 'TypesOverlayMobile');
    await renderEvolutionChain(pokeID);
    toggleSpinner('LoadingSpinnerOverlay', false);
}

function formatPokemonStats(res) {
    return {
        h: (res.height / 10).toFixed(1).toString().replace(".", ",") + " m",
        w: (res.weight / 10).toFixed(1).toString().replace(".", ",") + " kg",
        hp: res.stats[0].base_stat,
        atk: res.stats[1].base_stat,
        def: res.stats[2].base_stat
    };
}

async function renderPreviousOrNextPokemonOverlay(pokeID, direction) {
    toggleSpinner('LoadingSpinnerOverlay', true);
    hideButtonPreviousNextPokemon();
    if (pokeID == dialogArray[0] && direction == 'previous') {
        await renderPokemonOverlay(dialogArray[dialogArray.length - 1]);
        return;
    }
    if (pokeID == dialogArray[dialogArray.length - 1] && direction == 'next') {
        await renderPokemonOverlay(dialogArray[0]);
        return;
    }
    const idx = dialogArray.indexOf(pokeID);
    const newID = (direction == 'next') ? dialogArray[idx + 1] : dialogArray[idx - 1];
    await renderPokemonOverlay(newID);
    toggleSpinner('LoadingSpinnerOverlay', false);
}

function closeDialog() {
    document.getElementById('Dialog').close();
}

function closeDialogOnBackdrop(event) {
    const dialog = document.getElementById('Dialog');
    if (event.target === dialog) {
        dialog.close();
    }
}

async function renderEvolutionChain(pokeID) {
    await checkEvolutionChainLoaded(pokeID);
    const chain = pokemonDataFetched[pokeID].evolutionChain;
    const container = document.getElementById(`EvolutionChain${pokeID}`);
    if (!container) return;
    if (chain.length === 1) return container.innerHTML = 'This Pokémon has no evolution chain.';
    for (let i = 0; i < chain.length; i++) {
        await ensureEvolutionMemberLoaded(chain[i]);
        const m = pokemonDataFetched[chain[i]];
        const t2 = m.types[1] || m.types[0];
        appendHTML(`EvolutionChain${pokeID}`, templateEvolutionChain(chain[i], m.name, m.types[0], t2));
    }
}

async function checkEvolutionChainLoaded(pokeID) {
    if (!pokemonDataFetched[pokeID].hasOwnProperty("evolutionChain")) {
        await getEvolutionChain(pokeID);
    }
}

async function getEvolutionChain(pokeID) {
    const res = await fetch(`${BASE_URL}/pokemon-species/${pokeID}`);
    const speciesData = await res.json();
    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();
    await addEvolutionDataToPokemonData(pokeID, evoData);
}

async function addEvolutionDataToPokemonData(pokeID, evoData) {
    const chain = extractEvolutionIds(evoData);
    for (let i = 0; i < chain.length; i++) {
        if (pokemonDataFetched[chain[i]]) {
            pokemonDataFetched[chain[i]].evolutionChain = chain;
        }
    }
}

function extractEvolutionIds(evoData) {
    const chain = [];
    const getSpeciesId = (url) => parseInt(url.replace(`${BASE_URL}-species/`, "").replace("https://pokeapi.co/api/v2/pokemon-species/", "").replace(/\//g, ""));
    chain.push(parseInt(evoData.chain.species.url.split('/').slice(-2, -1)[0]));
    if (evoData.chain.evolves_to.length > 0) {
        chain.push(parseInt(evoData.chain.evolves_to[0].species.url.split('/').slice(-2, -1)[0]));
        if (evoData.chain.evolves_to[0].evolves_to.length > 0) {
            chain.push(parseInt(evoData.chain.evolves_to[0].evolves_to[0].species.url.split('/').slice(-2, -1)[0]));
        }
    }
    return chain;
}

async function ensureEvolutionMemberLoaded(chainPokeID) {
    if (!checkPokemonDataIsLoaded("name", chainPokeID)) await getOnePokemonName(chainPokeID);
    if (!checkPokemonDataIsLoaded("type", chainPokeID)) await getOnePokemonType(chainPokeID);
}

function renderApiErrorMessage(message) {
    const errorContainer = document.getElementById('NoPokemonsFound');
    if (!errorContainer) return;
    errorContainer.innerHTML = `
        <div class="error-box">
            <h3>Upps! An error occurred</h3>
            <p>${message}</p>
            <button class="btn-retry" onclick="location.reload()">Try Again</button>
        </div>
    `;
    errorContainer.classList.add("show");
}


function toggleSpinner(elementId, show) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (show) {
        el.classList.remove("d-none");
        el.classList.add("loading-spinner");
    } else {
        el.classList.add("d-none");
        el.classList.remove("loading-spinner");
    }
}

function appendHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML += html;
    }
}
