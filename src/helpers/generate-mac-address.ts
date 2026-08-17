export function createMacAddress(): string {
  const macAddress = [
    "BC",
    ...Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0"),
    ),
  ].join(":")
  return macAddress.toUpperCase()
}
