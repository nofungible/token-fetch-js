export default class TokenPaginator {
    constructor(tokenQuery, providerTokenMetadataMap) {
        this.tokens = this.parseTokenMetadataSet(tokenQuery, providerTokenMetadataMap);
        this.cursor = this.parseNextPageCursor(tokenQuery, providerTokenMetadataMap);
    }

    getPage() {
        return {
            cursor: this.cursor,
            tokens: this.tokens,
        };
    }

    parseTokenMetadataSet(tokenQuery, providerTokenMetadataMap) {
        // Convert token metadata 2d array into tid namespaced map of tokens to remove duplicates.
        const tidTokenMetadataMap = Object.values(providerTokenMetadataMap).reduce((acc, providerTokenMetadataSet) => {
            for (let i = 0; i < providerTokenMetadataSet.length; i++) {
                acc[providerTokenMetadataSet[i].tid] = providerTokenMetadataSet[i];
            }

            return acc;
        }, {});

        return this.sortTokenMetadataSet(tokenQuery, Object.values(tidTokenMetadataMap)).slice(0, tokenQuery.limit);
    }

    parseNextPageCursor(tokenQuery, providerTokenMetadataMap) {
        return Object.entries(providerTokenMetadataMap).reduce((acc, [providerKey, tokenMetadataSet]) => {
            // Only gather next page tokenQuery partial if the current query yielded max results.
            if (tokenMetadataSet.length === tokenQuery.limit) {
                const queryPartial = this.parsePaginationTokenQueryPartial(tokenQuery, tokenMetadataSet);

                if (queryPartial) {
                    acc[providerKey] = queryPartial;
                }
            }

            return acc;
        }, {});
    }

    sortTokenMetadataSet(tokenQuery, tokenMetadataSet) {
        const { orderBy: { date: dateParameter } = {} } = tokenQuery;

        if (dateParameter) {
            return tokenMetadataSet.sort((a, b) => {
                if (tokenQuery.orderBy.date === "ASC") {
                    return b.createdAt > a.createdAt ? -1 : 1;
                } else if (tokenQuery.orderBy.date === "DESC") {
                    return a.createdAt > b.createdAt ? -1 : 1;
                }
            });
        }

        return tokenMetadataSet;
    }

    /**
     * Given a set of token metadata and an orderBy parameter, gather the
     * provider specific query partial to facilitate gathering the next page of results.
     * @TODO
     *      - Migrate tokenQuery partial logic to TokenQueryParser
     *      - Offload work to TokenFetcher
     *      - Pass back date cursor only (just look for orderBy for cursor field-value)
     * @ignore
     */
    parsePaginationTokenQueryPartial(tokenQuery, tokenMetadataSet) {
        const dateParameter = tokenQuery.orderBy.date;

        if (dateParameter) {
            const lastCreatedAt = tokenMetadataSet[tokenMetadataSet.length - 1].createdAt;
            const cursorParameter = dateParameter === "DESC" ? "before" : "after";

            return { [cursorParameter]: lastCreatedAt };
        }

        return null;
    }
}
