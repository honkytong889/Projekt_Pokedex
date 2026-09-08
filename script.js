const BASE_URL = "https://pokeapi.co/api/v2";
const MAX_AMOUNT = 1025;
let loadingAmount = 20;
const pokemonDataFetched = {};
const pokemonImageCache = {};
const renderedPokemons = [];
let searchedPokemons = [];
let dialogArray = [];

async function init() {
    document.getElementById('LoadingSpinner').classList.add("loading-spinner");
    try {
        await getPokemonsData("id", 1, loadingAmount);
        await getPokemonsData("name", 1, loadingAmount);
        await getPokemonsData("type", 1, loadingAmount);
        await renderPokemonCards(Object.keys(pokemonDataFetched).map(pokeID => Number(pokeID)));
        document.getElementById('PokemonList').classList.add("d-flex");
        await renderLoadMoreButton(loadingAmount);
        await getPokemonsData("id", loadingAmount + 1, MAX_AMOUNT - loadingAmount);
    } catch (err) {
        renderApiErrorMessage("The page failed to load when starting up.");
    } finally {
        document.getElementById('LoadingSpinner').classList.remove("loading-spinner");
    }
}

async function getPokemonsData(data, start, end) {
    for (let pokeID = start; (pokeID < (start + end)) && (pokeID <= MAX_AMOUNT); pokeID++) {
        if (data == "id") {
            await getOnePokemonId(pokeID);
        }
        if (data == "name") {
            if (checkPokemonDataIsLoaded(data, pokeID) == false) {
                await getOnePokemonName(pokeID);
            }
        }
        if (data == "type") {
            if (checkPokemonDataIsLoaded(data, pokeID) == false) {
                await getOnePokemonType(pokeID);
            }
        }
    }
}

async function getOnePokemonId(pokeID) {
    pokemonDataFetched[pokeID] = {};
}

async function getOnePokemonName(pokeID) {
    const response = await fetch(`${BASE_URL}/pokemon/${pokeID}`);
    const responseToJson = await response.json();
    pokemonDataFetched[pokeID].responsePokemon = responseToJson;
    pokemonDataFetched[pokeID].name = responseToJson.name.charAt(0).toUpperCase() + responseToJson.name.slice(1);
}

async function getOnePokemonType(pokeID) {
    const types = [];
    for (let indexType = 0; indexType < pokemonDataFetched[pokeID].responsePokemon.types.length; indexType++) {
        types.push(pokemonDataFetched[pokeID].responsePokemon.types[indexType].type.name);
    }
    pokemonDataFetched[pokeID].types = types;
}

