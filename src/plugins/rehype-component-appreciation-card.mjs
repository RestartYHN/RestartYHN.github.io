import { createReferenceCard } from "./rehype-component-reference-card.mjs";

export const AppreciationCardComponent = createReferenceCard({
  directive: "appreciation",
  indexType: "appreciation",
  idPrefix: "appreciation-",
  uuidPrefix: "AC",
  hrefBase: "/appreciation/articles",
  cardClass: "appreciation-ref-card",
});
