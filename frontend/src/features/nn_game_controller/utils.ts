/* 
 * Returns a array of rankings for the board positions based on the given neural net outputs.
 * A higher output value means a higher ranking.
 *
 * Outputs: [value: float64 (i = board position), ...] Initially the values are mapped to the board positions.
 * Rankings: [boardPosition: int (i = rank), ...] Initially the board positions are mapped to the rankings.
 *
 * Sorting outputs in descending order moves lower ranking board positions to the end of the array (i.e. the least valuable board positions).
 *
 * Based on the similar algorithm used in the game_service.go file.
*/
export function outputsToRankedMoves(outputs: number[]): number[] {
    const rankings: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const outputsCopy = outputs.slice()

    for (let i = 0; i < outputsCopy.length; i++) {
        for (let j = 0; j < outputsCopy.length - i - 1; j++) {
            // Sort the outputs in descending order (higher values first)
            if (outputsCopy[j] < outputsCopy[j + 1]) {
                const temp = outputsCopy[j]
                outputsCopy[j] = outputsCopy[j + 1]
                outputsCopy[j + 1] = temp

                const tempRank = rankings[j]
                rankings[j] = rankings[j + 1]
                rankings[j + 1] = tempRank
            }
        }
    }
    return rankings;
}
