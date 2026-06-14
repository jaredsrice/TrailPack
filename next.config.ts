import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js does not infer it from a
  // parent directory when multiple lockfiles exist higher up the tree (e.g. a
  // cloud-synced parent folder). This silences the "inferred workspace root"
  // warning without touching any files outside this repository.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
