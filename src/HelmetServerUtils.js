import {
    ATTRIBUTE_NAMES,
    SELF_CLOSING_TAGS,
    TAG_NAMES,
    TAG_PROPERTIES
} from "./HelmetConstants.js";
import {
    generateTitleAsReactComponent,
    convertElementAttributestoReactProps,
    generateTagsAsReactComponent,
    flattenArray
} from "./HelmetUtils";

const encodeSpecialCharacters = (str, encode = true) => {
    if (encode === false) {
        return String(str);
    }

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
};

const generateElementAttributesAsString = attributes =>
    Object.keys(attributes).reduce((str, key) => {
        const attr =
            typeof attributes[key] !== "undefined"
                ? `${key}="${attributes[key]}"`
                : `${key}`;
        return str ? `${str} ${attr}` : attr;
    }, "");

const generateTitleAsString = (type, title, attributes, encode) => {
    const attributeString = generateElementAttributesAsString(attributes);
    const flattenedTitle = flattenArray(title);
    return attributeString
        ? `<${type} ${attributeString}>${encodeSpecialCharacters(
              flattenedTitle,
              encode
          )}</${type}>`
        : `<${type}>${encodeSpecialCharacters(
              flattenedTitle,
              encode
          )}</${type}>`;
};

const generateTagsAsString = (type, tags, encode) =>
    tags.reduce((str, tag) => {
        const attributeHtml = Object.keys(tag)
            .filter(
                attribute =>
                    !(
                        attribute === TAG_PROPERTIES.INNER_HTML ||
                        attribute === TAG_PROPERTIES.CSS_TEXT
                    )
            )
            .reduce((string, attribute) => {
                const attr =
                    typeof tag[attribute] === "undefined"
                        ? attribute
                        : `${attribute}="${encodeSpecialCharacters(
                              tag[attribute],
                              encode
                          )}"`;
                return string ? `${string} ${attr}` : attr;
            }, "");

        const tagContent = tag.innerHTML || tag.cssText || "";

        const isSelfClosing = SELF_CLOSING_TAGS.indexOf(type) === -1;

        return `${str}<${type} ${attributeHtml}${
            isSelfClosing ? `/>` : `>${tagContent}</${type}>`
        }`;
    }, "");

const getMethodsForTag = (type, tags, encode) => {
    switch (type) {
        case TAG_NAMES.TITLE:
            return {
                toComponent: () =>
                    generateTitleAsReactComponent(
                        type,
                        tags.title,
                        tags.titleAttributes,
                        encode
                    ),
                toString: () =>
                    generateTitleAsString(
                        type,
                        tags.title,
                        tags.titleAttributes,
                        encode
                    )
            };
        case ATTRIBUTE_NAMES.BODY:
        case ATTRIBUTE_NAMES.HTML:
            return {
                toComponent: () => convertElementAttributestoReactProps(tags),
                toString: () => generateElementAttributesAsString(tags)
            };
        default:
            return {
                toComponent: () => generateTagsAsReactComponent(type, tags),
                toString: () => generateTagsAsString(type, tags, encode)
            };
    }
};

const mapStateOnServer = ({
    baseTag,
    bodyAttributes,
    encode,
    htmlAttributes,
    linkTags,
    metaTags,
    noscriptTags,
    scriptTags,
    styleTags,
    title = "",
    titleAttributes
}) => ({
    base: getMethodsForTag(TAG_NAMES.BASE, baseTag, encode),
    bodyAttributes: getMethodsForTag(
        ATTRIBUTE_NAMES.BODY,
        bodyAttributes,
        encode
    ),
    htmlAttributes: getMethodsForTag(
        ATTRIBUTE_NAMES.HTML,
        htmlAttributes,
        encode
    ),
    link: getMethodsForTag(TAG_NAMES.LINK, linkTags, encode),
    meta: getMethodsForTag(TAG_NAMES.META, metaTags, encode),
    noscript: getMethodsForTag(TAG_NAMES.NOSCRIPT, noscriptTags, encode),
    script: getMethodsForTag(TAG_NAMES.SCRIPT, scriptTags, encode),
    style: getMethodsForTag(TAG_NAMES.STYLE, styleTags, encode),
    title: getMethodsForTag(TAG_NAMES.TITLE, {title, titleAttributes}, encode)
});

export {mapStateOnServer};
