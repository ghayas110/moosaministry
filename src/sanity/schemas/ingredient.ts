import { defineField, defineType } from "sanity";

export const ingredient = defineType({
  name: "ingredient",
  title: "Ingredient",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (R) => R.required() }),
    defineField({
      name: "category",
      type: "string",
      options: {
        list: [
          { title: "Raw Ingredients", value: "raw" },
          { title: "Packaging", value: "packaging" },
          { title: "Beverages", value: "beverages" },
          { title: "Sauces & Condiments", value: "sauces" },
          { title: "Other", value: "other" },
        ],
      },
      initialValue: "raw",
    }),
    defineField({
      name: "unit",
      type: "string",
      options: {
        list: ["kg", "g", "L", "ml", "pieces", "portions", "packs"],
      },
      initialValue: "kg",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "currentStock",
      type: "number",
      initialValue: 0,
      validation: (R) => R.min(0),
    }),
    defineField({
      name: "restockThreshold",
      type: "number",
      initialValue: 5,
      validation: (R) => R.min(0),
    }),
    defineField({ name: "costPerUnit", type: "number", initialValue: 0 }),
    defineField({
      name: "supplier",
      type: "reference",
      to: [{ type: "supplier" }],
    }),
    defineField({ name: "lastRestocked", type: "datetime" }),
    defineField({ name: "notes", type: "text", rows: 2 }),
  ],
  preview: {
    select: { title: "name", currentStock: "currentStock", unit: "unit" },
    prepare: ({ title, currentStock, unit }) => ({
      title,
      subtitle: `${currentStock ?? 0} ${unit ?? ""}`,
    }),
  },
});
