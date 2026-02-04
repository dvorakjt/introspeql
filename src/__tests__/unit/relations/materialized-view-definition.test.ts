import { describe, it, expect } from 'vitest';
import {
  MaterializedViewDefinition,
  ColumnDefinition,
  ColumnTypeDefinition,
} from '../../../relations';

describe('MaterializedViewDefinition', () => {
  it('creates a materialized view definition.', () => {
    const PGMaterializedViewName = 'best_selling_products';

    const columns = [
      new ColumnDefinition('id', new ColumnTypeDefinition('number', 0, false)),
      new ColumnDefinition(
        'product_name',
        new ColumnTypeDefinition('string', 0, false),
      ),
      new ColumnDefinition(
        'categories',
        new ColumnTypeDefinition('string', 1, false),
      ),
      new ColumnDefinition(
        'total_units_sold',
        new ColumnTypeDefinition('number', 0, false),
      ),
      new ColumnDefinition(
        'unit_price',
        new ColumnTypeDefinition('number', 0, false),
      ),
    ];

    const materializedViewDefinition = new MaterializedViewDefinition(
      PGMaterializedViewName,
      columns,
    );

    expect(materializedViewDefinition.toString()).toBe(
      `export namespace BestSellingProducts {
  export const PGMaterializedViewName = 'best_selling_products';

  export type ColumnNames = |
    'id' |
    'product_name' |
    'categories' |
    'total_units_sold' |
    'unit_price';

  export interface RowType {
    ['id']: number;
    ['product_name']: string;
    ['categories']: string[];
    ['total_units_sold']: number;
    ['unit_price']: number;
  }
}`,
    );
  });

  it('applies TSDoc comments to the materialized view and columns.', () => {
    const PGMaterializedViewName = 'best_selling_products';
    const materializedViewLevelComment =
      "/**\n * A materialized view that contains information about the company's best-selling products.\n */";

    const columnLevelComment =
      '/**\n * A unique identifier for each product.\n */';

    const columns = [
      new ColumnDefinition(
        'id',
        new ColumnTypeDefinition('number', 0, false),
        columnLevelComment,
      ),
    ];

    const materializedViewDefinition = new MaterializedViewDefinition(
      PGMaterializedViewName,
      columns,
      materializedViewLevelComment,
    );

    expect(materializedViewDefinition.toString()).toBe(
      `/**
 * A materialized view that contains information about the company\'s best-selling products.
 */
export namespace BestSellingProducts {
  export const PGMaterializedViewName = 'best_selling_products';

  export type ColumnNames = |
    'id';

  export interface RowType {
    /**
     * A unique identifier for each product.
     */
    ['id']: number;
  }
}`,
    );
  });

  it('creates valid typescript types from a materialized view that has no columns.', () => {
    const PGMaterializedViewName = 'empty_materialized_view';
    const materializedViewDefinition = new MaterializedViewDefinition(
      PGMaterializedViewName,
      [],
    );

    expect(materializedViewDefinition.toString()).toBe(
      `export namespace EmptyMaterializedView {
  export const PGMaterializedViewName = 'empty_materialized_view';

  export type ColumnNames = never;

  export interface RowType {}
}`,
    );
  });
});
