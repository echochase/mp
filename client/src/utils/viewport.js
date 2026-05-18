export const isMobileTableViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
