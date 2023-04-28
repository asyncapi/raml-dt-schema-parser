# RAML Data Types Schema Parser

A schema parser for RAML data types.

> **Note**
> Version >= `3.0.0` of package is only supported by `@asyncapi/parser` version >= `2.0.0`.

> **Warning** 
> This package is not browser-compatible.

<!-- toc is generated with GitHub Actions do not remove toc markers -->

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)

<!-- tocstop -->

## Installation

```bash
npm install @asyncapi/raml-dt-schema-parser
// OR
yarn add @asyncapi/raml-dt-schema-parser
```

## Usage

```ts
import { Parser } from '@asyncapi/parser';
import { RamlDTSchemaParser } from '@asyncapi/raml-dt-schema-parser';

const parser = new Parser();
parser.registerSchemaParser(RamlDTSchemaParser()); 

const asyncapiWithRAML = `
asyncapi: 2.0.0
info:
  title: Example with RAML
  version: 0.1.0
channels:
  example:
    publish:
      message:
        schemaFormat: 'application/raml+yaml;version=1.0'
        payload: # The following is a RAML data type
          type: object
          properties:
            title: string
            author:
              type: string
              examples:
                anExample: Jack Johnson
`;

const { document } = await parser.parse(asyncapiWithRAML);
```

```js
const { Parser } = require('@asyncapi/parser');
const { RamlDTSchemaParser } = require('@asyncapi/raml-dt-schema-parser');

const parser = new Parser();
parser.registerSchemaParser(RamlDTSchemaParser()); 

const asyncapiWithRAML = `
asyncapi: 2.0.0
info:
  title: Example with RAML
  version: 0.1.0
channels:
  example:
    publish:
      message:
        schemaFormat: 'application/raml+yaml;version=1.0'
        payload: # The following is a RAML data type
          type: object
          properties:
            title: string
            author:
              type: string
              examples:
                anExample: Jack Johnson
`;

const { document } = await parser.parse(asyncapiWithRAML);
```

It also supports referencing remote RAML data types:

```js
import { Parser } from '@asyncapi/parser';
import { RamlDTSchemaParser } from '@asyncapi/raml-dt-schema-parser';

const parser = new Parser();
parser.registerSchemaParser(RamlDTSchemaParser()); 

const asyncapiWithRAML = `
asyncapi: 2.0.0
info:
  title: Example with RAML
  version: 0.1.0
channels:
  example:
    publish:
      message:
        schemaFormat: 'application/raml+yaml;version=1.0'
        payload:
          $ref: 'yourserver.com/data-types/library.raml#/Book'
`;

const { document } = await parser.parse(asyncapiWithRAML);
```
