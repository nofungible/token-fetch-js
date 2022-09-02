import GraphQLProvider from "../../../class/GraphQLProvider";
import { parseTID } from "../../../lib/util";

/**
 * {@link TokenProvider} class designed to interface with any HTTP reachable TezTok indexer.
 * You must provide your own TezTok API host.
 * @implements TokenProvider
 * @memberof TezosProviders
 */
class TezTok extends GraphQLProvider {
    /**
     * @param {String} key Unique TokenProvider instance identifier.
     * @param {Object} multiProviderOptions See {@link multiProviderOptions}.
     */
    constructor(providerKey, tezTokHost, options = {}) {
        const { contract: { allow: contractAllowSet } = {} } = options;

        super(providerKey, contractAllowSet || ["*"], tezTokHost);

        this.providerOptions = options;
    }

    async fetchTokens(tokenQuery) {
        const variables = {
            limit: tokenQuery.limit,
        };

        if (tokenQuery.orderBy.date) {
            variables.orderBy = [{ minted_at: tokenQuery.orderBy.date === "DESC" ? "desc" : "asc" }];
        }

        const whereClause = this.parseGraphQLWhereClause(tokenQuery);

        if (whereClause) {
            variables.where = whereClause;
        }

        // Omit tokens with no minted_at value.
        variables.where = variables.where || {};
        variables.where._and = variables.where._and || [];
        variables.where._and.push({
            minted_at: {
                _is_null: false,
            },
        });

        const query = `query Query_root($where: tokens_bool_exp, $limit: Int, $orderBy: [tokens_order_by!]) {
                            tokens(where: $where, limit: $limit, order_by: $orderBy) {
                                fa2_address,
                                minted_at,
                                description,
                                token_id,
                                artifact_uri,
                                display_uri,
                                artist_address,
                                artist_profile {
                                    alias
                                },
                                platform,
                                name,
                            }
                        }`;

        const response = await this.queryGraphQL(query, variables);

        return response.tokens.map(this.parseTokenMetadata.bind(this));
    }

    parseSelectorQuery(value) {
        const { $eq, $neq, $in, $nin } = value;

        if ($eq) {
            return { _eq: $eq };
        }

        if ($neq) {
            return { _neq: $neq };
        }

        if ($in) {
            return { _in: $in };
        }

        if ($nin) {
            return { _nin: $nin };
        }
    }

    parseGraphQLWhereClause(tokenQuery) {
        const { after, before, tid, issuer, mimeType, owner } = tokenQuery;

        const whereClause = {};

        if (before || after) {
            if (before && after) {
                whereClause.minted_at = {
                    _lt: before,
                    _gt: after,
                };
            } else if (before) {
                variables.minted_at = {
                    _lt: before,
                };
            } else if (after) {
                whereClause.minted_at = {
                    _gt: after,
                };
            }
        }

        if (owner) {
            whereClause.holdings = {
                holder_address: this.parseSelectorQuery(owner),
            };
        }

        if (issuer) {
            whereClause.artist_address = this.parseSelectorQuery(issuer);
        }

        const { contract: { allow: contractAllowSet, deny: contractDenySet } = {} } = this.providerOptions;

        if (contractAllowSet) {
            whereClause.fa2_address = {
                _in: contractAllowSet,
            };
        } else if (contractDenySet) {
            whereClause.fa2_address = {
                _nin: contractDenySet,
            };
        }

        if (tid) {
            const { $in: allowSet, $nin: denySet, $eq, $neq } = tid;

            let tidQueryPartialSet;

            if ($eq || $neq) {
                const { contract: tidContract, tokenId: tidTokenId } = parseTID($eq || $neq);

                if ($neq || this.isValidContract(tidContract)) {
                    const selector = $eq ? "_eq" : "_neq";

                    tidQueryPartialSet = [
                        {
                            [selector]: {
                                fa2_address: tidContract,
                                token_id: tidTokenId,
                            },
                        },
                    ];
                }
            } else {
                const tidSet = allowSet || denySet;

                tidQueryPartialSet = tidSet.reduce((acc, tid) => {
                    const { contract: tidContract, tokenId: tidTokenId } = parseTID(tid);

                    if ($nin || this.isValidContract(contract)) {
                        const selector = $in ? "_eq" : "_neq";

                        acc.push({
                            fa2_address: { [selector]: tidContract },
                            token_id: { [selector]: tidTokenId },
                        });
                    }

                    return acc;
                }, []);
            }

            if (tidQueryPartialSet.length) {
                whereClause._and = whereClause._and || [];

                whereClause._and.push({ _or: tidQueryPartialSet });
            }
        }

        if (mimeType) {
            whereClause.mime_type = this.parseSelectorQuery(mimeType);
        }

        return Object.keys(whereClause) ? whereClause : null;
    }

    parseTokenMetadata(token) {
        return {
            contract: {
                address: token.fa2_address,
                tokenId: token.token_id,
            },
            createdAt: token.minted_at,
            description: token.description,
            ipfs: {
                artifact: token.artifact_uri,
                display: token.display_uri,
            },
            issuer: {
                address: token.artist_address,
            },
            mimeType: token.mime_type,
            name: token.name,
            // @TODO Create parser for this based on each platform
            // platform: {
            //     name: null,
            //     issuer: {
            //         handle: null,
            //         url: null,
            //     },
            // },
            tid: `${token.fa2_address}:${token.token_id}`,
            _metadata: {
                providerKey: this.key,
            },
        };
    }

    isValidContract(contract) {
        const contractIsAllowed = !contractAllowSet || contractAllowSet.includes(contract);
        const contractIsDenied = contractDenySet && contractDenySet.includes(contract);

        return contractIsAllowed && !contractIsDenied;
    }
}

export default TezTok;
