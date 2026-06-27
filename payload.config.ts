import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET!,
  serverURL: process.env.PAYLOAD_URL ?? "http://localhost:3000",
  admin: { user: "users" },
  editor: lexicalEditor(),
  db: mongooseAdapter({ url: process.env.DATABASE_URL! }),
  sharp,

  collections: [
    // ── Users ───────────────────────────────────────────────────────────
    {
      slug: "users",
      auth: true,
      admin: { useAsTitle: "email" },
      fields: [
        {
          name: "role",
          type: "select",
          required: true,
          defaultValue: "editor",
          options: [
            { label: "Super Admin", value: "superAdmin" },
            { label: "Editor", value: "editor" },
          ],
        },
      ],
    },

    // ── Media (images → R2) ─────────────────────────────────────────────
    {
      slug: "media",
      upload: true,
      admin: { useAsTitle: "filename" },
      access: {
        read: () => true,
      },
      fields: [{ name: "alt", type: "text" }],
    },

    // ── Series ──────────────────────────────────────────────────────────
    {
      slug: "series",
      admin: { useAsTitle: "title" },
      access: {
        read: () => true,
      },
      fields: [
        { name: "title", type: "text", required: true },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          admin: { description: "URL-safe, e.g. one-piece" },
        },
        { name: "description", type: "textarea" },
        { name: "coverImage", type: "upload", relationTo: "media" },
        {
          name: "type",
          type: "select",
          defaultValue: "manga",
          options: [
            { label: "Manga", value: "manga" },
            { label: "Manhwa", value: "manhwa" },
            { label: "Manhua", value: "manhua" },
          ],
        },
        {
          name: "status",
          type: "select",
          defaultValue: "ongoing",
          options: [
            { label: "Ongoing", value: "ongoing" },
            { label: "Completed", value: "completed" },
            { label: "Hiatus", value: "hiatus" },
          ],
        },
        {
          name: "genres",
          type: "text",
          admin: { description: "Comma-separated, e.g. action, fantasy" },
        },
        {
          name: "_status",
          type: "select",
          defaultValue: "published",
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
          ],
          admin: { position: "sidebar" },
        },
      ],
    },

    // ── Chapters ────────────────────────────────────────────────────────
    {
      slug: "chapters",
      admin: { useAsTitle: "title" },
      access: {
        read: () => true,
      },
      fields: [
        {
          name: "series",
          type: "relationship",
          relationTo: "series",
          required: true,
          admin: { position: "sidebar" },
        },
        { name: "number", type: "number", required: true },
        {
          name: "title",
          type: "text",
          admin: { description: "Optional chapter title" },
        },
        {
          name: "pages",
          type: "array",
          label: "Pages (drag to reorder)",
          fields: [
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              required: true,
            },
          ],
        },
        {
          name: "_status",
          type: "select",
          defaultValue: "published",
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
          ],
          admin: { position: "sidebar" },
        },
        {
          name: "publishedAt",
          type: "date",
          admin: {
            position: "sidebar",
            date: { pickerAppearance: "dayOnly" },
          },
        },
      ],
    },
  ],

  plugins: [
    s3Storage({
      collections: {
        media: {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename: f }) =>
            `${process.env.R2_PUBLIC_URL}/${f}`,
        },
      },
      bucket: process.env.R2_BUCKET!,
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.R2_ENDPOINT!, // https://<id>.r2.cloudflarestorage.com
        region: "auto",
        forcePathStyle: false,
      },
    }),
  ],

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
