export const shuffle = (array: []) => {
    let arrLen = array.length, swapElement, currentElement

    // while elements remaining to shuffle
    while (arrLen) {

        // pick a remaining element
        currentElement = Math.floor(Math.random() * arrLen--)

        // and swap it with the current element
        swapElement = array[arrLen]
        array[arrLen] = array[currentElement]
        array[currentElement] = swapElement
    }

    return array
}