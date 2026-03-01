import type { RelationData } from './relation-data';
import type { ColumnData } from './column-data';

export interface RelationDataWithColumns extends RelationData {
  columns: ColumnData[];
}
