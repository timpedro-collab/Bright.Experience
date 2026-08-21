#!/usr/bin/env python3
"""One-shot visual QA: screenshot every slide of both 5-slide snapshot decks."""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
DECKS = [("informa-snapshot", "/informa/snapshot"), ("venue", "/venue")]
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/snapshot-decks"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 810}, device_scale_factor=2)
    for name, path in DECKS:
        for slide in range(1, 6):
            page.goto(f"{BASE}{path}?slide={slide}", wait_until="domcontentloaded")
            page.wait_for_timeout(2200)
            page.screenshot(path=f"{OUT}/{name}-slide-{slide}.png")
            print(f"captured {name} slide {slide}")
    browser.close()
