
export function validateString(str) {
  if (!str) throw new Error("String not inputted");
  if (typeof str !== 'string') throw new Error("Input is not of type string");

  str = str.trim();
  if (str.length === 0) throw new Error("String is empty");

  return str;
}

export function validateArray(arr) {
  if (!arr) throw new Error("Array not inputted");
  if (!Array.isArray(arr)) throw new Error("Input is not an array");

  return arr.map((item, index) => {
    try {
      return validateString(item);
    } catch (e) {
      throw new Error("Invalid Entry");
    }
  });
}

export function validateInteger(num) {
  if (num === undefined || num === null) {
    throw new Error("Integer not inputted");
  }

  if (typeof num !== 'number' || !Number.isInteger(num)) {
    throw new Error("Input is not a valid integer");
  }

  return num;
}



