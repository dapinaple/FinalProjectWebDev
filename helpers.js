
export function validateString(str) {
  if (!str) throw new Error("String not inputted");
  if (typeof str !== 'string') throw new Error("Input is not of type string");

  str = str.trim();
  if (str.length === 0) throw new Error("String is empty");

  return str;
}
