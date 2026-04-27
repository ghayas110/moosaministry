import type { SchemaTypeDefinition } from "sanity";
import { category } from "./category";
import { ingredient } from "./ingredient";
import { inventoryLog } from "./inventoryLog";
import { menuItem } from "./menuItem";
import { order } from "./order";
import { purchaseOrder } from "./purchaseOrder";
import { staff } from "./staff";
import { supplier } from "./supplier";
import { table } from "./table";

export const schemaTypes: SchemaTypeDefinition[] = [
  category,
  menuItem,
  ingredient,
  supplier,
  order,
  table,
  staff,
  purchaseOrder,
  inventoryLog,
];
