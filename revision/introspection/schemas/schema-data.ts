import type { EnumData } from '../enums';
import type { FunctionData } from '../functions';
import type { RelationDataWithColumns } from '../relations';

export interface SchemaData {
  name: string;
  enums: EnumData[];
  functions: FunctionData[];
  tables: RelationDataWithColumns[];
  views: RelationDataWithColumns[];
  materializedViews: RelationDataWithColumns[];
}
