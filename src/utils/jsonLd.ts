/**
 * Serialize a value for embedding inside an inline `<script>` element.
 *
 * `JSON.stringify` does not escape `<`, so a string containing `</script>`
 * (e.g. a post title or tag) would terminate the script block early, breaking
 * the page and opening an injection sink. Escaping `<` to its `<` unicode
 * form is still valid JSON — crawlers parse it identically — but can never
 * close the tag. See https://html.spec.whatwg.org/#restrictions-for-contents-of-script-elements
 */
export function jsonLdScript(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c')
}
