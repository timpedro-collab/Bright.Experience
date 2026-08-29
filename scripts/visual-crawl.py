#!/usr/bin/env python3
"""
Visual QA crawl for the Ink rebrand — screenshots every reachable route in
BOTH themes (Ink default + Ink Light) and reports console errors.

Usage:
  pip3 install playwright && python3 -m playwright install chromium
  python3 scripts/visual-crawl.py [--base http://localhost:3000] [--out /tmp/crawl]

Logs in via the mock-mode form (tim@brightblue.co.uk / brightblue), BFS-crawls
same-origin links up to MAX_ROUTES, then shoots every discovered route in each
theme. Exit code 1 if any route threw console errors or failed to render.
"""
import argparse
import os
import re
import sys
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

# Routes always shot even if not discovered by the crawl.
SEED_ROUTES = [
    "/",
    "/login",
    "/forgot-password",
    "/pipeline",
    "/inbox",
    "/settings",
    "/notifications",
    "/welcome",
    "/help",
    "/admin/partners",
    "/admin/quotes",
    "/catalog",
    "/catalog/machines",
    "/catalog/case-studies",
    "/pricing",
    "/informa",
    "/informa/kit",
    "/informa/report",
    "/informa/snapshot",
    "/informa/sponsor",
    "/venue",
    "/commercial-plan",
]

# Never crawl into these (mutating routes, external, print handled by Wave 2).
SKIP = re.compile(r"^/(api|_next)|/print|/logout|/auth/set-password|\.(pdf|png|jpg|svg)$")

MAX_ROUTES = 60


def sanitize(route: str) -> str:
    return route.strip("/").replace("/", "_") or "root"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--out", default="/tmp/ink_crawl")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    failures: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900}, device_scale_factor=1.5
        )
        page = ctx.new_page()
        console_errors: list[str] = []
        page.on(
            "console",
            lambda m: console_errors.append(m.text) if m.type == "error" else None,
        )

        # Mock login (wait for hydration before filling).
        page.goto(f"{args.base}/login", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2000)
        page.fill('input[type="email"]', "tim@brightblue.co.uk")
        page.fill('input[type="password"]', "brightblue")
        page.wait_for_selector('button[type="submit"]:not([disabled])', timeout=20000)
        page.click('button[type="submit"]')
        page.wait_for_timeout(4000)

        # BFS route discovery from seeds.
        routes: list[str] = []
        seen = set()
        queue = list(SEED_ROUTES)
        while queue and len(routes) < MAX_ROUTES:
            route = queue.pop(0)
            if route in seen or SKIP.search(route):
                continue
            seen.add(route)
            routes.append(route)
            try:
                page.goto(f"{args.base}{route}", wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(1200)
                hrefs = page.eval_on_selector_all(
                    "a[href^='/']", "els => els.map(e => e.getAttribute('href'))"
                )
                for h in hrefs:
                    path = urlparse(h).path
                    if path and path not in seen and not SKIP.search(path):
                        queue.append(path)
            except Exception as e:  # discovery failures are non-fatal
                print(f"discover {route}: {type(e).__name__}")

        print(f"crawling {len(routes)} routes")

        for theme, store in (("ink", None), ("light", "light")):
            page.goto(f"{args.base}/", wait_until="domcontentloaded", timeout=45000)
            if store:
                page.evaluate(f"localStorage.setItem('bright.theme','{store}')")
            else:
                page.evaluate("localStorage.removeItem('bright.theme')")
            for route in routes:
                console_errors.clear()
                try:
                    page.goto(
                        f"{args.base}{route}", wait_until="domcontentloaded", timeout=45000
                    )
                    page.wait_for_timeout(1800)
                    page.screenshot(
                        path=os.path.join(args.out, f"{theme}__{sanitize(route)}.png")
                    )
                    real_errors = [
                        e
                        for e in console_errors
                        if "Failed to load resource" not in e  # 404 images etc. logged separately
                    ]
                    if real_errors:
                        failures.append(f"{theme} {route}: {real_errors[:2]}")
                        print(f"ERR {theme} {route}: {real_errors[:2]}")
                    else:
                        print(f"ok  {theme} {route}")
                except Exception as e:
                    failures.append(f"{theme} {route}: {type(e).__name__}")
                    print(f"FAIL {theme} {route}: {type(e).__name__}")

        browser.close()

    print(f"\n{len(failures)} failures")
    for f in failures:
        print(" -", f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
