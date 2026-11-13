// Builds the GitHub Pages site (code.benweese.com/playwright-ai-qa-agents/) from the repo's
// Markdown, rendered by GitHub's own Markdown API so it matches github.com. No dependencies.
//
//   node scripts/build-site.mjs [outDir]     (default _site; GITHUB_TOKEN raises the API rate limit)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO = "benweese/playwright-ai-qa-agents";
const BLOB = `https://github.com/${REPO}/blob/main/`;
const out = process.argv[2] ?? "_site";

/** Source Markdown → page on the site. Links to any other repo file go to GitHub. */
const PAGES = [
	{ source: "README.md", file: "index.html", nav: "Overview" },
	{ source: "docs/worked-example.md", file: "worked-example.html", nav: "Worked example" },
	{ source: "CHANGELOG.md", file: "changelog.html", nav: "Changelog" }
];
const pageFor = new Map(PAGES.map((p) => [p.source, p.file]));

async function render(markdown) {
	const headers = { "content-type": "application/json", "user-agent": "playwright-ai-qa-agents site build" };
	if (process.env.GITHUB_TOKEN) {
		headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}
	const response = await fetch("https://api.github.com/markdown", {
		method: "POST",
		headers,
		body: JSON.stringify({ text: markdown, mode: "gfm", context: REPO })
	});
	if (!response.ok) {
		throw new Error(`GitHub Markdown API: ${response.status} ${await response.text()}`);
	}
	return response.text();
}

/** Points a relative link at its page on this site, or at the file on GitHub. */
function rewriteLink(href, source) {
	if (/^([a-z]+:|#|\/\/)/i.test(href)) {
		return href;
	}
	const [target, hash = ""] = href.split("#");
	const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(source), target));
	const local = pageFor.get(resolved);
	return local ? `${local}${hash ? `#${hash}` : ""}` : `${BLOB}${resolved}${hash ? `#${hash}` : ""}`;
}

function tidy(html, source) {
	return (
		html
			// GitHub prefixes heading ids with "user-content-" and fixes #links up with script.
			.replace(/id="user-content-/g, 'id="')
			.replace(/href="([^"]*)"/g, (_, href) => `href="${rewriteLink(href, source)}"`)
			.replace(/src="(?!https?:)([^"]*)"/g, (_, src) => `src="https://raw.githubusercontent.com/${REPO}/main/${src}"`)
	);
}

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function layout({ title, description, body, current }) {
	const nav = PAGES.map(
		(p) => `<a href="${p.file}"${p.file === current ? ' aria-current="page"' : ""}>${p.nav}</a>`
	).join("");
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="canonical" href="https://code.benweese.com/playwright-ai-qa-agents/${current === "index.html" ? "" : current}">
<meta name="color-scheme" content="dark">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="stylesheet" href="site.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="topbar">
<a class="home" href="https://benweese.com/">Ben Weese · benweese.com</a>
<a href="https://code.benweese.com/">All projects</a>
</header>
<nav class="pages" aria-label="Documentation">
<span class="name">playwright-ai-qa-agents</span>${nav}<a href="https://github.com/${REPO}">GitHub</a>
</nav>
<main id="main" class="markdown-body" tabindex="-1">
${body}
</main>
<footer class="footer">
<a href="https://benweese.com/">benweese.com</a> · <a href="https://code.benweese.com/">All projects</a> ·
<a href="https://github.com/${REPO}">Source</a>
</footer>
<script type="module">
const blocks = document.querySelectorAll('pre[lang="mermaid"]');
if (blocks.length) {
	const { default: mermaid } = await import("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs");
	mermaid.initialize({ startOnLoad: false, theme: "dark" });
	blocks.forEach((pre) => {
		const div = document.createElement("div");
		div.className = "mermaid";
		div.textContent = pre.textContent;
		pre.replaceWith(div);
	});
	await mermaid.run();
}
</script>
</body>
</html>
`;
}

await mkdir(out, { recursive: true });
for (const page of PAGES) {
	const markdown = await readFile(page.source, "utf8");
	const heading = /^#\s+(.+)$/m.exec(markdown)?.[1] ?? page.nav;
	const firstParagraph = markdown.split(/\n\s*\n/).find((p) => /^[A-Za-z]/.test(p.trim())) ?? "";
	const description = firstParagraph
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[`*_]/g, "")
		.replace(/\s+/g, " ")
		.slice(0, 200);
	const title = page.file === "index.html" ? `${heading} · Ben Weese` : `${heading} · playwright-ai-qa-agents`;
	const body = tidy(await render(markdown), page.source);
	await writeFile(path.join(out, page.file), layout({ title, description, body, current: page.file }));
	console.log(`${page.source} → ${path.join(out, page.file)}`);
}
await writeFile(path.join(out, "site.css"), await readFile("scripts/site.css", "utf8"));
