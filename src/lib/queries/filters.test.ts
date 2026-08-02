/**
 * Tests for PostgREST filter construction. The point of the module is that a
 * search term can never become part of the filter grammar, so most of these
 * are injection attempts.
 */
import { describe, it, expect } from "vitest";

import {
  quoteFilterValue,
  ilikeContains,
  inList,
  anyOf,
  isEmptySearch,
} from "./filters";

describe("quoteFilterValue", () => {
  it("wraps a plain value in double quotes", () => {
    expect(quoteFilterValue("acme")).toBe('"acme"');
  });

  it("neutralises the comma that separates PostgREST filters", () => {
    expect(quoteFilterValue("a,role.eq.admin")).toBe('"a,role.eq.admin"');
  });

  it("escapes embedded double quotes so the value cannot end early", () => {
    expect(quoteFilterValue('a",role.eq.admin')).toBe('"a\\",role.eq.admin"');
  });

  it("escapes backslashes before quotes, so an escaped quote stays escaped", () => {
    expect(quoteFilterValue('a\\"b')).toBe('"a\\\\\\"b"');
  });
});

describe("ilikeContains", () => {
  it("builds a contains filter for an ordinary term", () => {
    expect(ilikeContains("name", "acme")).toBe('name.ilike."%acme%"');
  });

  it("strips user-supplied wildcards so a search cannot match everything", () => {
    expect(ilikeContains("name", "%")).toBe('name.ilike."%%"');
    expect(ilikeContains("name", "a*b_c")).toBe('name.ilike."%abc%"');
  });

  it("keeps an injected filter inside the quoted value", () => {
    const filter = ilikeContains("name", "x,email.ilike.*@rival.com");

    expect(filter).toBe('name.ilike."%x,email.ilike.@rival.com%"');
  });

  it("trims surrounding whitespace", () => {
    expect(ilikeContains("name", "  acme  ")).toBe('name.ilike."%acme%"');
  });
});

describe("inList", () => {
  it("quotes every id", () => {
    expect(inList("account_id", ["a1", "a2"])).toBe('account_id.in.("a1","a2")');
  });

  it("produces an empty list rather than a malformed filter", () => {
    expect(inList("account_id", [])).toBe("account_id.in.()");
  });
});

describe("anyOf", () => {
  it("joins fragments with the separator PostgREST expects", () => {
    expect(anyOf("a.eq.1", "b.eq.2")).toBe("a.eq.1,b.eq.2");
  });

  it("drops empty fragments so a skipped clause leaves no trailing comma", () => {
    expect(anyOf("a.eq.1", "")).toBe("a.eq.1");
  });
});

describe("isEmptySearch", () => {
  it("treats absent, blank and wildcard-only terms as empty", () => {
    expect(isEmptySearch(undefined)).toBe(true);
    expect(isEmptySearch("")).toBe(true);
    expect(isEmptySearch("   ")).toBe(true);
    expect(isEmptySearch("%%*")).toBe(true);
  });

  it("treats a real term as searchable", () => {
    expect(isEmptySearch("ac")).toBe(false);
  });
});
