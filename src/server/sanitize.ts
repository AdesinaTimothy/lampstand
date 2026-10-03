import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Allow-list sanitizer for instructor-authored rich text. Applied on write so
 * stored HTML is always safe to render.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "blockquote", "ul", "ol", "li",
      "a", "img", "hr", "code", "pre", "figure", "figcaption", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      iframe: ["src", "title", "allow", "allowfullscreen"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    // Images may be our own media route or https; iframes only from trusted video hosts.
    allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com"],
    exclusiveFilter: (frame) => frame.tag === "img" && !/^(https:\/\/|\/api\/media\/)/.test(frame.attribs.src ?? ""),
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer nofollow", target: attribs.href?.startsWith("/") ? "_self" : "_blank" },
      }),
      b: "strong",
      i: "em",
    },
  }).trim();
}
