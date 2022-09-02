import GraphQLProvider from "../../../class/GraphQLProvider";

/**
 * Indexer provided by teia.rocks. Indexes FA2 tokens minted on the hic et nunc
 * minting contract, and swaps originated on the Teia Community swap contracts.
 * @implements TokenProvider
 * @memberof TezosProviders
 */
class TeiaRocks extends GraphQLProvider {
    constructor(key) {
        const henContract = "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton";

        super(key, [henContract], "https://api-v5.teia.rocks/v1/graphql");

        this.contract = henContract;
    }

    displayName = "teia.rocks";
    homepage = "https://teia.art";

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

        // Omit tokens with no timestamp value.
        variables.where = variables.where || {};
        variables.where._and = variables.where._and || [];
        variables.where._and.push({
            timestamp: { _is_null: false },
        });

        const query = `query Token($where: token_bool_exp, $limit: Int, $orderBy: [token_order_by!]) {
                            token(where: $where, limit: $limit, order_by: $orderBy) {
                                id
                                artifact_uri
                                display_uri
                                thumbnail_uri
                                timestamp
                                mime
                                title
                                description
                                royalties
                                creator {
                                    address
                                    name
                                }
                            }
                        }`;

        const response = await this.queryGraphQL(query, variables);

        return response.token.map(this.parseTokenMetadata.bind(this));
    }

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
            whereClause.token_holders = {
                holder: {
                    address: this.parseSelectorQuery(owner),
                },
            };
        }

        if (issuer) {
            whereClause.creator = {
                address: this.parseSelectorQuery(issuer),
            };
        }

        if (tid) {
            const { $in, $nin } = tid;

            const selector = $in ? "_in" : "_nin";

            whereClause.id = { [selector]: ($in || $nin).map((tid) => tid.substring(tid.indexOf(":") + 1)) };
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
            creator: { address: issuerAddress },
            description,
            display_uri: ipfsDisplay,
            id: tokenId,
            mime: mimeType,
            timestamp: createdAt,
            title: name,
        } = token;

        return {
            contract: {
                address: this.contract,
                tokenId,
            },
            createdAt,
            description,
            ipfs: {
                artifact: ipfsArtifact,
                display: ipfsDisplay,
            },
            issuer: {
                address: issuerAddress,
            },
            mimeType,
            name,
            // platform: {
            //     name: null,
            //     issuer: {
            //         handle: null,
            //         url: null,
            //     },
            // },
            tid: `${this.contract}:${tokenId}`,
            _metadata: {
                providerKey: this.key,
            },
        };
    }
}

export default TeiaRocks;

