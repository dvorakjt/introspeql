import { z } from 'zod';

export const outputOptions = z.union([
  z.object({
    /**
     * If set to `true` (the default), IntrospeQL will save the output to the
     * file specified in the `outFile` option.
     *
     * If `false`, IntrospeQL will return the output as a string as it usually
     * would, but will not save this string to disk. Useful for testing or if
     * further processing is required before the output is saved.
     */
    writeToDisk: z.literal(true).optional().default(true),
    /**
     * The path to the file to which IntrospeQL should write output. Only valid
     * if `writeToDisk` is `true`.
     */
    outFile: z.string({
      message: 'outFile is required if writeToDisk is true',
    }),
  }),
  z.object({
    /**
     * If set to `true` (the default), IntrospeQL will save the output to the
     * file specified in the `outFile` option.
     *
     * If `false`, IntrospeQL will return the output as a string as it usually
     * would, but will not save this string to disk. Useful for testing or if
     * further processing is required before the output is saved.
     */
    writeToDisk: z.literal(false),
    /**
     * The path to the file to which IntrospeQL should write output. Only valid
     * if `writeToDisk` is `true`.
     */
    outFile: z.undefined().optional(),
  }),
]);
