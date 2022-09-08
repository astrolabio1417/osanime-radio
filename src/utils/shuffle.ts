/**
 * function to shuffle the list
 * @param {any[]} array - list
 * @return {any[]} list
 */
function shuffle(array: any[]): any[] {
  let currentIndex = array.length;
  let randomIndex: number;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export {shuffle};
