import * as fs from 'fs';
import * as path from 'path';
import { Parser } from '@asyncapi/parser';
import { RamlDTSchemaParser } from '../src';

import type { ParseSchemaInput, ValidateSchemaInput, SchemaValidateResult, Diagnostic } from '@asyncapi/parser';

const inputWithSimpleRAML = toInput(fs.readFileSync(path.resolve(__dirname, './documents/simple.json'), 'utf8'));
const outputWithSimpleRAML = '{"type":"object","examples":[{"title":"A book","author":"An author"}],"additionalProperties":true,"required":["title","author"],"properties":{"title":{"type":"string"},"author":{"type":"string","examples":["Eva"]}}}';

const inputWithComplexRAML = toInput(fs.readFileSync(path.resolve(__dirname, './documents/complex.json'), 'utf8'));
const outputWithComplexRAML = '{"minProperties":1,"maxProperties":50,"additionalProperties":false,"discriminator":"breed","discriminatorValue":"CatOne","type":"object","required":["proscons","name","breed","age","rating","year_of_birth","time_of_birth","addition_date","removal_date","photo","description","character","siblings","parents","ratingHistory","additionalData"],"properties":{"proscons":{"anyOf":[true,true]},"name":true,"breed":true,"age":true,"rating":{"type":"integer","multipleOf":5,"example":{"displayName":"Cat\'s rating","description":"Rating of cat\'s awesomeness","strict":false,"value":50}},"year_of_birth":{"type":"string","format":"date"},"time_of_birth":{"type":"string","format":"time"},"dt_of_birth":{"type":"string","format":"date-time-only"},"addition_date":{"type":"string","format":"rfc2616"},"removal_date":{"type":"string","format":"date-time"},"photo":{"type":"string","minLength":1,"maxLength":307200},"description":{"type":"null"},"habits":{"type":"string"},"character":{"anyOf":[{"type":"null"},{"type":"string"}]},"siblings":{"type":"array","items":{"type":"string"}},"parents":{"type":"array","items":true},"ratingHistory":{"type":"array","items":{"anyOf":[{"type":"integer"},{"type":"number"}]}},"additionalData":{"type":"object","additionalProperties":true,"required":["weight"],"properties":{"weight":{"type":"number"}}}}}';

const inputWithInvalidRAML = toInput(fs.readFileSync(path.resolve(__dirname, './documents/invalid.json'), 'utf8'));

const inputWithValidAsyncAPI = fs.readFileSync(path.resolve(__dirname, './documents/valid-asyncapi.yaml'), 'utf8');

const inputWithInvalidAsyncAPI = fs.readFileSync(path.resolve(__dirname, './documents/invalid-asyncapi.yaml'), 'utf8');

describe('parse()', function() {
  const parser = RamlDTSchemaParser();
  const coreParser = new Parser(); 
  coreParser.registerSchemaParser(parser); 

  it('should parse simple RAML data types', async function() {
    await doParseTest(inputWithSimpleRAML, outputWithSimpleRAML);
  });

  it('should parse complex RAML data types', async function() {
    await doParseTest(inputWithComplexRAML, outputWithComplexRAML);
  });

  it('should parse valid AsyncAPI', async function() {
    const { document, diagnostics } = await coreParser.parse(inputWithValidAsyncAPI);
    expect(filterDiagnostics(diagnostics, 'asyncapi-schemas-v2')).toHaveLength(0);
    doParseCoreTest((document?.json()?.channels?.myChannel?.publish?.message as any)?.payload, outputWithSimpleRAML);
    doParseCoreTest((document?.json()?.components?.messages?.testMessage as any)?.payload, outputWithSimpleRAML);
  });

  async function doParseTest(originalInput: ParseSchemaInput, expectedOutput: string) {
    const input = {...originalInput};
    const result = await parser.parse(input);

    // Check that the return value of parse() is the expected JSON Schema.
    expect(result).toEqual(JSON.parse(expectedOutput));
  }

  async function doParseCoreTest(parsedSchema: any, expectedOutput: string) {
    const result = JSON.parse(JSON.stringify(parsedSchema, (field: string, value: unknown) => {
      if (field === 'x-parser-schema-id') return;
      return value;
    }));

    // Check that the return value of parse() is the expected JSON Schema.
    expect(result).toEqual(JSON.parse(expectedOutput));
  }
});

describe('validate()', function() {
  const parser = RamlDTSchemaParser();
  const coreParser = new Parser(); 
  coreParser.registerSchemaParser(parser); 

  it('should validate valid RAML', async function() {
    const result = await parser.validate(inputWithSimpleRAML);
    expect(result).toHaveLength(0);
  });

  it('should validate invalid RAML', async function() {
    const results = await parser.validate(inputWithInvalidRAML);
    expect(results).toHaveLength(1);
    
    const result = (results as SchemaValidateResult[])[0];
    expect(result.message).toEqual('Property \'examples\' should be a map');
    expect(result.path).toEqual(['otherchannel', 'subscribe', 'message', 'payload']); // Validator doesn't provide info about the error path
  });

  it('should validate valid AsyncAPI', async function() {
    const diagnostics = await coreParser.validate(inputWithValidAsyncAPI);
    expect(filterDiagnostics(diagnostics, 'asyncapi-schemas-v2')).toHaveLength(0);
  });

  it('should validate invalid AsyncAPI', async function() {
    const diagnostics = await coreParser.validate(inputWithInvalidAsyncAPI);
    expect(filterDiagnostics(diagnostics, 'asyncapi-schemas-v2')).toHaveLength(2);
    expectDiagnostics(diagnostics, 'asyncapi-schemas-v2', [
      // in channels
      {
        message: 'Property \'examples\' should be a map',
        path: ['channels', 'myChannel', 'publish', 'message', 'payload']
      },
      
      // in components.messages
      {
        message: 'Property \'examples\' should be a map',
        path: ['components', 'messages', 'testMessage', 'payload']
      },
    ]);
  });
});

function toInput(raw: string): ParseSchemaInput | ValidateSchemaInput {
  const message = JSON.parse(raw);
  return {
    asyncapi: {
      semver: {
        version: '2.5.0',
        major: 2,
        minor: 5,
        patch: 0
      }, 
      source: '',
      parsed: {} as any,
    },
    path: ['otherchannel', 'subscribe', 'message', 'payload'],
    data: message.payload,
    meta: {
      message,
    },
    schemaFormat: message.schemaFormat,
    defaultSchemaFormat: 'application/vnd.aai.asyncapi;version=2.5.0',
  };
}

function filterDiagnostics(diagnostics: Diagnostic[], code: string) {
  return diagnostics.filter(d => d.code === code);
}

function expectDiagnostics(diagnostics: Diagnostic[], code: string, results: SchemaValidateResult[]) {
  expect(filterDiagnostics(diagnostics, code)).toEqual(results.map(e => expect.objectContaining(e)));
}
