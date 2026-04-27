import { defineField, defineType } from "sanity";

export const table = defineType({
  name: "table",
  title: "Table",
  type: "document",
  fields: [
    defineField({ name: "tableNumber", type: "string", validation: (R) => R.required() }),
    defineField({
      name: "section",
      type: "string",
      options: { list: ["main", "patio", "private", "bar"] },
      initialValue: "main",
    }),
    defineField({ name: "capacity", type: "number", initialValue: 4 }),
    defineField({ name: "isOccupied", type: "boolean", initialValue: false }),
    defineField({
      name: "currentOrder",
      type: "reference",
      to: [{ type: "order" }],
      description: "Active order for this table, if any",
    }),
  ],
  preview: {
    select: { title: "tableNumber", subtitle: "section", capacity: "capacity" },
    prepare: ({ title, subtitle, capacity }) => ({
      title: `Table ${title}`,
      subtitle: `${subtitle ?? ""} · seats ${capacity ?? 0}`,
    }),
  },
});
