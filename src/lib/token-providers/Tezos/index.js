/**
 * Built-in {@link TokenProvider} classes for the Tezos blockchain. Instantiate the providers that support the
 * contracts you wish to retrieve tokens from, and pass the resulting set to {@link module:TokenFetchJS.factory}.
 * @namespace TezosProviders
 */

import FxhashNative from "./FxhashNative";
import ObjktcomNative from "./ObjktcomNative";
import TeiaRocks from "./TeiaRocks";
import TezTok from "./TezTok";

export default {
    FxhashNative,
    ObjktcomNative,
    TeiaRocks,
    TezTok,
};
