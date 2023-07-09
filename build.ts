import { build } from "bun";
import fs from "node:fs";

fs.rmSync("./dist", { recursive: true }); // reset dist directory
const output = await build({
    entrypoints: [
        "./src/index.ts",
        "./src/classes/pages/components/Editor.ts",
        "./src/classes/pages/assets/ClientFixMarkdown.ts",
        "./src/classes/pages/components/Markdown.ts"
    ],
    minify: true,
    target: "bun", // technically Editor.ts should have the "browser" target, but this hasn't caused any issues yet so it's fine!
    outdir: "dist",
    splitting: true,
    naming: {
        asset: "[name].[ext]",
        chunk: "[name].[ext]",
    },
    external: [
        // these files won't be included in the build
        "package.json",
        "data/config.json",
    ],
});

console.log("\x1b[92mBuild finished!\x1b[0m");
