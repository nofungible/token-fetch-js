# TokenFetchJS
Easily fetch tokens from popular token indexers.

Currently supports Tezos, but it is designed in a chain agnostic way. If you've got indexers for a chain we can add them!

Support for browser and server.

[INSTALL](#user-content-install) | [IMPORT](#user-content-import) | [USE](#user-content-use) | [CONTRIBUTE](#user-content-contribute) | [DOCS](https://nofungible.github.io/token-fetch-js/module-TokenFetchJS.html)

# Quick Use

## Install
`npm install token-fetch`

`npm install token-fetch-browser`

## Import
```
// import/export
import {TokenFetch, providers: {Tezos}} from token-fetch-js;

// CommonJS
const {TokenFetch, providers: {Tezos}} = require('token-fetch-js');

// Browser
const {TokenFetch, providers: {Tezos}} = window.TokenFetchJS;
```

## Use
```
const tezosTokenFetcher = new TokenFetch(Tezos);

tezosTokenFetcher.fetchTokens(TOKEN_QUERY)
    .then(([TOKEN_METADATA, ...]) => /* doStuff() */)
    .catch(console.error);
```
[TOKEN_QUERY](https://nofungible.github.io/token-fetch-js/global.html#tokenQuery)

[TOKEN_METADATA](https://nofungible.github.io/token-fetch-js/global.html#tokenMetadata)

# Contribute
- Clone
- Improve
- Document
- Test
- PR

All are welcome!