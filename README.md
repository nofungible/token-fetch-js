# TokenFetchJS
[INSTALL](#user-content-install) | [IMPORT](#user-content-import) | [USE](#user-content-use) | [CONTRIBUTE](#user-content-contribute) | [DOCS](https://nofungible.github.io/token-fetch-js/module-TokenFetchJS.html)

Easily fetch tokens from popular token indexers.

Currently supports Tezos, but it is designed in a chain agnostic way. If you've got indexers for a chain we can add them!

Works in browser and server.

## Install
`npm install token-fetch`
`npm install token-fetch-browser`

## Import
```
// import/export
import {factory, providers: {Tezos}} from 'token-fetch';

// CommonJS
const {factory, providers: {Tezos}} = require('token-fetch');

// Browser
const {factory, providers: {Tezos}} = window.TokenFetchJS;
```

## Use
```
const TeiaIndexer = new Tezos.TeiaRocks('teia-indexer');
const FxhashIndexer = new Tezos.FxhashNative('fxhash-indexer');
const tezosFetcher = factory([TeiaIndexer, FxhashIndexer]);

const {
    tokens, // Set of token metadata
    cursor // Sequential pagination cursor
} = await tezosTokenFetcher.fetchTokens(TOKEN_QUERY);
```
[Token query schema](https://nofungible.github.io/token-fetch-js/global.html#tokenQuery)
[Token metadata schema](https://nofungible.github.io/token-fetch-js/global.html#tokenMetadata)

# Contribute
- Clone
- Improve
- Document
- Test
- PR

All are welcome!
