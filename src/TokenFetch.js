/**
 * Provide a set of token providers and fetch normalized token data
 * using a simple query interface.
 */
class TokenFetch {
    providers = [];

    /**
     * TokenFetch requires a set of providers to fetch tokens from. Generally speaking,
     * this will be a set of indexers. You can access built-in providers to utilize via
     * {@link module:TokenFetchJS.providers}.
     * @param {Array} providerSet A set of token providers to fetch tokens from.
     */
    constructor(providerSet) {
        providerSet && this.setProviders(providerSet);
    }

    /**
     * @typedef {Object} tokenQuery Query object used to refine token fetch results.
     * @property {Number} [after] Date constraint limiting tokens to after the provided timestamp.
     * @property {Number} [before] Date constraint limiting tokens to before the provided timestamp.
     * @property {Array} [idList] Token ID constraint for token fetch. IDs are contract specific.
     * Multi-contract providers are expected to manage contract-id relationships.
     * @property {String} [issuer] Wallet address constraint for token creator.
     * @property {Number} [limit] Number of results to take. Default is 50.
     * @property {String} [owner] Wallet address constraint for token owner.
     * @property {Number} [skip] Number of results to skip. Defualt is 0.
     */

    /**
     * @typedef {Object} tokenMetadata Normalized token metadata object. Represents a single token. @TODO clean up IPFS addresses. Add raw IPFS hash.
     * @property {String} contract Address of the originating smart contract.
     * @property {String} createdAt Date the token was created. @TODO normalize in providers.
     * @property {String} description
     * @property {String} identifier Provider specific identifier. Generally, this will be the issue number derived from the originating smart contract. @TODO coerce to string in providers.
     * @property {String} ipfsLink Native IPFS address of the token artifact.
     * @property {String} displayArtifactIpfsAddress Native IPFS address of the display artifact.
     * @property {Object} issuer
     * @property {String} issuer.address Wallet address of the token creator.
     * @property {String} issuer.handle Platform derived handle of the token creator.
     * @property {String} issuer.platform Platform the token was issued on.
     * @property {String} issuer.platformDisplay Display name of the platform the token was issued on.
     * @property {String} name The name of the token.
     * @property {String} platformUri URL for the token's platform listing.
     * @property {String} platformIssuerUrl URL for the token creator's platform profile.
     * @property {String} type Virtual attribute - the type of the token. Enum includes [image, video, model, application].
     * @property {String} mime Mime type of the token.
     * @property {String} tid Virtual attribute - the combined contract + identifer value. Used as a single identifier value.
     */

    /**
     * Fetch a normalized set of token metadata from the configured set of token providers.
     * @param {Object} [{@link tokenQuery}] Optional {@link tokenQuery} used to refine results.
     * If no {@link tokenQuery} is given the most recent 50 tokens will be returned.
     * @returns {Object} tokenMetadataMap Provider namespaced map of normalized {@link tokenMetadata} sets.
     */
    async fetchTokens(tokenQuery = {}) {
        const tokenMetadataSet = await Promise.all(
            this.providers.reduce(function (requestSet, provider) {
                // Attach query if we are targeting an expected provider.
                if (!tokenQuery.provider || tokenQuery.provider[provider.key]) {
                    requestSet.push(
                        (async () => ({
                            provider: provider.key,
                            tokens: await provider.fetchTokens(
                                // Use the provider specific tokenQuery, or the original query.
                                tokenQuery.provider
                                    ? tokenQuery.provider[provider.key]
                                    : tokenQuery
                            ),
                        }))()
                    );
                }

                return requestSet;
            }, [])
        );

        // Parse query results into map of provider namespaced token metadata.
        return tokenMetadataSet.reduce(function (acc, providerResults, i) {
            acc[providerResults.provider] = providerResults.tokens;

            return acc;
        }, {});
    }

    /**
     * Retrieve all provider instances.
     * @returns {Array} Set of configured providers.
     */
    getProviders() {
        return this.providers;
    }

    /**
     * Apply set of provider instances. This will replace the existing configured provider set.
     * @param {Array} providerSet A set of token providers to fetch tokens from.
     * @returns {Array} Set of configured providers.
     */
    setProviders(providerSet) {
        this.providers = providerSet;

        return this.getProviders();
    }

    /**
     * Add a single provider instance.
     * @param {Object} provider New provider instance to fetch tokens from.
     * @returns {Array} Set of configured providers.
     */
    addProvider(provider) {
        this.providers.push(provider);

        return this.getProviders();
    }
}

export default TokenFetch;
