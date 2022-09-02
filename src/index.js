/** @module TokenFetchJS */
import providers from "./lib/token-providers";
import TokenFetcher from "./class/TokenFetcher";
import TokenPaginator from "./class/TokenPaginator";
import TokenQueryParser from "./class/TokenQueryParser";

export default {
    /**
     * Factory method for constructing {@link TokenFetcher} instances.
     * @param {Array} tokenProviderSet Set of instantiated token providers to fetch tokens from.
     * @see {@link TokenFetcher}
     * @see {@link TokenProvider}
     */
    factory: function (tokenProviderSet) {
        return new TokenFetcher(tokenProviderSet, TokenQueryParser, TokenPaginator);
    },
    /**
     * Dictionary of built-in token providers. Generally, token providers will be blockchain/smart contract indexers.
     * @property {Object} Tezos Built-in {@link TokenProvider} class set for the Tezos blockchain.
     * @see {@link TezosProviders}
     * @see {@link TokenProvider}
     */
    providers,
};
