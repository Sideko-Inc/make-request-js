#!/usr/bin/env node
/**
 * Release utility script for make-api-request-js
 *
 * Usage:
 *   node scripts/release.js patch    # 1.0.0 -> 1.0.1
 *   node scripts/release.js minor    # 1.0.0 -> 1.1.0
 *   node scripts/release.js major    # 1.0.0 -> 2.0.0
 *   node scripts/release.js 1.2.3    # Set specific version
 */

const { execSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
const readline = require("readline");

const projectRoot = join(__dirname, "..");

/**
 * Run a shell command and return the result
 */
function runCommand(cmd, options = {}) {
  const { check = true, silent = false } = options;

  if (!silent) {
    console.log(`Running: ${cmd}`);
  }

  try {
    const result = execSync(cmd, {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
    });
    return { stdout: result, returncode: 0 };
  } catch (error) {
    if (check) {
      console.error(`Error running command: ${cmd}`);
      console.error(`Exit code: ${error.status}`);
      if (error.stdout) console.error(`STDOUT: ${error.stdout}`);
      if (error.stderr) console.error(`STDERR: ${error.stderr}`);
      process.exit(1);
    }
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      returncode: error.status || 1,
    };
  }
}

/**
 * Get the current version from package.json
 */
function getCurrentVersion() {
  const packagePath = join(projectRoot, "package.json");

  try {
    const content = readFileSync(packagePath, "utf8");
    const packageJson = JSON.parse(content);
    return packageJson.version;
  } catch (error) {
    console.error("Error: Could not read version from package.json");
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Bump version based on type (patch, minor, major)
 */
function bumpVersion(current, bumpType) {
  const parts = current
    .split(/[.\-]/)
    .slice(0, 3)
    .map((x) => parseInt(x));

  if (bumpType === "patch") {
    parts[2] += 1;
  } else if (bumpType === "minor") {
    parts[1] += 1;
    parts[2] = 0;
  } else if (bumpType === "major") {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else {
    // Assume it's a specific version
    if (!/^\d+\.\d+\.\d+(?:-rc\.\d+)?$/.test(bumpType)) {
      console.error(`Error: Invalid version format: ${bumpType}`);
      process.exit(1);
    }
    return bumpType;
  }

  return parts.join(".");
}

/**
 * Update version in package.json
 */
function updateVersionInPackage(newVersion) {
  const packagePath = join(projectRoot, "package.json");

  try {
    const content = readFileSync(packagePath, "utf8");
    const packageJson = JSON.parse(content);
    packageJson.version = newVersion;

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
    console.log(`Updated package.json version to ${newVersion}`);
  } catch (error) {
    console.error("Error updating package.json");
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.log(`
Release utility script for make-api-request-js

Usage:
  node scripts/release.js patch    # 1.0.0 -> 1.0.1
  node scripts/release.js minor    # 1.0.0 -> 1.1.0
  node scripts/release.js major    # 1.0.0 -> 2.0.0
  node scripts/release.js 1.2.3    # Set specific version
`);
    process.exit(1);
  }

  const bumpType = args[0];

  // Check if we're in a git repository
  const gitStatus = runCommand("git status --porcelain", {
    check: false,
    silent: true,
  });
  if (gitStatus.returncode !== 0) {
    console.error("Error: Not in a git repository");
    process.exit(1);
  }

  // Check for uncommitted changes
  if (gitStatus.stdout.trim()) {
    console.error(
      "Error: You have uncommitted changes. Please commit or stash them first."
    );
    console.error("Uncommitted files:");
    console.error(gitStatus.stdout);
    process.exit(1);
  }

  // Check current branch
  const currentBranch = runCommand("git branch --show-current", {
    check: false,
    silent: true,
  });
  if (currentBranch.returncode === 0 && currentBranch.stdout.trim()) {
    const branch = currentBranch.stdout.trim();
    if (branch !== "main") {
      console.error(
        `Error: You are on branch '${branch}'. Please switch to main/master branch before releasing.`
      );
      process.exit(1);
    }
  }

  // Get current version
  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}`);

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  console.log(`New version: ${newVersion}`);

  // Confirm with user
  const confirmed = await askConfirmation(
    `Release version ${newVersion}? (y/N): `
  );
  if (!confirmed) {
    console.log("Release cancelled");
    process.exit(0);
  }

  // Update version in package.json
  updateVersionInPackage(newVersion);

  // Run CI checks to make sure everything works
  console.log("Running CI checks...");
  runCommand("pnpm run ci-checks");

  // Build the project
  console.log("Building project...");
  runCommand("pnpm build");

  // Commit version bump
  runCommand("git add package.json");
  runCommand(`git commit -m "Bump version to ${newVersion}"`);

  // Create and push tag
  const tagName = `v${newVersion}`;
  runCommand(`git tag -a ${tagName} -m "Release ${newVersion}"`);
  runCommand("git push origin main");
  runCommand(`git push origin ${tagName}`);

  // Create GitHub release using gh CLI (if available)
  try {
    console.log("Creating GitHub release...");
    runCommand(
      `gh release create ${tagName} --title "Release ${newVersion}" --notes "Release ${newVersion}" --latest`,
      { check: false }
    );
  } catch (error) {
    console.log(
      "⚠️  Could not create GitHub release automatically. You can create it manually at:"
    );
    console.log(
      `   https://github.com/sideko-inc/make-api-request-js/releases/new?tag=${tagName}`
    );
  }

  console.log(`✅ Successfully created release ${newVersion}`);
  console.log("🚀 GitHub Actions will now build and publish to NPM");
  console.log(
    `📦 Check the release at: https://github.com/sideko-inc/make-api-request-js/releases/tag/${tagName}`
  );
}

main().catch((error) => {
  console.error("Release failed:", error.message);
  process.exit(1);
});
