import { test, describe, expect } from 'vitest';
import {
  FunctionDefinition,
  ParameterTypeDefinition,
  OverloadTypeDefinition,
  ReturnTypeDefinition,
} from '../../../functions';

describe('FunctionDefinition', () => {
  test('it creates a function definition', () => {
    const overloads = [
      new OverloadTypeDefinition(
        [
          new ParameterTypeDefinition('number', false, false, false, false),
          new ParameterTypeDefinition('number', false, false, false, false),
        ],
        new ReturnTypeDefinition('number', false, false),
      ),
      new OverloadTypeDefinition(
        [
          new ParameterTypeDefinition('number', false, false, false, false),
          new ParameterTypeDefinition('number', false, false, false, false),
          new ParameterTypeDefinition('number', false, false, false, false),
        ],
        new ReturnTypeDefinition('number', false, false),
      ),
      new OverloadTypeDefinition(
        [new ParameterTypeDefinition('number', true, false, true, false)],
        new ReturnTypeDefinition('number', false, false),
      ),
    ];

    const functionName = 'custom_add';

    const functionTypeDefinition = new FunctionDefinition(
      functionName,
      overloads,
    );

    expect(functionTypeDefinition.toString()).toBe(
      `export namespace CustomAdd {
  export const PGFunctionName = 'custom_add';

  export type Overloads = [
    {
      ParameterTypes: [
        number,
        number
      ],
      ReturnType: number
    },
    {
      ParameterTypes: [
        number,
        number,
        number
      ],
      ReturnType: number
    },
    {
      ParameterTypes: [
        ...number[]
      ],
      ReturnType: number
    }
  ];
}`,
    );
  });
});
