import { defineField, defineType } from "sanity";

export const inventoryLog = defineType({
  name: "inventoryLog",
  title: "Inventory Log",
  type: "document",
  fields: [
    defineField({
      name: "type",
      type: "string",
      options: { list: ["consumption", "restock", "waste", "adjustment"] },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "ingredient",
      type: "reference",
      to: [{ type: "ingredient" }],
      validation: (R) => R.required(),
    }),
    defineField({ name: "quantityChange", type: "number", validation: (R) => R.required() }),
    defineField({ name: "reason", type: "string" }),
    defineField({ name: "orderId", type: "string" }),
    defineField({ name: "performedBy", type: "string" }),
    defineField({ name: "timestamp", type: "datetime", initialValue: () => new Date().toISOString() }),
  ],
  preview: {
    select: { title: "ingredient.name", type: "type", q: "quantityChange" },
    prepare: ({ title, type, q }) => ({
      title: title ?? "Log",
      subtitle: `${type ?? ""} · ${q ?? 0}`,
    }),
  },
});
