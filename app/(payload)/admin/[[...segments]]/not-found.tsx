import config from "@payload-config";
import { NotFoundPage } from "@payloadcms/next/views";
import { importMap } from "../importMap.js";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  return NotFoundPage({
    config,
    importMap,
    params: Promise.resolve({ segments: [] }),
    searchParams: Promise.resolve({}),
  });
}
