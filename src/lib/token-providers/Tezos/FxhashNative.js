import GraphQLProvider from "../../../class/GraphQLProvider";
import { parseTID } from "../../../lib/util";

const V1_CONTRACT = "KT1KEa8z6vWXDJrVqtMrAeDVzsvxat3kHaCE";
const V2_CONTRACT = "KT1U6EHmNxJTkvaWJ4ThczG4FSDaHC21ssvi";

/**
 * Native fx(hash) indexer. Lacks support for many selectors. Review {@tutorial FxhashNative_Selector_Compatibility} for more information.
 * @implements TokenProvider
 * @memberof TezosProviders
 */

class FxhashNative extends GraphQLProvider {
    /**
     * @param {String} key Unique {@link TokenProvider} class instance identifier.
     */
    constructor(key) {
        super(key, [V1_CONTRACT, V2_CONTRACT], "https://api.fxhash.xyz/graphql");
    }

    mimeType = "application/x-directory"; // move to config and use in multi indexers too
    platformName = "fx(hash)"; // move to constants map of contract > display name
    platformUrl = "https://www.fxhash.xyz"; // move to constants/config file contract > site map same for display name
    v1Contract = V1_CONTRACT;
    v2Contract = V2_CONTRACT;

    async fetchTokens(tokenQuery) {
        const { mimeType: mimeTypeQueryPartial } = tokenQuery;

        if (mimeTypeQueryPartial) {
            const { $eq, $neq, $in } = mimeTypeQueryPartial;

            if (
                ($eq && $eq !== this.mimeType) ||
                ($in && !$in.includes(this.mimeType)) ||
                ($nin && $nin.includes(this.mimeType)) ||
                ($neq && $neq === this.mimeType)
            ) {
                return [];
            }
        }

        if (tokenQuery.owner) {
            if (tokenQuery.tid) {
                return this.fetchOwnerTokensByTID(tokenQuery);
            } else {
                return this.fetchOwnerTokens(tokenQuery);
            }
        }

        if (tokenQuery.tid) {
            throw new Error(`${this.key} does not support querying for tokens by ID without an owner`);
        }

        return this.fetchTokensWithoutOwner(tokenQuery);
    }

    async fetchOwnerTokensByTID(tokenQuery) {
        const response = await this.queryGraphQL(
            `query Query($userId: String) {
                user(id: $userId) {
                  entireCollection {
                    ${this.getObjktFieldsString()}
                  }
                }
            }`,
            { userId: tokenQuery.owner }
        );

        const tokens = response && response.user && response.user.entireCollection;

        if (!tokens || !tokens.length) {
            return [];
        }

        const { $eq, $neq, $in, $nin } = tokenQuery.tid;

        let tidSet;

        if ($eq || $neq) {
            tidSet = [$eq || $neq];
        } else if ($in || $nin) {
            tidSet = $in || $nin;
        }

        const idSet = tidSet.map((tid) => parseTID(tid).tokenId);
        const tokenMetadataSet = tokens.filter(function (token) {
            const include = $eq || $in;

            return include ? idSet.includes(token.id) : !idSet.includes(token.id);
        });

        if (!tokenMetadataSet.length) {
            return [];
        }

        const filterHandlerMap = {
            before: function (beforeDate, tokens) {
                const beforeTimestamp = new Date(beforeDate).getTime();

                return tokens.filter(function (token) {
                    const tokenTimestamp = new Date(token.createdAt).getTime();

                    return tokenTimestamp < beforeTimestamp;
                });
            },
            after: function (afterDate, tokens) {
                const afterTimestamp = new Date(afterDate).getTime();

                return tokens.filter(function (token) {
                    const tokenTimestamp = new Date(token.createdAt).getTime();

                    return tokenTimestamp > afterTimestamp;
                });
            },
            issuer: function (issuerAddress, tokens) {
                const { $eq, $neq, $in, $nin } = tokenQuery.issuer;

                let issuerAddressSet;

                if ($eq || $neq) {
                    issuerAddressSet = [$eq || $neq];
                } else if ($in || $nin) {
                    issuerAddressSet = $in || $nin;
                }

                const include = $eq || $in;

                return tokens.filter(function (token) {
                    return include
                        ? issuerAddressSet.includes(token.issuer.address)
                        : !issuerAddressSet.includes(token.issuer.address);
                });
            },
        };

        const filterOptions = Object.keys(filterHandlerMap);

        let filteredTokens = tokenMetadataSet;

        for (let i = 0; i < filterOptions.length; i++) {
            const filterKey = filterOptions[i];
            const filterValue = tokenQuery[filterKey];

            if (filterValue) {
                filteredTokens = filterHandlerMap[filterKey](filterValue, filteredTokens);
            }
        }

        if (!filteredTokens.length) {
            return [];
        }

        const sortedTokens = filteredTokens.sort(function (a, b) {
            return b.createdAt - a.createdAt;
        });

        const startIndex = tokenQuery.skip || 0;

        let endIndex = tokenQuery.limit ? startIndex + tokenQuery.limit : sortedTokens.length;

        endIndex > sortedTokens.length ? (endIndex = sortedTokens.length) : endIndex;

        if (startIndex >= endIndex) {
            return [];
        }

        return sortedTokens.slice(startIndex, endIndex).map(this.parseTokenMetadata.bind(this));
    }

