export const logObject = (obj) => {
    console.log(JSON.stringify(obj, null, 4))
}

export const log = (...rest) => {
    console.log(...rest)
}