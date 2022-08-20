import { default as request } from "axios";

export default class TeiaRocks {
    static key = "TEIA_ROCKS";

    contract = "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton"; // hic et nunc contract address
    displayName = "teia.rocks";
    homepage = "https://teia.art";
    host = "https://api-v5.teia.rocks/v1/graphql";

    get key() {
        return TeiaRocks.key;
    }

    buildGraphQLTokenQuery(tokenQuery) {
        const issuerConstraint = "";

        if (tokenQuery.issuer) {
            issuerConstraint =
                'creator: {address: {_eq: "' + tokenQuery.issuer + '"}}';
        }

        const tokenIdConstraint = "";

        if (
            tokenQuery.idList &&
            Array.isArray(tokenQuery.idList) &&
            tokenQuery.idList.length
        ) {
            tokenIdConstraint = "_or: [";

            // Iterate through the list of IDs, and append each ID to the _or query list.
            for (let i = 0; i < tokenQuery.idList.length; i++) {
                tokenIdConstraint +=
                    "{token_id: {_eq: " + tokenQuery.idList[i] + "}}";

                // Add comma between IDs if we aren't on the last one.
                if (i < tokenQuery.idList.length - 1) {
                    tokenIdConstraint += ",";
                }
            }

            tokenIdConstraint += "]";
        }

        return (
            "query collectorGallery {" +
            "\n  token_holder(" +
            (tokenQuery.limit ? "limit: " + tokenQuery.limit + ", " : "") +
            (tokenQuery.skip ? "offset: " + tokenQuery.skip + ", " : "") +
            "where: {" +
            (tokenQuery.owner
                ? 'holder_id: {_eq: "' + tokenQuery.owner + '"}, '
                : "") +
            (tokenQuery.owner ? 'quantity: {_gt: "0"}, ' : "") +
            (tokenIdConstraint ? tokenIdConstraint + ", " : "") +
            (issuerConstraint || tokenQuery.after || tokenQuery.before
                ? "token: {" +
                  (creatorAddressConstraint ? issuerConstraint + ", " : "") +
                  (tokenQuery.after || tokenQuery.before
                      ? "timestamp: {" +
                        (tokenQuery.after ? "_gt" : "_lt") +
                        ': "' +
                        (tokenQuery.after || tokenQuery.before) +
                        '"}'
                      : "") +
                  "}"
                : "") +
            "}" +
            ", order_by: {token: {timestamp: desc}}" +
            ") {" +
            "\n    token {" +
            "\n      id" +
            "\n      artifact_uri" +
            "\n      display_uri" +
            "\n      thumbnail_uri" +
            "\n      timestamp" +
            "\n      mime" +
            "\n      title" +
            "\n      description" +
            "\n      royalties" +
            "\n      creator {" +
            "\n        address" +
            "\n        name" +
            "\n      }" +
            "\n    }" +
            "\n  }" +
            "\n}"
        );
    }

    async fetchTokens(tokenQuery = {}) {
        tokenQuery.limit = tokenQuery.limit || DEFAULT_LIMIT;

        const fetchResponse = await request(this.host, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                operationName: "collectorGallery",
                query: this.buildGraphQLTokenQuery(tokenQuery),
            },
        });

        const tokenMetadataSet =
            fetchResponse &&
            fetchResponse.data &&
            fetchResponse.data.data &&
            fetchResponse.data.data.token_holder;

        return tokenMetadataSet
            ? tokenMetadataSet.map(this.parseTokenMetadata.bind(this))
            : [];
    }

    parseTokenMetadata(tokenMetadata) {
        const token = tokenMetadata.token;
        const mimeBase = token.mime.split("/")[0];
        const tokenType =
            (mimeBase === "image" && "image") ||
            (mimeBase === "video" && "video") ||
            (mimeBase === "model" && "model") ||
            "application";

        return {
            contract: this.contract,
            count: null,
            createdAt: token.timestamp,
            description: token.description,
            identifier: token.id,
            ipfsLink: token.artifact_uri,
            displayArtifactIpfsAddress: token.display_uri,
            name: token.title,
            issuer: {
                address: token.creator.address,
                handle: token.creator.name,
                platform: this.key,
                platformDisplay: this.displayName,
            },
            platformUri: this.homepage + "/objkt/" + token.id,
            platformIssuerUri: this.homepage + "/tz/" + token.creator.address,
            type: tokenType,
            mime: token.mime,
            tid: this.contract + ":" + token.id,
        };
    }
}
