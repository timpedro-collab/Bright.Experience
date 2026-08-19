/**
 * Catalogue wiring: picking "Price this in the configurator" on a product
 * moves the configurator's price lever to that product's suggested price.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { KitCatalog } from "./KitCatalog";

describe("KitCatalog", () => {
  it("renders the product family, rate card and configurator together", () => {
    render(<KitCatalog />);
    expect(screen.getByRole("tab", { name: /the arrival/i })).toBeInTheDocument();
    expect(screen.getByText(/rate-card line/i)).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /sponsor price/i })).toBeInTheDocument();
  });

  it("presets the configurator price from the focused product", async () => {
    const user = userEvent.setup();
    render(<KitCatalog />);

    // The Arrival is focused by default and suggests $60,000.
    await user.click(
      screen.getByRole("button", { name: /price this in the configurator/i })
    );

    expect(
      screen.getByRole("slider", { name: /sponsor price/i })
    ).toHaveAttribute("aria-valuenow", "60000");
  });
});
