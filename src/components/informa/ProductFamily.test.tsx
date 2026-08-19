/**
 * Product family behaviour: tiles select the focused product, the detail
 * follows the selection, and the configurator handoff fires with the
 * product's preset price only where pricing applies.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductFamily } from "./ProductFamily";
import { PRODUCT_FAMILY } from "@/lib/informa/products";

describe("ProductFamily", () => {
  it("renders all four products as selectable tiles, flagship focused", () => {
    render(<ProductFamily />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(PRODUCT_FAMILY.length);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: /registration takeover/i })
    ).toBeInTheDocument();
  });

  it("focuses a product when its tile is selected", async () => {
    const user = userEvent.setup();
    render(<ProductFamily />);

    await user.click(screen.getByRole("tab", { name: /screen ad network/i }));

    expect(
      screen.getByRole("tab", { name: /screen ad network/i })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      await screen.findByRole("heading", { name: /screen ad network/i })
    ).toBeInTheDocument();
  });

  it("hands the preset price to the configurator callback", async () => {
    const onPriceProduct = vi.fn();
    const user = userEvent.setup();
    render(<ProductFamily onPriceProduct={onPriceProduct} />);

    await user.click(
      screen.getByRole("button", { name: /price this in the configurator/i })
    );

    expect(onPriceProduct).toHaveBeenCalledWith(60_000);
  });

  it("offers no configurator handoff on per-slot and organizer products", async () => {
    const onPriceProduct = vi.fn();
    const user = userEvent.setup();
    render(<ProductFamily onPriceProduct={onPriceProduct} />);

    await user.click(screen.getByRole("tab", { name: /rebooking engine/i }));

    // The outgoing panel stays mounted while the carousel exit animation
    // plays; wait for it to unmount before asserting the CTA is gone.
    await waitFor(
      () =>
        expect(
          screen.queryByRole("button", { name: /price this in the configurator/i })
        ).not.toBeInTheDocument(),
      { timeout: 3_000 }
    );
  });

  it("steps through products with the arrows and stops at the ends", async () => {
    const user = userEvent.setup();
    render(<ProductFamily />);

    expect(screen.getByRole("button", { name: /previous product/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /next product/i }));
    expect(
      screen.getByRole("tab", { name: /show-floor activation/i })
    ).toHaveAttribute("aria-selected", "true");
  });
});
