#!/usr/bin/env python3
"""Heuristic frontend design audit.

The audit checks observable implementation signals. It does not judge whether a
design is beautiful, premium, senior, or award-worthy.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


TEXT_EXTENSIONS = {
    ".astro",
    ".css",
    ".html",
    ".js",
    ".jsx",
    ".less",
    ".md",
    ".scss",
    ".sass",
    ".svelte",
    ".ts",
    ".tsx",
    ".vue",
    ".wxml",
    ".wxss",
}

SKIP_DIRS = {
    ".git",
    ".next",
    ".nuxt",
    ".svelte-kit",
    ".turbo",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
}

SKIP_FILENAMES = {
    "audit-output.txt",
    "brief.md",
    "expected-assertions.md",
    "expected-findings.md",
    "human-rubric.md",
    "pass-fail-evidence.md",
    "why-this-should-fail.md",
}

DOC_FILENAMES = {
    "README.md",
    "CHANGELOG.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
}

DOC_DIRS = {"docs", "evals"}
TEST_DIRS = {"tests", "__tests__", "test", "__test__"}
PLUGIN_DIRS = {"plugins"}
SHARED_COMPONENT_HINTS = (
    "components/islands/",
    "components/shared/",
    "shared/",
    "layouts/",
    "layout/",
    "providers/",
    "provider",
)

USER_COPY_PLACEHOLDER_RE = re.compile(
    r"\b(lorem ipsum|sample text|your (?:company|brand|title|content)|"
    r"acme corp|example brand|untitled)\b",
    re.I,
)
PLACEHOLDER_TOKEN_RE = re.compile(r"\bplaceholder\b", re.I)
COMING_SOON_RE = re.compile(r"\bcoming soon\b", re.I)


@dataclass
class Finding:
    severity: str
    check: str
    message: str
    file: str | None = None
    line: int | None = None
    evidence: str | None = None


@dataclass(frozen=True)
class FileContext:
    is_doc: bool = False
    is_eval: bool = False
    is_test: bool = False
    is_plugin: bool = False
    is_shared_component: bool = False


def iter_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_FILENAMES:
            continue
        if path.is_file() and path.suffix.lower() in TEXT_EXTENSIONS:
            yield path


def context_for(root: Path, path: Path) -> FileContext:
    relative = rel(root, path).replace("\\", "/")
    parts = set(Path(relative).parts)
    lower_name = path.name.lower()
    lower_relative = relative.lower()
    return FileContext(
        is_doc=lower_name in {name.lower() for name in DOC_FILENAMES}
        or bool(parts & DOC_DIRS),
        is_eval="evals" in parts,
        is_test=bool(parts & TEST_DIRS)
        or ".test." in lower_name
        or ".spec." in lower_name,
        is_plugin=bool(parts & PLUGIN_DIRS),
        is_shared_component=any(hint in lower_relative for hint in SHARED_COMPONENT_HINTS),
    )


def read_files(root: Path) -> list[tuple[Path, str]]:
    files: list[tuple[Path, str]] = []
    for path in iter_files(root):
        try:
            files.append((path, path.read_text(encoding="utf-8", errors="replace")))
        except OSError as exc:
            files.append((path, f"/* unreadable: {exc} */"))
    return files


def rel(root: Path, path: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def evidence(value: str) -> str:
    return " ".join(value.split())[:160]


def add_pattern_findings(
    findings: list[Finding],
    root: Path,
    files: list[tuple[Path, str]],
    check: str,
    severity: str,
    pattern: re.Pattern[str],
    message: str,
    limit: int = 10,
) -> int:
    added = 0
    for path, text in files:
        for match in pattern.finditer(text):
            if added >= limit:
                return added
            findings.append(
                Finding(
                    severity=severity,
                    check=check,
                    message=message,
                    file=rel(root, path),
                    line=line_number(text, match.start()),
                    evidence=evidence(match.group(0)),
                )
            )
            added += 1
    return added


def add_finding(
    findings: list[Finding],
    severity: str,
    check: str,
    message: str,
    root: Path | None = None,
    path: Path | None = None,
    text: str | None = None,
    index: int | None = None,
    sample: str | None = None,
) -> None:
    findings.append(
        Finding(
            severity=severity,
            check=check,
            message=message,
            file=rel(root, path) if root and path else None,
            line=line_number(text, index) if text is not None and index is not None else None,
            evidence=evidence(sample) if sample else None,
        )
    )


def has_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL) for pattern in patterns)


def count_pattern(text: str, pattern: str) -> int:
    return len(re.findall(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL))


def is_doc_context(ctx: FileContext, profile: str) -> bool:
    return ctx.is_doc or ctx.is_eval or (profile == "docs" and (ctx.is_plugin or ctx.is_doc))


def line_around(text: str, index: int) -> str:
    start = text.rfind("\n", 0, index) + 1
    end = text.find("\n", index)
    if end == -1:
        end = len(text)
    return text[start:end]


def inside_attribute(line: str, index_in_line: int, attribute: str) -> bool:
    before = line[:index_in_line]
    after = line[index_in_line:]
    attr = re.escape(attribute)
    if re.match(rf"{attr}\s*=", after, re.I):
        return True
    return re.search(rf"\b{attr}\s*=\s*['\"][^'\"]*$", before, re.I) is not None


def audit_placeholder_copy(root: Path, files: list[tuple[Path, str]], findings: list[Finding], profile: str) -> None:
    for path, text in files:
        ctx = context_for(root, path)

        for match in USER_COPY_PLACEHOLDER_RE.finditer(text):
            severity = "warn" if is_doc_context(ctx, profile) or ctx.is_test else "error"
            if ctx.is_eval and profile != "public-release":
                severity = "info"
            add_finding(
                findings,
                severity,
                "placeholder-text",
                "Placeholder or sample copy detected; confirm it is not user-facing production text.",
                root,
                path,
                text,
                match.start(),
                match.group(0),
            )

        for match in PLACEHOLDER_TOKEN_RE.finditer(text):
            line = line_around(text, match.start())
            index_in_line = match.start() - (text.rfind("\n", 0, match.start()) + 1)
            if inside_attribute(line, index_in_line, "placeholder"):
                continue
            if ctx.is_test or is_doc_context(ctx, profile):
                continue
            add_finding(
                findings,
                "warn",
                "placeholder-token",
                "The word placeholder appears outside an input placeholder attribute; verify it is not visible placeholder copy.",
                root,
                path,
                text,
                match.start(),
                match.group(0),
            )

        for match in COMING_SOON_RE.finditer(text):
            line = line_around(text, match.start())
            if re.search(r"\b(status|state|label|roadmap|upcoming|disabled|badge)\b", line, re.I):
                severity = "info" if profile != "public-release" else "warn"
                message = "Coming soon appears to be a state label; verify the disabled/upcoming state has a useful next action."
            elif is_doc_context(ctx, profile) or ctx.is_test:
                continue
            else:
                severity = "warn"
                message = "Coming soon appears in user-facing copy; replace with a concrete state or delivery path when possible."
            add_finding(findings, severity, "coming-soon", message, root, path, text, match.start(), match.group(0))


def audit_public_hygiene_signals(root: Path, files: list[tuple[Path, str]], findings: list[Finding], profile: str) -> None:
    cloud_drive_name = "One" + "Drive"
    patterns = [
        (
            "local-windows-path",
            re.compile(r"\b[A-Za-z]:\\(?:Users|Documents and Settings|" + re.escape(cloud_drive_name) + r")\\[^\s\"'<>]+"),
            "Windows absolute or user path detected.",
            "error",
        ),
        (
            "local-unix-user-path",
            re.compile(r"\b/(?:Users|home)/[A-Za-z0-9._-]+/[^\s\"'<>]+"),
            "Unix/macOS user absolute path detected.",
            "error",
        ),
        (
            "cloud-drive-path",
            re.compile(r"\b" + re.escape(cloud_drive_name) + r"[\\/][^\s\"'<>]+", re.I),
            "Personal cloud-drive path detected.",
            "error",
        ),
        (
            "codex-system-path",
            re.compile(r"\.codex[\\/]+skills[\\/]+\.system", re.I),
            "Local Codex system skill path detected.",
            "error",
        ),
        (
            "email-address",
            re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I),
            "Email address detected; confirm it is intended public contact information.",
            "warn",
        ),
    ]
    for path, text in files:
        ctx = context_for(root, path)
        for check, pattern, message, base_severity in patterns:
            limit = 0
            for match in pattern.finditer(text):
                if limit >= 6:
                    break
                severity = base_severity
                if is_doc_context(ctx, profile) and check in {"email-address"}:
                    severity = "info" if profile != "public-release" else "warn"
                add_finding(findings, severity, check, message, root, path, text, match.start(), match.group(0))
                limit += 1

        for match in re.finditer(r"\.env(?:\.[A-Za-z0-9_-]+)?", text, re.I):
            if is_doc_context(ctx, profile):
                severity = "info" if profile != "public-release" else "warn"
                message = "Environment file reference appears in docs/evals; confirm examples do not include real secret values."
            else:
                severity = "warn"
                message = "Environment file reference detected; confirm no secret values are included."
            add_finding(findings, severity, "env-file-reference", message, root, path, text, match.start(), match.group(0))

        for match in re.finditer(r"\b(?:api[_-]?key|access[_-]?token|secret|private[_-]?key|password)\s*[:=]\s*[\"'][^\"']{8,}[\"']", text, re.I):
            if is_doc_context(ctx, profile):
                severity = "warn" if profile == "public-release" else "info"
                message = "Secret-like assignment appears in documentation; confirm it is a fake example."
            else:
                severity = "error"
                message = "Possible secret assignment detected."
            add_finding(findings, severity, "secret-risk", message, root, path, text, match.start(), match.group(0))


def audit_shared_component_risk(root: Path, files: list[tuple[Path, str]], findings: list[Finding]) -> None:
    seen: set[str] = set()
    for path, text in files:
        ctx = context_for(root, path)
        if not ctx.is_shared_component:
            continue
        relative = rel(root, path)
        if relative in seen:
            continue
        if has_any(text, [r"requestAnimationFrame", r"matchMedia", r"localStorage", r"sessionStorage", r"addEventListener", r"createContext", r"Theme"]):
            add_finding(
                findings,
                "info",
                "shared-component-blast-radius",
                "Shared interactive component detected; when changing this file, report blast radius and route-wide impact.",
                root,
                path,
                text,
                0,
                relative,
            )
            seen.add(relative)


def audit(root: Path, profile: str = "app") -> tuple[list[Finding], dict[str, int]]:
    files = read_files(root)
    combined = "\n".join(text for _, text in files)
    findings: list[Finding] = []

    audit_public_hygiene_signals(root, files, findings, profile)
    audit_placeholder_copy(root, files, findings, profile)
    audit_shared_component_risk(root, files, findings)

    add_pattern_findings(
        findings,
        root,
        files,
        "placeholder-feature-name",
        "warn",
        re.compile(r"\b(feature|benefit|card|section)\s*(?:one|two|three|1|2|3)\b", re.I),
        "Placeholder feature/card naming detected.",
    )

    add_pattern_findings(
        findings,
        root,
        files,
        "generic-marketing-phrase",
        "warn",
        re.compile(
            r"\b(ai-powered|next-generation|unlock your potential|transform your workflow|seamless experience|"
            r"revolutionary platform|beautiful modern responsive|all[- ]in[- ]one solution|supercharge productivity|"
            r"elevate your business|future of work|effortless collaboration)\b",
            re.I,
        ),
        "Generic marketing phrase detected; make copy specific to user task, domain, or state.",
    )

    gradient_count = count_pattern(combined, r"(linear-gradient|radial-gradient|conic-gradient)")
    purple_blue_count = count_pattern(combined, r"(purple|violet|indigo|blue|#6d28d9|#7c3aed|#8b5cf6|#2563eb|#3b82f6|#4f46e5)")
    card_count = count_pattern(combined, r"\b(card|feature-card|benefit-card)\b")
    hero_present = has_any(combined, [r"\bhero\b", r"<section[^>]+class=[\"'][^\"']*hero"])
    if hero_present and gradient_count >= 1 and card_count >= 3:
        findings.append(
            Finding(
                "warn",
                "hero-gradient-three-cards",
                "Hero + gradient + repeated cards pattern detected; confirm this is not a default AI/SaaS template.",
            )
        )
    root_label = str(root).replace("\\", "/").lower()
    if "dashboard" in root_label and hero_present and card_count >= 3:
        findings.append(
            Finding(
                "warn",
                "dashboard-marketing-page",
                "Dashboard path contains hero/card marketing signals; operational dashboards should prioritize dense status and exception handling.",
            )
        )
    mini_program_like = "mini-program" in root_label or has_any(combined, [r"<view\b", r"<text\b", r"<image\b"])
    if mini_program_like and hero_present:
        findings.append(
            Finding(
                "warn",
                "mobile-platform-mismatch",
                "Mini-program/mobile flow contains hero-page signals; mobile task flows should start with the primary task.",
            )
        )
    if gradient_count >= 3 and purple_blue_count >= 3:
        add_pattern_findings(
            findings,
            root,
            files,
            "purple-blue-gradient",
            "warn",
            re.compile(r".*(?:linear-gradient|radial-gradient|conic-gradient).*(?:purple|violet|indigo|blue|#6d28d9|#7c3aed|#8b5cf6|#2563eb|#3b82f6|#4f46e5).*", re.I),
            "Repeated purple/blue gradients detected; confirm they are a deliberate brand system.",
            limit=6,
        )

    blob_count = count_pattern(combined, r"\b(blob|orb|bokeh)\b|filter:\s*blur|backdrop-filter:\s*blur|blur\(")
    if blob_count >= 3:
        add_pattern_findings(
            findings,
            root,
            files,
            "blur-blob-orb",
            "warn",
            re.compile(r".*(?:\bblob\b|\borb\b|\bbokeh\b|filter:\s*blur|backdrop-filter:\s*blur|blur\().*", re.I),
            "Repeated blob/orb/blur decoration detected; remove unless it supports the design thesis.",
            limit=6,
        )

    # Motion risks.
    motion_present = has_any(combined, [r"\banimation\b", r"\btransition\b", r"@keyframes", r"framer-motion", r"\bgsap\b", r"ScrollTrigger"])
    reduced_motion_present = has_any(combined, [r"prefers-reduced-motion", r"useReducedMotion", r"reducedMotion", r"matchMedia\([^)]*prefers-reduced-motion"])
    if motion_present and not reduced_motion_present:
        findings.append(Finding("error", "reduced-motion", "Motion is present but no reduced-motion handling was found."))

    add_pattern_findings(
        findings,
        root,
        files,
        "transition-all",
        "warn",
        re.compile(r"\btransition-all\b|transition\s*:\s*all\b", re.I),
        "Broad transition-all detected; target specific properties to avoid accidental motion and layout jank.",
    )

    for path, text in files:
        for match in re.finditer(r"(?:(?:duration|animation-duration|transition-duration)\s*[:=]\s*|duration-)(\d+(?:\.\d+)?)(ms|s)?", text, re.I):
            value = float(match.group(1))
            unit = match.group(2) or "ms"
            ms = value * 1000 if unit.lower() == "s" else value
            if ms > 700:
                findings.append(
                    Finding(
                        "warn",
                        "long-duration",
                        "Long UI animation duration detected; routine UI motion should usually stay below 700ms.",
                        rel(root, path),
                        line_number(text, match.start()),
                        evidence(match.group(0)),
                    )
                )

    animate_in_count = count_pattern(combined, r"\banimate[-_]?in\b|\bfade[-_]?in\b|\bslide[-_]?in\b|\bzoom[-_]?in\b")
    if animate_in_count >= 6:
        findings.append(
            Finding(
                "warn",
                "many-animate-in",
                "Many animate-in patterns detected; confirm elements do not all enter at once.",
                evidence=f"{animate_in_count} entrance-like references",
            )
        )

    # Accessibility.
    add_pattern_findings(
        findings,
        root,
        files,
        "missing-img-alt",
        "error",
        re.compile(r"<img\b(?![^>]*\balt\s*=)[^>]*>", re.I | re.S),
        "HTML image without alt text detected.",
    )
    add_pattern_findings(
        findings,
        root,
        files,
        "missing-wxml-image-label",
        "warn",
        re.compile(r"<image\b(?![^>]*(?:aria-label|alt)\s*=)[^>]*>", re.I | re.S),
        "Mini-program image without aria-label/alt-like label detected.",
    )
    add_pattern_findings(
        findings,
        root,
        files,
        "empty-button-name",
        "error",
        re.compile(r"<button\b(?![^>]*(?:aria-label|title)\s*=)[^>]*>\s*(?:<svg[\s\S]*?</svg>|<i\b[\s\S]*?</i>|)\s*</button>", re.I),
        "Button appears to lack an accessible name.",
    )

    input_count = count_pattern(combined, r"<(?:input|select|textarea)\b")
    label_count = count_pattern(combined, r"<label\b|aria-label=|aria-labelledby=")
    if input_count and label_count < input_count:
        findings.append(
            Finding(
                "warn",
                "form-labels",
                "Form controls may be missing labels or accessible names.",
                evidence=f"{input_count} controls, {label_count} label/name signals",
            )
        )

    interactive_present = has_any(combined, [r"<button\b", r"<a\b", r"<input\b", r"<select\b", r"<textarea\b", r"role=[\"']button"])
    focus_present = has_any(combined, [r":focus", r"focus-visible", r"focus:ring", r"focus:outline", r"\bfocusVisible\b"])
    if interactive_present and not focus_present:
        findings.append(Finding("warn", "focus-visible", "Interactive elements were found but no visible focus styling signal was detected."))

    color_only_state_count = count_pattern(combined, r"\b(red|green|yellow|orange|danger|success|warning)\b")
    text_state_count = count_pattern(combined, r"\b(error|warning|success|failed|disabled|unavailable|retry|pending|loading)\b")
    if color_only_state_count >= 4 and text_state_count == 0:
        findings.append(Finding("warn", "color-only-state", "Status colors found without state text signals; verify state is not conveyed by color only."))

    # Responsive risks.
    responsive_present = has_any(combined, [r"@media\b", r"@container\b", r"\bclamp\(", r"\bminmax\(", r"\b(sm|md|lg|xl):", r"grid-template-columns"])
    if not responsive_present:
        findings.append(Finding("warn", "responsive-signals", "No obvious responsive CSS or utility signals found."))

    add_pattern_findings(
        findings,
        root,
        files,
        "fixed-width",
        "warn",
        re.compile(r"(?<![-\w])width\s*:\s*(?:[6-9]\d{2,}|\d{4,})px\b|\bw-\[(?:[6-9]\d{2,}|\d{4,})px\]", re.I),
        "Large fixed width detected; verify mobile behavior.",
    )
    add_pattern_findings(
        findings,
        root,
        files,
        "vw-overflow-risk",
        "warn",
        re.compile(r"\bwidth\s*:\s*100vw\b|\bw-screen\b", re.I),
        "100vw/w-screen can create horizontal overflow when scrollbars are present.",
    )

    state_present = has_any(combined, [r"\bloading\b", r"\bempty\b", r"\berror\b", r"\bdisabled\b", r"\bpending\b", r"\bskeleton\b", r"\bspinner\b", r"aria-busy"])
    if not state_present:
        findings.append(Finding("warn", "state-coverage", "No obvious loading/empty/error/disabled/pending state signal found."))

    js_loop_present = has_any(combined, [r"requestAnimationFrame", r"setInterval\(", r"<video\b", r"\bgsap\b", r"ScrollTrigger", r"<canvas\b"])
    reduced_js_present = has_any(
        combined,
        [
            r"useReducedMotion",
            r"matchMedia\([^)]*prefers-reduced-motion",
            r"reducedMotion",
            r"prefersReducedMotion",
        ],
    )
    if js_loop_present and not reduced_js_present:
        findings.append(Finding("error", "reduced-motion-js-loop", "JS/canvas/video/long-running motion signal found without reduced-motion handling."))

    personal_site_like = has_any(combined, [r"\bportfolio\b", r"\bpersonal site\b", r"\bpet\b", r"\btoy\b", r"\bconsole\b", r"\bdock\b"])
    if personal_site_like and hero_present and purple_blue_count >= 2 and card_count >= 3:
        findings.append(
            Finding(
                "warn",
                "personal-site-saas-hero",
                "Personal/portfolio surface has SaaS hero signals; preserve identity, project proof, and interaction affordances.",
            )
        )

    touch_target_signal = has_any(
        combined,
        [
            r"(?:min-)?height\s*:\s*(?:44px|2\.75rem)",
            r"(?:min-)?width\s*:\s*(?:44px|2\.75rem)",
            r"\b(?:h|w|min-h|min-w|size)-11\b",
        ],
    )
    if personal_site_like and has_any(combined, [r"\bpet\b", r"\bfloating\b"]) and not touch_target_signal:
        findings.append(
            Finding(
                "warn",
                "floating-control-mobile-target",
                "Floating/pet control detected without obvious 44px touch-target signal.",
            )
        )

    visual_asset_present = has_any(combined, [r"<img\b", r"<image\b", r"<video\b", r"<picture\b", r"\.(png|jpe?g|webp|avif|mp4|webm|svg)", r"background-image\s*:\s*url"])
    if not visual_asset_present:
        findings.append(Finding("info", "visual-assets", "No obvious visual asset references found; confirm assets are not needed for this interface."))

    summary = {
        "files_scanned": len(files),
        "errors": sum(1 for item in findings if item.severity == "error"),
        "warnings": sum(1 for item in findings if item.severity == "warn"),
        "info": sum(1 for item in findings if item.severity == "info"),
        "findings": len(findings),
    }
    return findings, summary


def format_report(findings: list[Finding], summary: dict[str, int]) -> str:
    lines = [
        "Frontend design heuristic audit",
        f"Files scanned: {summary['files_scanned']}",
        f"Profile: {summary['profile']}",
        f"Findings: {summary['findings']} (errors: {summary['errors']}, warnings: {summary['warnings']}, info: {summary['info']})",
        "Scope: heuristic implementation signals, not aesthetic judgment.",
        "",
    ]
    if not findings:
        lines.append("No heuristic findings.")
        return "\n".join(lines)

    for item in findings:
        location = ""
        if item.file:
            location = f" ({item.file}"
            if item.line:
                location += f":{item.line}"
            location += ")"
        lines.append(f"[{item.severity.upper()}] {item.check}{location}: {item.message}")
        if item.evidence:
            lines.append(f"  evidence: {item.evidence}")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Run heuristic frontend design checks.")
    parser.add_argument("path", nargs="?", default=".", help="Directory to scan.")
    parser.add_argument("--profile", choices=["app", "public-release", "docs"], default="app", help="Audit strictness profile.")
    parser.add_argument("--json", action="store_true", help="Emit JSON report.")
    args = parser.parse_args(argv)

    root = Path(args.path).resolve()
    if not root.exists():
        print(f"Path does not exist: {root}", file=sys.stderr)
        return 2
    if not root.is_dir():
        print(f"Path is not a directory: {root}", file=sys.stderr)
        return 2

    findings, summary = audit(root, profile=args.profile)
    summary["profile"] = args.profile
    if args.json:
        print(json.dumps({"summary": summary, "findings": [asdict(item) for item in findings]}, indent=2))
    else:
        print(format_report(findings, summary))

    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
