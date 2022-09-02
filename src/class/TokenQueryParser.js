import config from "../lib/config";
import { parseTID } from "../lib/util";

const {
    tokenQuery: { DEFAULT_LIMIT, SELECTOR_QUERY_FIELDS },
} = config;

export default class TokenQueryParser {
    constructor(providerSet) {
        this.contractProviderCompatibilityMap = this.parseContractProviderCompatibilityMap(providerSet);
        this.providerKeySet = providerSet.map((p) => p.key);
    }

    applyTokenQueryDefaults(tokenQuery) {
        tokenQuery.limit = tokenQuery.limit || DEFAULT_LIMIT;
        tokenQuery.orderBy = tokenQuery.orderBy || { date: "DESC" };

        return tokenQuery;
    }

    normalizeTokenQuery(tokenQuery) {
        const normalizedQueryPartialMap = {};

        for (let i = 0; i < SELECTOR_QUERY_FIELDS.length; i++) {
            const field = SELECTOR_QUERY_FIELDS[i];
            const fieldValue = tokenQuery[field];

            if (!fieldValue || (typeof fieldValue === "object" && !Array.isArray(fieldValue))) {
                continue;
            }

            if (Array.isArray(fieldValue)) {
                normalizedQueryPartialMap[field] = { $in: fieldValue };
            }

            normalizedQueryPartialMap[field] = { $eq: fieldValue };
        }

        return Object.assign({}, tokenQuery, normalizedQueryPartialMap);
    }

    /**
     * Iterate through the configured set of providers and construct a map of contract addresses to
     * set of providers that support the contract.
     * @param {Array} providerSet Set of TokenProviders to pair to contract addresses based off of compatibility.
     * @returns {Object} Map of contract address to provider set.
     * @ignore
     */
    parseContractProviderCompatibilityMap(providerSet) {
        return providerSet.reduce((acc, p) => {
            for (let i = 0; i < p.contracts.length; i++) {
                const contract = p.contracts[i];

                acc[contract] = acc[contract] || [];

                acc[contract].push(p);
            }

            return acc;
        }, {});
    }

    /**
     * Iterate over TID set and determine which providers support its contract.
     * Return a map of provider to TID scoped {@link tokenQuery} partials.
     *
     * Providers with a wildcard in their contract set will be used as a fallback if no
     * providers support the TID's contract directly.
     *
     * The resulting mapped query is merged with the remaining applicable paramters from
     * {@link tokenQuery} before tokens are fetched.
     * @param {Array<String>} tidSet Set of TIDs to scope token results.
     * @returns {Object} Map of provider key to TID scoped {@link tokenQuery}
     * @ignore
     */
    parseProviderTIDQueryPartialMap(tidQueryPartial) {
        let tidSet;

        // Coerce tid selector query input into Array.
        if (tidQueryPartial.$eq || tidQueryPartial.$neq) {
            tidSet = [tidQueryPartial.$eq || tidQueryPartial.$neq];
        } else {
            tidSet = tidQueryPartial.$in || tidQueryPartial.$nin;
        }

        // Iterate through all TIDs being interfaced with and create a map of provider to token query partial.
        return tidSet.reduce((acc, tid) => {
            const { contract } = parseTID(tid);
            const contractSupportedProviders = this.contractProviderCompatibilityMap[contract];
            const wildcardProviders = this.contractProviderCompatibilityMap["*"];

            let supportedProviders;

            if (contractSupportedProviders.length) {
                supportedProviders = [contractSupportedProviders[0]];
            } else if (wildcardProviders.length) {
                supportedProviders = wildcardProviders;
            }

            /**
             * Iterate through all supported providers. In the event that no provider directly supports
             * the TID's contract, all wildcard providers will be queried.
             */
            for (let i = 0; i < supportedProviders.length; i++) {
                const provider = supportedProviders[i];

                if (tokenQuery.$eq || tokenQuery.$neq) {
                    const selectorQueryFilter = tokenQuery.$eq ? "$in" : "$nin";

                    acc[providerKey].tid = { [selectorQueryFilter]: [tid] };
                } else if (tokenQuery.$in || tokenQuery.$nin) {
                    const selectorQueryFilter = tokenQuery.$in ? "$in" : "$nin";

                    acc[provider.key].tid = acc[provider.key].tid || {
                        [selectorQueryFilter]: [],
                    };

                    acc[provider.key].tid[selectorQueryFilter].push(tid);
                }
            }

            return acc;
        }, {});
    }

    /**
     * Anaylze tokenQuery input, current pageCursor, contract supported providers, build provider specific
     * tokenQuery and return map of provider key to provider specific tokenQuery.
     * @param {*} tokenQuery @see {@link tokenQuery}
     * @param {*} pageCursor @see {@link pageCursor}
     * @returns {Object} Map of provider key to provider specific tokenQuery partial.
     * @ignore
     */
    parseProviderQueryMap(tokenQuery, pageCursor) {
        /**
         * Build queries for providers that support TID targeted contracts.
         * Falls back to any multi-indexer (contract set with '*').
         */
        const tidQueryPartialMap = tokenQuery.tid ? this.parseProviderTIDQueryPartialMap(tokenQuery.tid) : {};

        return this.providerKeySet.reduce((acc, providerKey) => {
            const paginationQueryPartial = pageCursor ? pageCursor[providerKey] : {};
            const tidQueryPartial = tidQueryPartialMap[providerKey];

            if (tidQueryPartial) {
                // Merge remaining tokenQuery parameters with TID scoped {@link tokenQuery} partial.
                acc[providerKey] = Object.assign({}, tokenQuery, tidQueryPartial, paginationQueryPartial);
            } else {
                // Utilize tokenQuery if no provider query map is provided.
                acc[providerKey] = Object.assign({}, tokenQuery, paginationQueryPartial);
            }

            return acc;
        }, {});
    }
}
