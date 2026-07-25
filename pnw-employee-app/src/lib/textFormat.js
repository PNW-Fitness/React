// Proper Case — first letter of each word capitalized, rest lowercase.
// Equivalent to Postgres's initcap(). Matches Daniel's literal spec: this
// does not special-case internal capitals (McDonald -> Mcdonald).
export function toProperCase(str) {
  return str
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}