function pushPokemonImageToCache(pokeID, name, type1, type2) {
    return new Promise((resolve, reject) => {
        if (pokemonImageCache[pokeID]) {
            resolve(pokemonImageCache[pokeID]);
            return;
        }
        const img = new Image();
        img.role = `button`;
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png`;
        img.alt = `${name}`;
        img.onload = () => {
            pokemonImageCache[pokeID] = img;
            resolve(img);
        };
        img.onerror = reject;
    });
}

async function renderPokemonCards(currentArray) {
    for (let index = 0; index < currentArray.length; index++) {
        const pokeID = currentArray[index];
        await renderOnePokemonCard(pokeID);
    }
}

async function renderOnePokemonCard(pokeID) {
    const { name, types } = pokemonDataFetched[pokeID];
    const type1 = types[0];
    let type2 = (types.length == 2) ? types[1] : type1;
    const pokeImage = await pushPokemonImageToCache(pokeID, name, type1, type2);
    document.getElementById('PokemonList').innerHTML += templatePokemonCard(pokeID, name);
    document.getElementById(`Image${pokeID}`).appendChild(pokeImage);
    await renderPokemonTypes(pokeID, types, 'Types');

    if (!renderedPokemons.includes(pokeID)) {
        renderedPokemons.push(pokeID);
    }
}

function renderPokemonTypes(pokeID, types, typesID) {
    for (let indexType = 0; indexType < types.length; indexType++) {
        document.getElementById(`${typesID}${pokeID}`).innerHTML += templatePokemonTypes(types[indexType]);
    }
}

function clearPokemonList() {
    document.getElementById('PokemonList').innerHTML = "";
}

function checkPokemonDataIsLoaded(data, pokeID) {
    return pokemonDataFetched[pokeID].hasOwnProperty(data) ? true : false;
}

function checkForLoadMoreButton() {
    (renderedPokemons.length < MAX_AMOUNT) ? renderLoadMoreButton(loadingAmount) : renderMessageMaxAmount();
}

function pressEnter(event, task) {
    let key = event.key;
    if (key == "Enter") {
        if (task == "search") {
            checkSearchInput();
        }
        if (task == "loadMore") {
            loadMorePokemon();
        }
    }
}

async function checkSearchInput() {
    const q = document.getElementById('Search').value.trim().toLowerCase();
    if (q.length < 3) { clearPokemonList(); removeLoadMoreShowAllButton(); return renderMessageMinLetters(); }
    document.getElementById('LoadingSpinner').classList.add("loading-spinner");
    removeLoadMoreShowAllButton(); clearPokemonList(); clearMessageMinLetters();
    try {
        await searchForPokemon(q);
        renderShowAllLoadedPokemonButton();
        document.getElementById('Search').value = "";
    } catch (err) {
        renderApiErrorMessage("API konnte nicht geladen werden.");
    } finally {
        document.getElementById('LoadingSpinner').classList.remove("loading-spinner");
    }
}

async function searchForPokemon(searchInput) {
    searchedPokemons = [];
    await clearMessageMinLetters();
    for (let pokeID = 1; pokeID <= renderedPokemons.length; pokeID++) {
        if (pokemonDataFetched[pokeID].name.toLowerCase().includes(searchInput)) {
            searchedPokemons.push(pokeID);
        }
    }
    if (searchedPokemons.length > 0) {
        await renderPokemonCards(searchedPokemons);
    } else {
        renderMassageNoPokemonsFound(searchInput);
    }
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
    document.getElementById('LoadingSpinner').classList.add("loading-spinner");
    searchedPokemons = [];
    await removeLoadMoreShowAllButton();
    await clearPokemonList();
    await clearMessageMinLetters();
    await renderPokemonCards(renderedPokemons);
    checkForLoadMoreButton();
    document.getElementById('LoadingSpinner').classList.remove("loading-spinner");
}

async function loadMorePokemon() {
    document.getElementById('LoadingSpinner').classList.add("loading-spinner");
    loadingAmount = parseInt(document.getElementById('LoadingAmount').value);
    const missingAmount = MAX_AMOUNT - renderedPokemons.length;
    const loading = (loadingAmount < missingAmount) ? loadingAmount : missingAmount;
    await removeLoadMoreShowAllButton();
    await renderLoadingRequest(renderedPokemons.length + 1, loading);
    checkForLoadMoreButton();
    document.getElementById('LoadingSpinner').classList.remove("loading-spinner");
}

async function renderLoadingRequest(start, loading) {
    const toRender = [];
    for (let i = 0; i < loading; i++) {
        toRender.push(start + i);
    }
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

function renderLoadMoreButton(loadingAmount) {
    document.getElementById('LoadMoreButton').innerHTML = templateLoadMoreButton(loadingAmount);
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
    const { name, types, responsePokemon } = pokemonDataFetched[pokeID];
    const type1 = types[0];
    let type2 = (types.length == 2) ? types[1] : type1;
    const height = (responsePokemon.height / 10).toFixed(1).toString().replace(".", ",") + " m";
    const weight = (responsePokemon.weight / 10).toFixed(1).toString().replace(".", ",") + " kg";
    const [hp, attack, defense] = responsePokemon.stats;
    document.getElementById('PokemonOverlay').innerHTML = await templatePokemonOverlay(pokeID, name, type1, type2, height, weight, hp.base_stat, attack.base_stat, defense.base_stat);
    document.getElementById('LoadingSpinnerOverlay').classList.add("loading-spinner");
    if (!dialogArray.includes(pokeID)) {
        hideButtonPreviousNextPokemon();
    }
    await renderPokemonTypes(pokeID, types, 'TypesOverlay');
    await renderPokemonTypes(pokeID, types, 'TypesOverlayMobile');
    await renderEvolutionChain(pokeID);
    document.getElementById('LoadingSpinnerOverlay').classList.remove("loading-spinner");
}

async function renderPreviousOrNextPokemonOverlay(pokeID, direction) {
    document.getElementById('LoadingSpinnerOverlay').classList.add("loading-spinner");
    hideButtonPreviousNextPokemon();
    if (pokeID == dialogArray[0] && direction == 'previous') {
        await renderPokemonOverlay(dialogArray[dialogArray.length - 1]);
        return;
    }
    if (pokeID == dialogArray[dialogArray.length - 1] && direction == 'next') {
        await renderPokemonOverlay(dialogArray[0]);
        return;
    }
    const indexCurrentPokeID = dialogArray.indexOf(pokeID);
    const newPokeID = (direction == 'next') ? dialogArray[indexCurrentPokeID + 1] : dialogArray[indexCurrentPokeID - 1];
    await renderPokemonOverlay(newPokeID);
    document.getElementById('LoadingSpinnerOverlay').classList.remove("loading-spinner");
}

function closeDialog() {
    document.getElementById('Dialog').close();
}

async function renderEvolutionChain(pokeID) {
    await checkEvolutionChainLoaded(pokeID);
    if (pokemonDataFetched[pokeID].evolutionChain.length == 1) {
        document.getElementById(`EvolutionChain${pokeID}`).innerHTML = 'This Pokémon has no evolution chain.';
    } else {
        for (let i = 0; i < pokemonDataFetched[pokeID].evolutionChain.length; i++) {
            const chainPokeID = pokemonDataFetched[pokeID].evolutionChain[i];
            if (checkPokemonDataIsLoaded("name", chainPokeID) == false) {
                await getOnePokemonName(chainPokeID);
            }
            if (checkPokemonDataIsLoaded("type", chainPokeID) == false) {
                await getOnePokemonType(chainPokeID);
            }
            const name = pokemonDataFetched[chainPokeID].name;
            const types = pokemonDataFetched[chainPokeID].types;
            const type1 = types[0];
            let type2 = (types.length == 2) ? types[1] : type1;
            document.getElementById(`EvolutionChain${pokeID}`).innerHTML += templateEvolutionChain(chainPokeID, name, type1, type2);
        }
    }
}

async function checkEvolutionChainLoaded(pokeID) {
    if (!pokemonDataFetched[pokeID].hasOwnProperty("evolutionChain")) {
        await getEvolutionChain(pokeID);
    }
}

async function getEvolutionChain(pokeID) {
    const response = await fetch(`${BASE_URL}/pokemon-species/${pokeID}`);
    const responseToJson = await response.json();
    const evolutionResponse = await fetch(responseToJson.evolution_chain.url);
    const evolutionToJson = await evolutionResponse.json();
    await addEvolutionDataToPokemonData(pokeID, evolutionToJson);
}

async function addEvolutionDataToPokemonData(pokeID, evolutionToJson) {
    const evolutionChain = [];
    const base = parseInt(evolutionToJson.chain.species.url.replace("https://pokeapi.co/api/v2/pokemon-species/", "").replace("/", ""));
    evolutionChain.push(base);

    if (evolutionToJson.chain.evolves_to.length > 0) {
        const stage1 = parseInt(evolutionToJson.chain.evolves_to[0].species.url.replace("https://pokeapi.co/api/v2/pokemon-species/", "").replace("/", ""));
        evolutionChain.push(stage1);

        if (evolutionToJson.chain.evolves_to[0].evolves_to.length > 0) {
            const stage2 = parseInt(evolutionToJson.chain.evolves_to[0].evolves_to[0].species.url.replace("https://pokeapi.co/api/v2/pokemon-species/", "").replace("/", ""));
            evolutionChain.push(stage2);
        }
    }
    for (let index = 0; index < evolutionChain.length; index++) {
        const currentPokeID = evolutionChain[index];
        if (pokemonDataFetched[currentPokeID]) {
            pokemonDataFetched[currentPokeID].evolutionChain = evolutionChain;
        }
    }
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