    async fetchOwnerTokens(tokenQuery) {
        const variables = {
            userId: tokenQuery.owner,
            take: tokenQuery.limit,
        };

        const filters = this.parseObjktQueryFilters(tokenQuery);

        if (filters) {
            variables.filters = filters;
        }

        const results = await this.queryGraphQL(
            `query UserTokenQuery($userId: String, $filters: ObjktFilter, $skip: Int, $take: Int, $sort: ObjktsSortInput) {
                user(id: $userId) {
                    objkts(filters: $filters, skip: $skip, take: $take, sort: $sort) {
                        ${this.getObjktFieldsString()}
                    }
                }
            }`,
            variables
        );

        return results.user.objkts.map(this.parseTokenMetadata.bind(this));
    }

    async fetchTokensWithoutOwner(tokenQuery) {
        const variables = {
            take: tokenQuery.limit,
        };

        const {
            orderBy: { date: dateSortParameter },
        } = tokenQuery;

        if (dateSortParameter) {
            variables.sort = { createdAt: dateSortParameter === "DESC" ? "DESC" : "ASC" };
        }

        const filters = this.parseObjktQueryFilters(tokenQuery);

        if (filters) {
            variables.filters = filters;
        }

        const response = await this.queryGraphQL(
            `query TokenQuery($filters: ObjktFilter, $skip: Int, $take: Int) {
                objkts(filters: $filters, skip: $skip, take: $take) {
                    ${this.getObjktFieldsString()}
                }
            }`,
            variables
        );

        return response.objkts.map(this.parseTokenMetadata.bind(this));
    }

    getObjktFieldsString() {
        return `id
                assigned
                iteration
                owner {
                    id
                    name
                    flag
                    avatarUri
                    __typename
                }
                issuer {
                    name
                    flag
                    author {
                        id
                        name
                        flag
                        avatarUri
                    }
                }
                name
                metadata
                createdAt
                version`;
    }

    parseObjktQueryFilters(tokenQuery) {
        const { after, before, issuer } = tokenQuery;

        const filters = {};

        if (before) {
            filters.createdAt_lt = before;
        }

        if (after) {
            filters.createdAt_gt = after;
        }

        if (issuer) {
            const { $eq, $neq, $in, $nin } = issuer;

            if ($neq || $nin) {
                throw new Error(`$neq | $nin not supported by ${this.key} issuer select query partials`);
            }

            const issuerAddressSet = $eq ? [$eq] : $in;

            filters.author_in = issuerAddressSet;
        }

        return (Object.keys(filters).length && filters) || null;
    }

    parseTokenMetadata(token) {
        const {
            id: tokenId,
            createdAt,
            issuer: { author: { id: issuerAddress } = {} },
            metadata: { artifactUri: artifact, description, displayUri: display },
            name,
            version: contractVersion,
        } = token;

        const contractAddress = contractVersion === 0 ? this.v1Contract : this.v2Contract;

        return {
            contract: {
                address: contractAddress,
                tokenId,
            },
            createdAt,
            description,
            ipfs: {
                artifact,
                display,
            },
            issuer: {
                address: issuerAddress,
            },
            mime: "application/x-directory",
            name,
            // platform: {
            //     name: null,
            //     issuer: {
            //         handle: null,
            //         url: null,
            //     },
            // },
            tid: `${contractAddress}:${tokenId}`,
            _metadata: {
                providerKey: this.key,
            },
        };
    }
}

export default FxhashNative;
