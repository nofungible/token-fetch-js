The following table should be used to determine {@link selectorQuery} selector compatibility.

Simple queries like gathering feeds, or user collections, are fine.

For more complex querying use {@link TezosProviders.TezTok}, or {@link TezosProviders.ObjktcomNative} as they both index fx(hash) transactions.

| selectorQuery field | Compatible Selectors              |
| ------------------- | --------------------------------- |
| tid                 | `*` (tokenQuery requires `owner`) |
| issuer              | `$eq`, `$in`                      |
| mimeType            | `*`                               |
| owner               | `$eq`                             |

Notes:
- If an incompatible selector is passed the indexer will throw an error.
- Valid `mimeType` values: `application/x-directory`.