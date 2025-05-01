
export function StringValidator(str) {
    if(!str) throw "A parameter was not inputted"
    if(typeof(str) != 'string') throw "A parameter is not of type string"
    str = str.trim()
    if(str.length === 0) throw "A string is empty"
    return str;
}

export function ArrayValidator(arr) {
    if(arr === undefined || arr === null) throw "A parameter was not inputted"
    if(!typeof(arr).IsArray) throw "Not of type array"

    for(let x in arr) {
        arr[x] = StringValidator(arr[x]) 
    }

    return arr
}