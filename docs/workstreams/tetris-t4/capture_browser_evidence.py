from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
BASE_SCRIPT = ROOT / "scripts" / "capture-tetris-t3-evidence.py"
OUTPUT = ROOT / "docs" / "qa" / "evidence" / "tetris-t4"


def load_base_module():
    spec = importlib.util.spec_from_file_location("tetris_t3_capture", BASE_SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {BASE_SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def git_diff_sha256() -> str:
    diff = subprocess.check_output(["git", "diff", "--binary", "HEAD"], cwd=ROOT)
    return hashlib.sha256(diff).hexdigest()


def board_gate(capture: dict, width_range: tuple[float, float], center_tolerance: float) -> None:
    viewport = capture["geometry"]["viewport"]
    board = capture["geometry"]["bounds"]["board"]
    assert width_range[0] <= board["width"] <= width_range[1], capture
    assert abs(board["height"] / board["width"] - 2) <= 0.02, capture
    board_center = board["left"] + board["width"] / 2
    assert abs(board_center - viewport["width"] / 2) <= center_tolerance, capture


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:5174")
    args = parser.parse_args()

    base = load_base_module()
    base.EVIDENCE_ROOT = OUTPUT.parent
    previous_argv = sys.argv
    try:
        sys.argv = [str(BASE_SCRIPT), "--base-url", args.base_url, "--stage", "tetris-t4"]
        original_choices = argparse.ArgumentParser.add_argument

        def permit_t4(self, *option_strings, **kwargs):
            if kwargs.get("choices") == ("development", "final"):
                kwargs["choices"] = ("development", "final", "tetris-t4")
            return original_choices(self, *option_strings, **kwargs)

        argparse.ArgumentParser.add_argument = permit_t4
        try:
            base.main()
        finally:
            argparse.ArgumentParser.add_argument = original_choices
    finally:
        sys.argv = previous_argv

    manifest_path = OUTPUT / "browser-evidence.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    wide = base.Viewport("wide", 2048, 1152, 1)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page, errors = base.new_page(browser, wide, args.base_url)
        wide_captures = [base.capture(page, OUTPUT, "wide-ready", errors, expect_next=False)]
        base.start_playing(page)
        wide_captures.append(base.capture(page, OUTPUT, "wide-playing", errors, expect_next=True))
        page.get_by_role("button", name="暂停", exact=True).click()
        page.wait_for_selector('[data-testid="pause-strip"]')
        wide_captures.append(base.capture(page, OUTPUT, "wide-paused", errors, expect_next=True))
        assert not errors, errors
        page.context.close()
        browser.close()

    captures = manifest["captures"] + wide_captures
    by_name = {capture["name"]: capture for capture in captures}
    board_gate(by_name["desktop-ready"], (370, 390), 24)
    board_gate(by_name["wide-ready"], (440, 470), 32)
    board_gate(by_name["portrait-playing"], (252, 270), 2)
    board_gate(by_name["landscape-playing"], (150, 162), 12)
    for name in ("desktop-paused", "wide-paused", "portrait-paused"):
        assertions = by_name[name]["geometry"]["assertions"]
        assert assertions["pauseStripRatio"] <= 0.18, by_name[name]
        assert assertions["pauseInsideBoard"], by_name[name]

    manifest.update(
        {
            "candidateBase": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
            "candidateWorkingTreeDiffSha256": git_diff_sha256(),
            "stage": "tetris-t4-final",
            "captures": captures,
        }
    )
    manifest["checks"]["screenshots"] = len(captures)
    manifest["checks"]["t4BoardTargets"] = "passed"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sums = []
    for path in sorted(OUTPUT.glob("*.png")):
        sums.append(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}")
    sums.append(f"{hashlib.sha256(manifest_path.read_bytes()).hexdigest()}  {manifest_path.name}")
    (OUTPUT / "SHA256SUMS.txt").write_text("\n".join(sums) + "\n", encoding="utf-8")
    print(json.dumps({"result": "passed", "captures": len(captures)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
