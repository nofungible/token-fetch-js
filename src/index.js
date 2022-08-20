/** @module TokenFetchJS */
import TokenProviders from "./token-provider";
import TokenFetch from "./TokenFetch";

const providers = {};

/**
 * Construct a Provider.key namespaced map of built-in, pre-built provider instances.
 * This provides an easy way to quickly get started fetching tokens w/o the
 * need for custom Provider configurations.
 */
for (const providerKey in TokenProviders) {
    const { factory, providers: tokenProviders } = TokenProviders[providerKey];

    providers[providerKey] =
        (factory && factory()) ||
        Object.values(tokenProviders).map((P) => new P());
}

export default {
    /**
     * TokenFetch class.
     * @see {@link TokenFetch}
     */
    TokenFetch,
    /**
     * Provider.key namespaced dictionary of built-in token provider modules
     * including their underlying provider classes.
     */
    TokenProviders,
    /**
     * Provider.key namespaced map of pre instantiated built-in token providers.
     */
    providers,
};
