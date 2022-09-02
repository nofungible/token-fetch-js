import GraphQLProvider from "../../../class/GraphQLProvider";
import { parseTID } from "../../../lib/util";

/**
 * Native indexer for objkt.com.
 * @implements TokenProvider
 * @memberof TezosProviders
 */
class ObjktcomNative extends GraphQLProvider {
    /**
     * @param {String} key Unique TokenProvider instance identifier.
     * @param {Object} multiProviderOptions See {@link multiProviderOptions}.
     */
    constructor(key, options = {}) {
        super(key, ["*"], "https://data.objkt.com/v2/graphql");

        this.providerOptions = options;
    }

    platformName = "objkt.com";
    platformUrl = "https://objkt.com";

    async fetchTokens(tokenQuery) {
        const variables = {
            limit: tokenQuery.limit,
        };

        if (tokenQuery.orderBy.date) {
            variables.orderBy = [{ timestamp: tokenQuery.orderBy.date === "DESC" ? "desc" : "asc" }];
        }

        const whereClause = this.parseGraphQLWhereClause(tokenQuery);

        if (whereClause) {
            variables.where = whereClause;
        }

        variables.where = variables.where || {};
        variables.where._and = variables.where._and || [];
        variables.where._and.push({
            timestamp: {
                _is_null: false,
            },
        });

        const query = `query Token($where: token_bool_exp, $limit: Int, $orderBy: [token_order_by!]) {
                            token(where: $where, limit: $limit, order_by: $orderBy) {
                                pk
                                description
                                display_uri
                                token_id
                                timestamp
                                artifact_uri
                                name
                                mime
                                fa {
                                    collection_id
                                    contract
                                    creator {
                                        address
                                        alias
                                        tzdomain
                                    }
                                    description
                                    editions
                                    name
                                }
                                creators {
                                    holder {
                                        address
                                        alias
                                    }
                                }
                            }
                        }`;

        const fetchResponse = await this.queryGraphQL(query, variables);

        return fetchResponse.token.map((tokenMetadata) => this.parseTokenMetadata(tokenMetadata, tokenQuery));
    }

    isValidContract(contract) {
        const contractIsAllowed = !contractAllowSet || contractAllowSet.includes(contract);
        const contractIsDenied = contractDenySet && contractDenySet.includes(contract);

        return contractIsAllowed && !contractIsDenied;
    }

    // @TODO split parsing logic out by target object vs tokenQuery parameter.
    parseGraphQLWhereClause(tokenQuery) {
        const { after, before, tid, issuer, mimeType, owner } = tokenQuery;

        const whereClause = {};

        if (before || after) {
            if (before && after) {
                whereClause.timestamp = {
                    _lt: before,
                    _gt: after,
                };
            } else if (before) {
                whereClause.timestamp = {
                    _lt: before,
                };
            } else if (after) {
                whereClause.timestamp = {
                    _gt: after,
                };
            }
        }

        if (owner) {
            whereClause.holders = {
                holder_address: this.parseSelectorQuery(owner),
            };
        }

        if (issuer) {
            whereClause.fa = {
                creator_address: this.parseSelectorQuery(issuer),
            };
        }

        const { contract: { allow: contractAllowSet, deny: contractDenySet } = {} } = this.providerOptions;

        if (contractAllowSet) {
            whereClause.fa_contract = {
                _in: contractAllowSet,
            };
        } else if (contractDenySet) {
            whereClause.fa_contract = {
                _nin: contractDenySet,
            };
        }

        if (tid) {
            const { $in, $nin, $eq, $neq } = tid;

            let tidQueryPartialSet;

            if ($eq || $neq) {
                const { contract: tidContract, tokenId: tidTokenId } = parseTID($eq || $neq);

                if ($neq || this.isValidContract(tidContract)) {
                    const selector = $eq ? "_eq" : "_neq";

                    tidQueryPartialSet = [
                        {
                            [selector]: {
                                fa2_contract: tidContract,
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
                            fa2_contract: { [selector]: tidContract },
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
            whereClause.mime = this.parseSelectorQuery(mimeType);
        }

        return Object.keys(whereClause) ? whereClause : null;
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

    parseTokenMetadata(token) {
        const {
            artifact_uri: ipfsArtifact,
            creators,
            description,
            display_uri: ipfsDisplay,
            fa: { contract: contractAddress, creator: issuerMetadata },
            mime: mimeType,
            name,
            pk: tokenId,
            timestamp: createdAt,
        } = token;

        return {
            contract: {
                address: contractAddress,
                tokenId,
            },
            createdAt,
            description,
            ipfs: {
                artifact: ipfsArtifact,
                display: ipfsDisplay,
            },
            issuer: {
                address: (issuerMetadata && issuerMetadata.address) || creators[0].creator_address,
            },
            mimeType,
            name,
            // @TODO flesh this out w/ contract > platform metadata w/ objkt.com fallback
            // platform: {
            //     name: null,
            //     url: null,
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

export default ObjktcomNative;
