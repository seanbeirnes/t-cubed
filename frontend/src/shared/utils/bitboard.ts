const hexToBitsMap: Record<string, number[]> = {
    "0": [0, 0, 0, 0],
    "1": [0, 0, 0, 1],
    "2": [0, 0, 1, 0],
    "3": [0, 0, 1, 1],
    "4": [0, 1, 0, 0],
    "5": [0, 1, 0, 1],
    "6": [0, 1, 1, 0],
    "7": [0, 1, 1, 1],
    "8": [1, 0, 0, 0],
    "9": [1, 0, 0, 1],
    "A": [1, 0, 1, 0],
    "B": [1, 0, 1, 1],
    "C": [1, 1, 0, 0],
    "D": [1, 1, 0, 1],
    "E": [1, 1, 1, 0],
    "F": [1, 1, 1, 1],
}

// Converts a 32-bit encoded hex string to a 32-bit array (16 bits P1, 16 bits P2)
export default function boardBitsFromHex(hex: string): number[] {
    if (hex.length !== 8) {
        throw new Error('Invalid board state hex')
    }

    // Convert hex to bits
    const bits: number[] = []
    hex.split('').forEach((char: string) => {
        const nums = hexToBitsMap[char.toUpperCase()]
        if (!nums) {
            throw new Error('Invalid board state hex')
        }
        bits.push(...nums)
    })

    return bits
}
