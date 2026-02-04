import { describe, it, expect } from 'vitest';
import {
  ViewDefinition,
  ColumnDefinition,
  ColumnTypeDefinition,
} from '../../../relations';

describe('ViewDefinition', () => {
  it('creates a view definition.', () => {
    const PGViewName = 'best_selling_products';

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

    const viewDefinition = new ViewDefinition(PGViewName, columns);

    expect(viewDefinition.toString()).toBe(
      `export namespace TopSellingProducts {
  export const PGViewName = 'best_selling_products';

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

  it('applies TSDoc comments to the view and columns.', () => {
    const PGViewName = 'best_selling_products';
    const viewLevelComment =
      "/**\n * A view that contains information about the company's best-selling products.\n */";
    const columnLevelComment =
      '/**\n * A unique identifier for each product.\n */';

    const columns = [
      new ColumnDefinition(
        'id',
        new ColumnTypeDefinition('number', 0, false),
        columnLevelComment,
      ),
    ];

    const viewDefinition = new ViewDefinition(
      PGViewName,
      columns,
      viewLevelComment,
    );

    expect(viewDefinition.toString()).toBe(
      `/**
 * A view that contains information about the company\'s best-selling products.
 */
export namespace TopSellingProducts {
  export const PGViewName = 'best_selling_products';

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

  it('creates valid typescript types from a view that has no columns.', () => {
    const PGViewName = 'empty_view';
    const viewDefinition = new ViewDefinition(PGViewName, []);

    expect(viewDefinition.toString()).toBe(
      `export namespace EmptyView {
  export const PGViewName = 'empty_view';

  export type ColumnNames = never;

  export interface RowType {}
}`,
    );
  });
});
