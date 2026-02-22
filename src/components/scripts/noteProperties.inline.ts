// @ts-nocheck


const STORAGE_KEY = "note-properties-collapsed";

function init() {
  const details = document.querySelector("details.note-properties");
  if (!details) return;


  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    const isCollapsed = saved === "true";
    details.open = !isCollapsed;
  }


  function toggleHandler() {
    localStorage.setItem(STORAGE_KEY, String(!details.open));
  }

  details.addEventListener("toggle", toggleHandler);

  if (typeof window !== "undefined" && window.addCleanup) {
    window.addCleanup(() => {
      details.removeEventListener("toggle", toggleHandler);
    });
  }
}

document.addEventListener("nav", () => {
  init();
});
