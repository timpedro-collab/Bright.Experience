import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, userEvent } from "@/test/render";
import { useModalOverlay } from "./useModalOverlay";

function Overlay({
  onClose,
  onPrev,
  onNext,
  trapFocus,
}: {
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  trapFocus?: boolean;
}) {
  const ref = useModalOverlay<HTMLDivElement>({
    active: true,
    onClose,
    onPrev,
    onNext,
    trapFocus,
  });
  return (
    <div ref={ref} role="dialog" aria-label="Overlay" tabIndex={-1}>
      <button type="button">First</button>
      <input aria-label="Note" />
      <button type="button">Last</button>
    </div>
  );
}

function Harness(props: {
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  trapFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <Overlay
          onClose={() => {
            props.onClose?.();
            setOpen(false);
          }}
          onPrev={props.onPrev}
          onNext={props.onNext}
          trapFocus={props.trapFocus}
        />
      )}
    </div>
  );
}

describe("useModalOverlay", () => {
  it("moves focus into the overlay when it opens", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to whatever opened it", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("steps with the arrow keys when handlers are supplied", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(<Harness onPrev={onPrev} onNext={onNext} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowLeft}");
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("leaves the arrow keys alone while the user is typing", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<Harness onNext={onNext} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("textbox", { name: "Note" }));
    await user.keyboard("{ArrowRight}");
    expect(onNext).not.toHaveBeenCalled();
  });

  it("keeps Tab inside the overlay", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    await user.tab();
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it("locks and restores background scrolling", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.body.style.overflow).not.toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("does not lock scrolling or trap Tab when the trap is off", async () => {
    const user = userEvent.setup();
    render(<Harness trapFocus={false} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(document.body.style.overflow).not.toBe("hidden");
    screen.getByRole("button", { name: "Last" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "First" })).not.toHaveFocus();
  });
});
