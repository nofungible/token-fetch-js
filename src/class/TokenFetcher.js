/**
 * Provide a set of token providers and fetch normalized token data
 * using a simple query interface.
 * @hideconstructor
 */
class TokenFetcher {
    providers = [];

    /**
     * TokenFetcher requires a set of providers to fetch tokens from. Generally speaking,
     * this will be a set of indexers. You can access built-in providers to utilize via
     * {@link module:TokenFetchJS.providers}.
     * @param {Array} providerSet A set of token providers to fetch tokens from.
     * @param {Object} TokenQueryParser TokenQueryParser class
     * @param {Object} TokenPaginator TokenPaginator class
     */
    constructor(providerSet = [], TokenQueryParser, TokenPaginator) {
        this.TokenPaginator = TokenPaginator;
        this.TokenQueryParser = TokenQueryParser;
        this.queryParser = null;
        this.providerMap = null;
        this.providerSet = null;

        this.setProviders(providerSet);
    }

    /**
     * Fetch a normalized set of token metadata from the configured set of token providers.
     * @param {Object} tokenQuery Dictionary of token filters used to refine fetch results.
     * If no {@link tokenQuery} is given the most recent 50 tokens will be returned.
     * @param {Object} pageCursor Metadata required by TokenFetchJS to gather the next page of results.
     * @returns {Object} See {@link tokenFetchResponse}.
     * @see {@link tokenQuery}
     * @see {@link pageCursor}
     */
    async fetchTokens(rawTokenQuery = {}, pageCursor) {
        const tokenQuery = this.queryParser.normalizeTokenQuery(
            this.queryParser.applyTokenQueryDefaults(rawTokenQuery)
        );
        const providerTokenMetadataMap = await this.fetchTokensFromProviders(tokenQuery, pageCursor);
        const paginator = new this.TokenPaginator(tokenQuery, providerTokenMetadataMap);

        return paginator.getPage();
    }

    async fetchTokensFromProviders(tokenQuery, pageCursor) {
        const providerTokenQueryMap = this.queryParser.parseProviderQueryMap(tokenQuery, pageCursor);
        const providerTokenFetchResponseSet = await Promise.all(
            Object.entries(providerTokenQueryMap).map(async ([providerKey, providerTokenQuery]) => {
                const providerTokenMetadataSet = await this.providerMap[providerKey].fetchTokens(providerTokenQuery);

                return { [providerKey]: providerTokenMetadataSet };
            })
        );

        return providerTokenFetchResponseSet.reduce((acc, fetchResponse) => {
            return Object.assign(acc, fetchResponse);
        }, {});
    }

    /**
     * Retrieve all provider instances.
     * @returns {Array} Set of configured providers.
     */
    getProviders() {
        return this.providerSet;
    }

    /**
     * Apply set of provider instances. This will replace the existing configured provider set.
     * @param {Array} providerSet A set of token providers to fetch tokens from.
     * @returns {Array} Set of configured providers.
     */
    setProviders(providerSet) {
        this.providerSet = providerSet;
        this.providerMap = providerSet.reduce((acc, p) => (acc[p.key] = p) && acc, {});
        this.queryParser = new this.TokenQueryParser(this.providerSet);

        return this.getProviders();
    }

    /**
     * Add a single provider instance.
     * @param {Object} provider New provider instance to fetch tokens from.
     * @returns {Array} Set of configured providers.
     */
    addProvider(provider) {
        this.setProviders(this.getProviders().concat(provider));

        return this.getProviders();
    }

    /**
     * Remove a provider instance by key.
     * @param {String} providerKey Key identifier supplied to TokenProvider constructor.
     * @returns {Array} Set of configured providers.
     */
    removeProvider(providerKey) {
        this.setProviders(this.providerSet.reduce((acc, p) => (p.key !== providerKey ? [...acc, p] : acc), []));

        return this.getProviders();
    }
}

export default TokenFetcher;
