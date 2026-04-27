import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (R) => R.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "icon",
      type: "string",
      description: "Emoji or short icon string",
    }),
    defineField({ name: "displayOrder", type: "number", initialValue: 0 }),
    defineField({ name: "isActive", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { title: "name", subtitle: "icon" },
  },
});
