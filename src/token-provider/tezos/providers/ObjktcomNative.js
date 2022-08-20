import { default as request } from "axios";

export default class ObjktcomNative {
    static key = "OBJKTCOM_NATIVE";

    displayName = "objkt.com";
    homepage = "https://objkt.com";
    host = "https://data.objkt.com/v2/graphql";

    get key() {
        return ObjktcomNative.key;
    }

    constructor(contractIgnoreSet) {
        contractIgnoreSet && (this.contractIgnoreSet = contractIgnoreSet);
    }

    buildGraphQLTokenQuery(tokenQuery) {
        let dateConstraint;

        if (tokenQuery.before) {
            dateConstraint = 'timestamp: {_lt: "' + tokenQuery.before + '"}';
        } else if (tokenQuery.after) {
            dateConstraint = 'timestamp: {_gt: "' + tokenQuery.after + '"}';
        }

        return (
            "query FetchTokens {" +
            "\n  token_holder(" +
            (tokenQuery.limit ? "limit: " + tokenQuery.limit + ", " : "") +
            (tokenQuery.skip ? "offset: " + tokenQuery.skip + ", " : "") +
            "where: {" +
            (tokenQuery.idList
                ? "token_pk: {_in: [" + tokenQuery.idList.join(",") + "]}"
                : "") +
            (tokenQuery.owner
                ? 'holder_address: {_eq: "' + tokenQuery.owner + '"}, '
                : "") +
            "token: {" +
            (dateConstraint ? dateConstraint + ", " : "") +
            (tokenQuery.owner ? "fa: { creator: { address: {} } }, " : "") +
            (!this.contractIgnoreSet || !this.contractIgnoreSet.length
                ? ""
                : this.contractIgnoreSet.reduce(function (acc, contract, i) {
                      if (i === 0) {
                          acc = 'fa_contract: {_neq: "' + contract + '"}';
                      } else if (i === 1) {
                          acc +=
                              ', _and: {fa_contract: {_neq: "' +
                              contract +
                              '"}}';
                      } else {
                          acc =
                              acc.slice(0, acc.length - 1) +
                              ', _and: {fa_contract: {_neq: "' +
                              contract +
                              '"}}}';
                      }

                      return acc;
                  }, "")) +
            "}, " +
            'quantity: {_gt: "0"}' +
            "}" +
            ", order_by: {token: {timestamp: desc}}" +
            ") {" +
            "\n    token {" +
            "\n      pk" +
            "\n      description" +
            "\n      display_uri" +
            "\n      token_id" +
            "\n      timestamp" +
            "\n      artifact_uri" +
            "\n      name" +
            "\n      mime" +
            "\n      fa {" +
            "\n        collection_id" +
            "\n        contract" +
            "\n        creator {" +
            "\n          address" +
            "\n          alias" +
            "\n          tzdomain" +
            "\n        }" +
            "\n        description" +
            "\n        editions" +
            "\n        name" +
            "\n      }" +
            "\n      creators {" +
            "\n        holder {" +
            "\n          address" +
            "\n          alias" +
            "\n        }" +
            "\n      }" +
            "\n      holders {" +
            "\n          quantity" +
            "\n          holder_address" +
            "\n      }" +
            "\n    }" +
            "\n  }" +
            "\n}"
        );
    }

    async fetchTokens(tokenQuery = {}) {
        tokenQuery.limit = tokenQuery.limit || 50;

        const fetchResponse = await request(this.host, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                operationName: "FetchTokens",
                query: this.buildGraphQLTokenQuery(tokenQuery),
            },
        });

        const tokenMetadataSet =
            fetchResponse &&
            fetchResponse.data &&
            fetchResponse.data.data &&
            fetchResponse.data.data.token_holder;

        return !tokenMetadataSet
            ? []
            : tokenMetadataSet.map((tokenMetadata) =>
                  this.parseTokenMetadata(tokenMetadata, tokenQuery)
              );
    }

    parseTokenMetadata(tokenMetadata, tokenQuery) {
        const mimeBase = tokenMetadata.token.mime.split("/")[0];
        const tokenType =
            (mimeBase === "image" && "image") ||
            (mimeBase === "video" && "video") ||
            (mimeBase === "model" && "model") ||
            "application";

        return {
            contract: tokenMetadata.token.fa.contract,
            count: !tokenQuery.owner
                ? null
                : tokenMetadata.token.holders.reduce(function (acc, holder) {
                      return holder.holder_address === tokenQuery.owner
                          ? holder.quantity
                          : acc;
                  }, 0),
            createdAt: tokenMetadata.token.timestamp,
            description: tokenMetadata.token.description,
            identifier: tokenMetadata.token.pk,
            ipfsLink: tokenMetadata.token.artifact_uri,
            displayArtifactIpfsAddress: tokenMetadata.token.display_uri,
            name: tokenMetadata.token.name,
            issuer: {
                address: tokenMetadata.token.fa.creator.address,
                handle: tokenMetadata.token.fa.creator.alias,
                platform: this.key,
                platformDisplay: tokenMetadata.token.fa.name,
            },
            platformUri:
                this.homepage +
                "/asset/" +
                tokenMetadata.token.fa.contract +
                "/" +
                tokenMetadata.token.token_id,
            platformIssuerUri:
                this.homepage +
                "/profile/" +
                tokenMetadata.token.fa.creator.address +
                "/created",
            type: tokenType,
            mime: tokenMetadata.token.mime,
            // @TODO switch to contract + contract ID
            tid: this.key + ":" + tokenMetadata.token.pk,
        };
    }
}
