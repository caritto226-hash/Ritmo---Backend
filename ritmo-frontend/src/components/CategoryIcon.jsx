const iconPaths = {
  wallet: "M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6 M16 14h.01",
  "circle-dollar-sign": "M12 8c-1.1 0-2 .67-2 1.5S10.9 11 12 11s2 .67 2 1.5S13.1 14 12 14m0-6v8m8-4a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  house: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1Z",
  "shopping-bag": "M6 7h12l1 14H5L6 7Zm3 0a3 3 0 0 1 6 0",
  coffee: "M10 2v2m4-2v2M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm13 2h2a2 2 0 0 1 0 4h-2M2 22h18",
  receipt: "M4 3 6 5l2-2 2 2 2-2 2 2 2-2 2 2 2-2v18l-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2Zm4 6h8m-8 4h8m-8 4h5",
  "credit-card": "M2 7h20M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 11h4",
  "piggy-bank": "M19 5a3 3 0 0 0-3-3l-2 2H9a7 7 0 0 0-7 7v2a5 5 0 0 0 5 5h1v3h3v-3h4v3h3v-4a6 6 0 0 0 2-4v-3l2-2-3-3Zm-9 5h.01",
  landmark: "M3 10h18M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18M12 3 2 8h20Z",
  briefcase: "M3 7h18v14H3zM8 7V4h8v3m-13 5h18m-11 0v2h4v-2",
  "circle-help": "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  tag: "m20 13-7 7-11-11V2h7Zm-11-6h.01",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z",
  "calendar-days": "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm3 10h.01m4 0h.01m4 0h.01m-8 4h.01m4 0h.01",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-5h.01",
  "book-open": "M12 7v14m0-14C9 4 5 4 2 5v14c3-1 7-1 10 2m0-14c3-3 7-3 10-2v14c-3-1-7-1-10 2",
  "list-checks": "M9 6h11M9 12h11M9 18h11M3 6l1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2",
  wrench: "M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 12l-2-2Z",
  "heart-pulse": "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8ZM3 12h4l2-3 3 6 2-3h7",
  "clipboard-list": "M9 5h6m-6 4h8m-8 4h8m-8 4h5M8 3h8a2 2 0 0 1 2 2v16H6V5a2 2 0 0 1 2-2Z",
};

function CategoryIcon({ name, size = 20, title }) {
  const path = iconPaths[name] || iconPaths.tag;

  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      role={title ? "img" : undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export default CategoryIcon;
