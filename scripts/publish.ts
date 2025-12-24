#!/usr/bin/env bun

import { $ } from "bun";
import path from "path";
import fs from "fs";

import pkg from "../package.json";
import { targetpackageName } from "./bunup-builds";
import { buildTargets } from "./build";

const dir = path.resolve(import.meta.dir, "..");
$.cwd(dir);

const [, , version] = Bun.argv;

if (!version) {
  console.error("Usage: bun run scripts/publish.ts <version>");
  process.exit(1);
}

console.log(`\n🚀 Publishing ${pkg.name} v${version}\n`);
console.log("─".repeat(50));

// Build all platforms
const binaries = await buildTargets(version);

// Smoke test on current platform
const currentPlatform = process.platform === "win32" ? "windows" : process.platform;
const currentArch = process.arch;
const currentPackage = `${targetpackageName}-${currentPlatform}-${currentArch}`;
const binaryExt = process.platform === "win32" ? ".exe" : "";
const binaryPath = `./dist/${currentPackage}/bin/${targetpackageName}${binaryExt}`;

if (fs.existsSync(binaryPath)) {
  console.log(`\n🧪 Running smoke test: ${binaryPath} --version`);
  try {
    await $`${binaryPath} --version`;
    console.log("   ✅ Smoke test passed");
  } catch (error) {
    console.error("   ❌ Smoke test failed:", error);
    process.exit(1);
  }
} else {
  console.log(`\n⚠️  Skipping smoke test (no binary for current platform: ${currentPackage})`);
}

// Prepare main package
console.log("\n📁 Preparing main package...");

await $`mkdir -p ./dist/${targetpackageName}/bin`;
await $`cp -r ./bin ./dist/${targetpackageName}/`;
await $`cp scripts/postinstall.mjs dist/${targetpackageName}/postinstall.mjs`;

await Bun.file(`./dist/${targetpackageName}/package.json`).write(
  JSON.stringify(
    {
      name: pkg.name,
      version,
      description: pkg.description,
      bin: { [targetpackageName]: `./bin/${targetpackageName}` },
      scripts: { postinstall: "node ./postinstall.mjs" },
      optionalDependencies: binaries,
      // repository: pkg.repository,
      // homepage: pkg.homepage,
      // bugs: pkg.bugs,
      keywords: pkg.keywords,
      author: pkg.author,
      license: pkg.license,
      // engines: pkg.engines,
    },
    null,
    2
  )
);

console.log("✅ Main package prepared");

// Publish platform packages
console.log("\n📤 Publishing platform packages...");

for (const [name] of Object.entries(binaries)) {
  const targetPath = path.join(dir, "dist", name.replace(pkg.name, targetpackageName));

  if (process.platform !== "win32") {
    await $`chmod -R 755 .`.cwd(targetPath);
  }

  // await $`npm publish --access public`.cwd(targetPath);
  console.log(`✅ Published ${name}`);
}

// Publish main package
console.log("\n📤 Publishing main package...");

const mainPackagePath = path.join(dir, "dist", targetpackageName);
// await $`npm publish --access public`.cwd(mainPackagePath);
console.log(`✅ Published ${pkg.name}`);

// Create archives for GitHub releases
console.log("\n📦 Creating release archives...");

for (const name of Object.keys(binaries)) {
  const pkgName = name.replace(pkg.name, targetpackageName);
  const binDir = path.join(dir, "dist", pkgName, "bin");

  try {
    if (name.includes("linux")) {
      await $`tar -czf ../${pkgName}.tar.gz *`.cwd(binDir);
      console.log(`✅ Created ${pkgName}.tar.gz`);
    } else {
      await $`zip -r ../${pkgName}.zip *`.cwd(binDir);
      console.log(`✅ Created ${pkgName}.zip`);
    }
  } catch (error) {
    console.error(`❌ Failed to create archive for ${pkgName}:`, error);
  }
}

// Summary
console.log(`\n${"─".repeat(50)}`);
console.log("\n✅ Publish complete!\n");
console.log(`Version: ${version}`);
console.log(`Packages: ${Object.keys(binaries).length + 1}`);
