export function parseTID(tid) {
    const delimiterIndex = tid.indexOf(":");
    const contract = tid.substring(0, delimiterIndex);
    const tokenId = tid.substring(delimiterIndex + 1);

    return { contract, tokenId };
}
