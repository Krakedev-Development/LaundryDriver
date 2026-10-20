const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const sibling = path.resolve(
  root,
  "..",
  path.basename(root) === "LaundryApp" ? "LaundryDriver" : "LaundryApp",
);
const files = [
  "packages/mobile-auth/index.ts",
  "packages/mobile-auth/package.json",
  "src/features/auth/ui/LoginForm.tsx",
  "src/features/auth/ui/LoginAccessOptions.tsx",
  "src/components/LoginPresentation.tsx",
  "src/services/passwordHash.ts",
];
for (const file of files) {
  assert.ok(
    fs.existsSync(path.join(root, file)),
    `Falta el contrato compartido: ${file}`,
  );
  if (fs.existsSync(path.join(sibling, "package.json"))) {
    const content = (directory) =>
      fs
        .readFileSync(path.join(directory, file), "utf8")
        .replace(/\r\n/g, "\n");
    assert.equal(
      content(root),
      content(sibling),
      `El login difiere entre repositorios: ${file}`,
    );
  }
}
console.log("Contrato y presentación del login verificados.");
