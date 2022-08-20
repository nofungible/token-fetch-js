import TezosProviders from "./providers";

/**
 * Set of all supported Tezos providers.
 *
 * Building set here to represent the relationship between
 * providers (objkt.com ignoring contracts because we support them via other providers).
 */
const providerSet = [
    { provider: TezosProviders.FxhashNative },
    { provider: TezosProviders.TeiaRocks },
    {
        provider: TezosProviders.ObjktcomNative,
        ctorOptions: {
            /**
             * Ignore H=N/Teia & fx(hash) contracts since those are already
             * represented by other providers in the default provider set.
             */
            contractIgnoreSet: [
                "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton",
                "KT1KEa8z6vWXDJrVqtMrAeDVzsvxat3kHaCE",
            ],
        },
    },
];

export default function factory() {
    return providerSet.map((p) => new p.provider(p.ctorOptions || null));
}
