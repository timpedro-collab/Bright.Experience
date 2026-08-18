/**
 * Inventory listing behaviour: the rendered block matches the content module
 * and the copy button ships the paste-ready plain text.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InventoryListing, listingText } from "./InventoryListing";
import { INVENTORY_LISTING } from "@/lib/informa/content";

describe("InventoryListing", () => {
  it("renders the listing exactly as the content module defines it", () => {
    render(<InventoryListing />);
    expect(screen.getByText(INVENTORY_LISTING.title)).toBeInTheDocument();
    expect(screen.getByText(INVENTORY_LISTING.body)).toBeInTheDocument();
    for (const item of INVENTORY_LISTING.includes) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it("copies the paste-ready plain text listing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.assign(navigator.clipboard, { writeText });
    render(<InventoryListing />);

    await user.click(screen.getByRole("button", { name: /copy the listing/i }));

    expect(writeText).toHaveBeenCalledWith(listingText());
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("builds plain text that carries the title, body and every include line", () => {
    const text = listingText();
    expect(text).toContain(INVENTORY_LISTING.title);
    expect(text).toContain(INVENTORY_LISTING.body);
    for (const item of INVENTORY_LISTING.includes) {
      expect(text).toContain(`- ${item}`);
    }
    expect(text).toContain(INVENTORY_LISTING.priceLine);
  });
});
