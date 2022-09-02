/* tokenQuery Partials */

/**
 * @typedef {Object} pageCursor Pagination metadata used to gather tokens for the subsequent page given a specific {@link tokenQuery}.
 * This should be passed back to {@link TokenFetch#fetchTokens} for the next page of tokens for the given query.
 */

/**
 * @typedef  {Object} selectorQuery Query partial used to constrain token results via field comparison.
 * @property {*}     [$eq] Property value is equal to the comparison value.
 * @property {*}     [$neq] Property value is not equal to the comparison value.
 * @property {Array} [$in] Property value is included in comparison value set.
 * @property {Array} [$nin] Property value is not included in comparison value set.
 */

/**
 * @typedef  {Object} sortQuery Query partial used to sort token results. Possible sort values are 'ASC' and 'DESC'.
 * @property {String} [date] Sort value used to sort tokens by date minted.
 */

/**
 * @typedef  {Object} tokenQuery Query dictionary used to refine token fetch results.
 * @property {Date}   [after] Date constraint limiting tokens to after the provided timestamp.
 * @property {Date}   [before] Date constraint limiting tokens to before the provided timestamp.
 * @property {Object} [issuer] Token creator address {@link selectorQuery}.
 * @property {Number} [limit] Number of results to take. Default is 50.
 * @property {Object} [mimeType] File mime-type {@link selectorQuery}.
 * @property {Object} [orderBy] Token sort order options {@link sortQuery}
 * @property {Object} [owner] Token holder address {@link selectorQuery}.
 * @property {Object} [tid] Unified Token Identifier (TID) {@link selectorQuery}.
 */

/* Token Metadata */

/**
 * @typedef  {Object} tokenMetadata Normalized token metadata.
 * @property {Object} contract Token's smart contract metadata.
 * @property {String} contract.address Smart contract address.
 * @property {String} contract.tokenId Smart contract identifier assigned to the token.
 * @property {Date}   createdAt Token's mint date.
 * @property {String} description Token description.
 * @property {Object} ipfs IPFS metadata.
 * @property {String} ipfs.artifact IPFS address of the token's artifact.
 * @property {String} ipfs.display IPFS address of the token's display image.
 * @property {Object} issuer
 * @property {String} issuer.address Wallet address of the token issuer.
 * @property {String} mimeType Token file mime type.
 * @property {String} name Token name.
 * {Object} platform Platform metadata.
 * {String} platform.name Name of the platform the token was minted on.
 * {String} platform.url URL of the platform the token was minted on.
 * {Object} platform.issuer Platform derived metadata for the issuer.
 * {String} platform.issuer.url URL of the issuer's platform specific page.
 * @property {String} tid The unified token identifier (TID). Generally this is in the format "contract:contract_token_id".
 * @property {Object} _metadata Additional TokenFetchJS metadata.
 * @property {String} _metadata.providerKey The provider that the token was gathered from.
 */

/* Options */

/**
 * Dictionary of options specific to {@link TokenProvider} classes representing many smart contract addresses.
 * @typedef multiProviderOptions
 * @property {Object} contract Dictionary of contract scoping options
 * @property {Array}  contract.allow Set of supported smart contract addresses.
 * @property {Array}  contract.deny Set of smart contract addresses to omit from query results.
 */

/* Request/Response */

/**
 * Dictionary returned by {@link TokenFetcher.fetchTokens}.
 * @typedef tokenFetchResponse
 * @property {Array}  tokens Set of {@link tokenMetadata}.
 * @property {Object} cursor Call {@link TokenFetcher#fetchTokens} with the same {@link tokenQuery}, and a {@link pageCursor}
 * as a second argument, to get the next page of results.
 */