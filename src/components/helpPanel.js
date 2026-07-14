export function createHelpPanel({ openBtn, overlayEl, closeBtn }) {
  let open = false;

  function setOpen(next) {
    open = next;
    overlayEl.hidden = !open;
    if (open) {
      closeBtn.focus();
    } else {
      openBtn.focus();
    }
  }

  function isOpen() {
    return open;
  }

  function mount() {
    openBtn.addEventListener("click", () => setOpen(true));
    closeBtn.addEventListener("click", () => setOpen(false));
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (open && e.key === "Escape") setOpen(false);
    });
  }

  return { mount, isOpen };
}
