# TokenFetchJS
Easily fetch tokens from popular token indexers. Currently supports Tezos, but it is designed in a chain agnostic way. If you've got indexers for a chain we can add them!

Support for browser and server.
Powered by [axios](https://github.com/axios/axios)
[DOCS]()

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

tezosTokenFetcher.fetchTokens(QUERY_OBJECT).then((TOKEN_METADATA_SET) => /* doStuff() */).catch(console.error);
```
[QUERY_OBJECT]()
[TOKEN_METADATA_SET]()

# Contribute
- Clone
- Improve
- Document
- Test
- PR

All are welcome!