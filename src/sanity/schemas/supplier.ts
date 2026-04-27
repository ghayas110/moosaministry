import { defineField, defineType } from "sanity";

export const supplier = defineType({
  name: "supplier",
  title: "Supplier",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (R) => R.required() }),
    defineField({ name: "contactPerson", type: "string" }),
    defineField({ name: "phone", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "address", type: "text", rows: 2 }),
  ],
});
