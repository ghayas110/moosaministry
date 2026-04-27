import { defineField, defineType } from "sanity";

export const staff = defineType({
  name: "staff",
  title: "Staff",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (R) => R.required() }),
    defineField({
      name: "role",
      type: "string",
      options: { list: ["cashier", "manager", "admin", "kitchen"] },
      initialValue: "cashier",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "pin",
      type: "string",
      description: "4-digit PIN (stored in plaintext for demo; hash in production)",
      validation: (R) => R.required().regex(/^\d{4,6}$/, { name: "4–6 digits" }),
    }),
    defineField({ name: "isActive", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { title: "name", subtitle: "role" },
  },
});
