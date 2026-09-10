import { createReferenceCard } from "./rehype-component-reference-card.mjs";

export const BlogCardComponent = createReferenceCard({
  directive: "blog",
  indexType: "post",
  idPrefix: "post-",
  uuidPrefix: "BC",
  hrefBase: "/blog",
  cardClass: "blog-ref-card",
});
