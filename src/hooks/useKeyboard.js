import { useEffect } from "react";

// Helper for shortcut normalization
export function normalizeCombo(combo) {
  if (!combo) return "";
  return combo.split("+").sort().join("+");
}

export function comboFromEvent(event) {
  const mods = [];
  if (event.ctrlKey) mods.push("Control");
  if (event.altKey) mods.push("Alt");
  if (event.shiftKey) mods.push("Shift");
  if (event.metaKey) mods.push("Meta");

  let key = event.key;
  if (key === " ") key = "Space";
  if (["Control", "Alt", "Shift", "Meta"].includes(key)) return null;

  return [...mods, key].join("+");
}

export function useKeyboard({
  shortcuts,
  setOpenCommandPalette,
  setViewMode,
  loadAll,
  openCreateCaseModal
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase?.();
      const isTyping = tag === "input" || tag === "textarea" || event.target?.isContentEditable;
      const combo = comboFromEvent(event);
      if (!combo) return;
      const normalized = normalizeCombo(combo);
      const matches = (key) => normalized === normalizeCombo(shortcuts[key]);

      if (matches("openCommandPalette")) {
        event.preventDefault();
        setOpenCommandPalette(true);
        return;
      }
      if (isTyping) return;
      if (matches("openDashboard")) {
        event.preventDefault();
        setViewMode("dashboard");
      } else if (matches("openAnalytics")) {
        event.preventDefault();
        setViewMode("analytics");
      } else if (matches("openShortcuts")) {
        event.preventDefault();
        setViewMode("shortcuts");
      } else if (matches("reloadData")) {
        event.preventDefault();
        loadAll();
      } else if (matches("newCase")) {
        event.preventDefault();
        openCreateCaseModal();
      }
    };

    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, setOpenCommandPalette, setViewMode, loadAll, openCreateCaseModal]);
}
