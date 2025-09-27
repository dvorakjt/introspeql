import { readConfig } from "./read-config";
import { introspectDatabase } from "./introspect-database";

console.log("Reading config...");
const config = readConfig();

console.log("Introspecting database and generating types...");
introspectDatabase(config);

console.log("Done!");
