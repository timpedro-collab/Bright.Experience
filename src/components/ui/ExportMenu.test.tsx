/**
 * Component tests for the export dropdown — menu open + CSV fetch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: {
      loading: vi.fn(() => "toast-id"),
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe("ExportMenu", () => {
  const fetchMock = vi.fn();
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["a,b\n1,2"], { type: "text/csv" }),
      headers: { get: () => 'attachment; filename="leads.csv"' },
    });
    vi.stubGlobal("fetch", fetchMock);

    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("opens the menu and lists export formats", async () => {
    const user = userEvent.setup();
    const { ExportMenu } = await import("./ExportMenu");
    render(<ExportMenu eventId="evt-1" view="leads" />);

    await user.click(screen.getByRole("button", { name: /Export/i }));
    expect(await screen.findByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Excel")).toBeInTheDocument();
  });

  it("fetches the CSV export when CSV is selected", async () => {
    const user = userEvent.setup();
    const { ExportMenu } = await import("./ExportMenu");
    render(<ExportMenu eventId="evt-1" view="leads" />);

    await user.click(screen.getByRole("button", { name: /Export/i }));
    await user.click(await screen.findByText("CSV"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/events/evt-1/export?format=csv&view=leads",
      );
    });
  });
});
