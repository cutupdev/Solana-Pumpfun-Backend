export const calculateTokenPrice = (supply: number, reserveBalance: number, constant: number): number => {
    return (reserveBalance * constant) / (supply + 1);
}