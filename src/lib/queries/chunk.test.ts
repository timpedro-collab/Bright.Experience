import { describe, it, expect, vi } from "vitest";

import { chunk, forEachChunk, IN_CHUNK_SIZE } from "./chunk";

describe("chunk", () => {
  it("splits a list into batches of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single batch when the list already fits", () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("returns nothing for an empty list", () => {
    expect(chunk([], 5)).toEqual([]);
  });

  it("defaults to a size that keeps the query string under the URL cap", () => {
    const ids = Array.from({ length: IN_CHUNK_SIZE + 1 }, (_, i) => `id-${i}`);

    expect(chunk(ids)).toHaveLength(2);
  });

  it("rejects a size that would never terminate", () => {
    expect(() => chunk([1], 0)).toThrow(/at least 1/);
  });
});

describe("forEachChunk", () => {
  it("calls the worker once per batch and flattens the results", async () => {
    const seen: number[][] = [];
    const result = await forEachChunk(
      [1, 2, 3, 4, 5],
      async (batch) => {
        seen.push(batch);
        return batch.map((n) => n * 10);
      },
      2
    );

    expect(seen).toEqual([[1, 2], [3, 4], [5]]);
    expect(result).toEqual([10, 20, 30, 40, 50]);
  });

  it("does no work for an empty list", async () => {
    const fn = vi.fn(async () => []);

    expect(await forEachChunk([], fn, 2)).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it("stops at the first failing batch rather than continuing blind", async () => {
    const fn = vi.fn(async (batch: number[]) => {
      if (batch[0] === 3) throw new Error("boom");
      return batch;
    });

    await expect(forEachChunk([1, 2, 3, 4], fn, 2)).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
