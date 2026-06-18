import { describe, it, expect, vi } from "vitest";
import { parsePage, paginateQuery, totalPages, PAGE_SIZE } from "./pagination";

describe("parsePage", () => {
  it("defaults to 1 when absent", () => {
    expect(parsePage({})).toBe(1);
  });

  it("parses a valid page string", () => {
    expect(parsePage({ page: "3" })).toBe(3);
  });

  it("falls back to 1 for invalid or out-of-range values", () => {
    expect(parsePage({ page: "0" })).toBe(1);
    expect(parsePage({ page: "-2" })).toBe(1);
    expect(parsePage({ page: "abc" })).toBe(1);
    expect(parsePage({ page: ["2", "3"] })).toBe(1);
  });
});

describe("paginateQuery", () => {
  it("computes a zero-indexed [from,to] range for page 1", () => {
    const range = vi.fn((from: number, to: number) => ({ from, to }));
    const query = { range };
    paginateQuery(query as never, 1, 25);
    expect(range).toHaveBeenCalledWith(0, 24);
  });

  it("offsets correctly for later pages", () => {
    const range = vi.fn((from: number, to: number) => ({ from, to }));
    paginateQuery({ range } as never, 3, 10);
    expect(range).toHaveBeenCalledWith(20, 29);
  });

  it("uses the default page size when omitted", () => {
    const range = vi.fn((from: number, to: number) => ({ from, to }));
    paginateQuery({ range } as never, 2);
    expect(range).toHaveBeenCalledWith(PAGE_SIZE, PAGE_SIZE * 2 - 1);
  });
});

describe("totalPages", () => {
  it("rounds up partial pages and never returns less than 1", () => {
    expect(totalPages(0, 25)).toBe(1);
    expect(totalPages(25, 25)).toBe(1);
    expect(totalPages(26, 25)).toBe(2);
    expect(totalPages(51, 25)).toBe(3);
  });
});
