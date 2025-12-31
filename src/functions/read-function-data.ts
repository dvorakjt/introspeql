import { functionDataSchema, type FunctionData } from './function-data';
import { shouldIncludeOverload } from './should-include-overload';
import { shouldIncludeFunction } from './should-include-function';
import type { Client } from 'pg';
import type { ParsedConfig } from '../config';

export async function readFunctionData(
  client: Client,
  config: ParsedConfig,
): Promise<FunctionData[]> {
  const schemaPlaceholders = config.schemas
    .map((_, i) => `$${i + 1}`)
    .join(', ');

  const query = `
SELECT 
  p1.proname AS name, 
  n1.nspname AS schema,
  ARRAY(
    SELECT jsonb_build_object(
      'paramTypes',
	    ARRAY(
        SELECT jsonb_build_object(
	      'oid',
	      t.oid,
	      'schema',
	      n2.nspname,
	      'name',
	      t.typname,
		    'isEnum',
	      t.typtype = 'e',
	      'isArray',
	      EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = args.argType),
		    'isOptional',
		    CASE 
		      WHEN args.argOrd > p2.pronargs - p2.pronargdefaults THEN TRUE
			    ELSE FALSE
		    END,
		    'isVariadic',
		    CASE 
		      WHEN p2.provariadic > 0 AND p2.pronargs = args.argOrd THEN TRUE
			    ELSE FALSE
	      END
	    ) FROM UNNEST(p2.proargtypes) WITH ORDINALITY AS args(argType, argOrd)
	    INNER JOIN pg_catalog.pg_type as t ON 
	    CASE 
	      WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = args.argType) 
		    THEN args.argType = t.typarray
		    ELSE args.argType = t.oid
	    END
	    INNER JOIN pg_catalog.pg_namespace AS n2 ON t.typnamespace = n2.oid
    ),
	  'returnType',
	  (
	    SELECT jsonb_build_object(
	  	  'oid',
	      t.oid,
	      'schema',
	      n.nspname,
	      'name',
	      t.typname,
		    'isEnum',
	      t.typtype = 'e',
	      'isArray',
	      EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = p2.prorettype)
      ) FROM pg_catalog.pg_type AS t
	    INNER JOIN pg_catalog.pg_namespace as n
	    ON t.typnamespace = n.oid
	    WHERE CASE 
	      WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = p2.prorettype) 
		    THEN t.typarray = p2.prorettype
		    ELSE t.oid = p2.prorettype
	    END
	  ),
	  'comment',
	  obj_description(p2.oid, 'pg_proc')
	) FROM pg_catalog.pg_proc AS p2 WHERE p2.proname = p1.proname ORDER BY p2.oid
) AS overloads
FROM pg_catalog.pg_proc AS p1
INNER JOIN pg_catalog.pg_namespace AS n1 ON p1.pronamespace = n1.oid
WHERE p1.prokind = 'f' AND n1.nspname IN (${schemaPlaceholders})
GROUP BY (p1.proname, n1.nspname);
`;

  const parameters = [...config.schemas];

  const result = await client.query(query, parameters);

  const functionData = functionDataSchema
    .array()
    .parse(result.rows)
    .map(fd => {
      return {
        ...fd,
        overloads: fd.overloads.filter(({ comment }) => {
          return shouldIncludeOverload(fd.schema, fd.name, comment, config);
        }),
      };
    })
    .filter(fd => {
      return shouldIncludeFunction(fd);
    });

  return functionData;
}
