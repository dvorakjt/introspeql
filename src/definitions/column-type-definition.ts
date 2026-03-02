import { EnumStub } from './enum-stub';

export class ColumnTypeDefinition {
  constructor(
    public tsType: string | EnumStub,
    public numDimensions: number,
    public isNullable: boolean,
    public generated: 'never' | 'by_default' | 'always',
  ) {}
}
