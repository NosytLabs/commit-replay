"""Build the public, self-contained source download without local state or secrets."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parent.parent
output = root / "public" / "commit-replay-source.zip"
folders = ["app", "components", "hooks", "lib", "public/assets", "scripts", "vendor", "build", "db", "drizzle"]
files = ["README.md", "LICENSE", "package.json", "package-lock.json", "tsconfig.json", "next.config.ts", "vite.config.ts", "postcss.config.mjs", "eslint.config.mjs", "drizzle.config.ts", "components.json", "cloudflare-env.d.ts", "next-env.d.ts", "public/favicon.svg", "docs/data-definitions.md", "docs/design-notes.md"]
paths = {root / f for f in files}
for folder in folders:
    paths.update(p for p in (root / folder).rglob("*") if p.is_file())
paths.update((root / "tests").glob("*.ts"))
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(paths):
        if not path.is_file() or path.name.startswith(".env") or path.suffix in {".pyc", ".tsbuildinfo"}:
            continue
        archive.write(path, "commit-replay/" + path.relative_to(root).as_posix())
    archive.writestr("commit-replay/.openai/hosting.json", json.dumps({"d1": None, "r2": None}, indent=2))
    archive.writestr("commit-replay/.gitignore", "node_modules/\ndist/\n.wrangler/\n.sites-runtime/\n.env*\n*.tsbuildinfo\n")
print(f"Source package: {output.name} ({output.stat().st_size:,} bytes)")
