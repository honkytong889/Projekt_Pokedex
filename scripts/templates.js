function templatePokemonCard(pokeID, name) {
    return `
        <li data-id="card"
            class="pokemon-card">
            <button data-id="card-image" id="Image${pokeID}" onclick="showDialog(${pokeID})"></button>
            <h2 data-id="card-pokemon-name">${name}</h2>
            <div data-id="card-pokemon-types" id="Types${pokeID}"></div>
        </li>`;
}

function templatePokemonTypes(type) {
    return `
        <span data-id="pokemon-type" class="span-type" style="background-color: var(--${type})">
            ${type}
        </span>`;
}

function templateLoadMoreButton(loadingAmount) {
    return `
        <button data-id="load-more-button" 
            onclick="loadMorePokemon()"
            class="btn-load-more">
            Load
        </button>
        <input data-id="load-more-input"
            id="LoadingAmount" class="input-loading-amount" 
            type="number" name="loading amount" 
            value="${loadingAmount}" required
            onkeyup="pressEnter(event, 'loadMore')">
        <button data-id="load-more-button"
            onclick="loadMorePokemon()"
            class="btn-load-more">
            more
        </button>`;
}

function templateShowAllLoadedPokemonButton() {
    return `
        <button data-id="show-all-loaded-button"
            onclick="showAllLoadedPokemon()"
            class="btn-load-more">
            Show all loaded Pokémon
        </button>`;
}

function templatePokemonOverlay(pokeID, name, type1, type2, height, weight, hp, attack, defense) {
    return `
        <header class="overlay-header">
            <span data-id="pokemon-id">#${pokeID}</span>
            <button data-id="close-dialog-button"
                onclick="closeDialog()"
                class="btn-icon">
                <img src="assets/icons/close.svg" 
                alt="close overlay">
            </button>
        </header>
        <img id="LoadingSpinnerOverlay"
            class="d-none"
            src="assets/img/pokeball.webp" 
            alt="Poké Ball"> 
        <section>
            <h3 data-id="overlay-pokemon-name" class="border-big">${name}</h3>
            <div class="pokemon-details-container-parent">
                <div data-id="pokemon-data-1-desktop" class="hide-mobile pokemon-details-container-child">
                    <p data-id="pokemon-height" class="border-big">height:<br><b>${height}</b></p>
                    <div data-id="overlay-pokemon-types" id="TypesOverlay${pokeID}"></div>
                    <p data-id="pokemon-weight" class="border-big">weight:<br><b>${weight}</b></p>
                </div>
                <div class="pokemon-details-container-child-img">
                    <img data-id="dialog-image"
                        style="filter: drop-shadow(-12px 12px 12px var(--${type1})) drop-shadow(12px -12px 12px var(--${type2}))"
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png" 
                        alt="${name}">
                    <div data-id="overlay-pokemon-types-mobile" class="show-mobile" id="TypesOverlayMobile${pokeID}"></div>
                </div>
                <div data-id="pokemon-data-2-desktop" class="hide-mobile pokemon-details-container-child">
                    <p data-id="pokemon-hp" class="border-big">hp:<br><b>${hp}</b></p>
                    <p data-id="pokemon-attack" class="border-big">attack:<br><b>${attack}</b></p>
                    <p data-id="pokemon-defense" class="border-big">defense:<br><b>${defense}</b></p>
                </div>
                <div data-id="pokemon-data-mobile" class="show-mobile pokemon-details-container-child border-big">
                    <p data-id="pokemon-height">height:<br><b>${height}</b></p>
                    <p data-id="pokemon-weight">weight:<br><b>${weight}</b></p>
                    <p data-id="pokemon-hp">hp:<br><b>${hp}</b></p>
                    <p data-id="pokemon-attack">attack:<br><b>${attack}</b></p>
                    <p data-id="pokemon-defense">defense:<br><b>${defense}</b></p>                   
                </div>
            </div>
            
            <div class="overlay-arrow-container">
                <button data-id="prev-button"
                    onclick="renderPreviousOrNextPokemonOverlay(${pokeID}, 'previous')"
                    id="ButtonPreviousPokemon"
                    class="btn-icon btn-reverse">
                    <img src="assets/icons/Arrow-left.svg" 
                    alt="previous Pokémon">
                </button>
                <div>
                    <h4 class="border-big">Evolution Chain</h4>
                </div>
                <button data-id="next-button"
                    onclick="renderPreviousOrNextPokemonOverlay(${pokeID}, 'next')"
                    id="ButtonNextPokemon"
                    class="btn-icon">
                    <img src="assets/icons/Aroow-Right.svg" 
                    alt="next Pokémon">
                </button>
            </div>
            <ul data-id="evolution-chain"
                id="EvolutionChain${pokeID}"
                class="evolution-chain">
            </ul>
        </section>`;
}