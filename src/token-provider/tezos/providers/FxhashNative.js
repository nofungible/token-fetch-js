import { default as request } from "axios";

export default class FxhashNative {
    static key = "FXHASH_NATIVE";

    contract = "KT1KEa8z6vWXDJrVqtMrAeDVzsvxat3kHaCE";
    displayName = "fx(hash)";
    homepage = "https://www.fxhash.xyz";
    host = "https://api.fxhash.xyz/graphql";

    get key() {
        return FxhashNative.key;
    }

    fetchTokens(tokenQuery = {}) {
        tokenQuery.limit = tokenQuery.limit || 50;

        // @TODO build ownerless id fetch. This code was pulled from Objktiv where ownerless by-id fetching wasn't utilized.
        if (tokenQuery.idList && !tokenQuery.owner) {
            throw new Error(
                this.key +
                    " token provider cannot query tokens by ID without an owner!"
            );
        }

        return tokenQuery.idList
            ? this.getWalletTokensById(tokenQuery)
            : this.getTokens(tokenQuery);
    }

    buildGraphQLTokenQuery(tokenQuery) {
        let dateConstraint;

        // Build date constraint.
        if (tokenQuery.before) {
            dateConstraint =
                'filters: {createdAt_lt: "' + tokenQuery.before + '"}';
        } else if (tokenQuery.after) {
            dateConstraint =
                'filters: {createdAt_gt: "' + tokenQuery.before + '"}';
        }

        // Build token constraint; add date constraint, issuer constraint, and pagination constraints.
        const tokenConstraint =
            !tokenQuery.issuer && !tokenQuery.limit && !tokenQuery.skip
                ? ""
                : "(" +
                  (dateConstraint ? dateConstraint + ", " : "") +
                  (tokenQuery.issuer
                      ? 'author_in: "' + tokenQuery.issuer + '", '
                      : "") +
                  (tokenQuery.limit ? "take: " + tokenQuery.limit + ", " : "") +
                  (tokenQuery.skip ? "skip: " + tokenQuery.skip : "") +
                  'sort: {createdAt: "DESC"}' +
                  ")";

        // Build owner constraint
        const ownerConstraint = tokenQuery.owner
            ? '(id: "' + tokenQuery.owner + '")'
            : "";

        // Build GraphQL query using all constraints.
        return (
            "query Query {" +
            "\n  user" +
            ownerConstraint +
            " {" +
            "\n    id" +
            "\n    objkts" +
            tokenConstraint +
            " {" +
            this.getGraphQLTokenFields() +
            "\n    }" +
            "\n  }" +
            "\n}"
        );
    }

    async getTokens(tokenQuery) {
        const fetchResponse = await this.queryIndexer({
            operationName: "Query",
            query: this.buildGraphQLTokenQuery(tokenQuery),
        });

        return fetchResponse &&
            fetchResponse.data &&
            fetchResponse.data.user &&
            fetchResponse.data.user.objkts
            ? fetchResponse.data.user.objkts.map(
                  this.parseTokenMetadata.bind(this)
              )
            : [];
    }

    // @TODO move query logic to getAllWalletTokens, and convert parsing logic below to respect normalized model.
    async getWalletTokensById(tokenQuery) {
        // Gather all token metadata for the target wallet. Indexer does not allow querying tokens by ID.
        const fetchResponse = await this.queryIndexer({
            operationName: "GenerativeTokens",
            query:
                "query GenerativeTokens($userId: String) {" +
                "user(id: $userId) {" +
                "  entireCollection {" +
                this.getGraphQLTokenFields() +
                "  }" +
                "}" +
                "}",
            variables: {
                userId: tokenQuery.owner,
            },
        });

        const tokenMetadataSet =
            fetchResponse &&
            fetchResponse.data &&
            fetchResponse.data.user &&
            fetchResponse.data.user.entireCollection;

        if (!tokenMetadataSet || !tokenMetadataSet.length) {
            return [];
        }

        // Filter token metadata by target ID's.
        tokenMetadataSet = tokenMetadataSet.filter(function (token) {
            return tokenQuery.idList.indexOf(token.id) !== -1;
        });

        if (!tokenMetadataSet.length) {
            return [];
        }

        // Map of filters to filter handlers. Each handler will be applied if the filter is given in the query.
        const filterMap = {
            before: function (beforeDate, tokens) {
                return tokens.filter(function (token) {
                    return (
                        new Date(token.createdAt).getTime() <
                        new Date(beforeDate).getTime()
                    );
                });
            },
            after: function (afterDate, tokens) {
                return tokens.filter(function (token) {
                    return (
                        new Date(token.createdAt).getTime() >
                        new Date(afterDate).getTime()
                    );
                });
            },
            issuer: function (issuerAddress, tokens) {
                return tokens.filter(function (token) {
                    return token.issuer.address === issuerAddress;
                });
            },
        };

        const filterOptions = Object.keys(filterMap);

        // Iterate through all possible token filter handlers, and apply any that are required.
        for (let i = 0; i < filterOptions.length; i++) {
            const filterKey = filterOptions[i];
            const filterValue = tokenQuery[filterKey];

            if (filterValue) {
                tokens = filterHandlerMap[filterKey](filterValue, tokens);
            }
        }

        if (!tokens.length) {
            return [];
        }

        // Sort filtered results.
        tokens = tokens.sort(function (a, b) {
            return b.createdAt - a.createdAt;
        });

        /**
         * Start and end indexes utilized for pagination of filtered collection results.
         */

        const startIndex = tokenQuery.skip || 0;
        const endIndex = tokenQuery.limit
            ? startIndex + tokenQuery.limit
            : tokens.length;

        endIndex > tokens.length ? (endIndex = tokens.length) : endIndex;

        if (startIndex >= endIndex) {
            return [];
        }

        // Apply pagination via start/end indexes.
        return tokens
            .slice(startIndex, endIndex)
            .map(this.parseTokenMetadata.bind(this));
    }

    getGraphQLTokenFields() {
        return (
            "\n      id" +
            "\n      assigned" +
            "\n      iteration" +
            "\n      owner {" +
            "\n        id" +
            "\n        name" +
            "\n        flag" +
            "\n        avatarUri" +
            "\n        __typename" +
            "\n      }" +
            "\n      issuer {" +
            "\n        name" +
            "\n        flag" +
            "\n        author {" +
            "\n          id" +
            "\n          name" +
            "\n          flag" +
            "\n          avatarUri" +
            "\n        }" +
            "\n      }" +
            "\n      name" +
            "\n      metadata" +
            "\n      createdAt"
        );
    }

    parseTokenMetadata(tokenMetadata) {
        return {
            count: 1,
            contract: this.contract,
            createdAt: tokenMetadata.createdAt,
            description: tokenMetadata.metadata.description,
            identifier: tokenMetadata.id,
            ipfsLink: tokenMetadata.metadata.artifactUri,
            displayArtifactIpfsAddress: tokenMetadata.metadata.displayUri,
            issuer: {
                address: tokenMetadata.issuer.author.id,
                handle: tokenMetadata.issuer.author.name,
                platform: this.key,
                platformDisplay: this.displayName,
            },
            name: tokenMetadata.name,
            platformUri: this.homepage + "/gentk/" + tokenMetadata.id,
            platformIssuerUri:
                this.homepage + "/pkh/" + tokenMetadata.issuer.author.id,
            type: "application",
            mime: "application/x-directory",
            tid: this.contract + ":" + tokenMetadata.id,
        };
    }

    async queryIndexer(data) {
        const response = await request(this.host, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data,
        });

        return response.data;
    }
}
