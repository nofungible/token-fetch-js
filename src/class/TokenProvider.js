/**
 * A TokenProvider represents a source for token metadata. It can be any possible source, though generally
 * speaking it would be an indexer of blockchain/marketplace/contract transaction metadata.
 *
 * A TokenProvider can have its own set of constructor arguments, and may provide additional methods.
 *
 * @interface TokenProvider
 * @see {@link TezosProviders}
 */
export default class TokenProvider {
    constructor(providerKey, contractSet) {
        if (!providerKey && providerKey !== 0) {
            throw new Error("new TokenProvider missing key");
        }

        this.key = providerKey;
        this.contracts = contractSet || [];
    }

    /**
     * Unique key used to identify provider instance.
     * @memberof TokenProvider
     * @type String
     * @instance
     */
    key = "";

    /**
     * Fetch tokens and return a normalized set of {@link tokenMetadata}.
     *
     * @function
     * @name TokenProvider#fetchTokens
     * @param {Object} tokenQuery See {@link tokenQuery}.
     * @returns {Array} Set of {@link tokenMetadata}.
     */
    fetchTokens() {
        return [];
    }
}
