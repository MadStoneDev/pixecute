export default function CreateGrid(rows: number, columns: number) {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => ({ rowIndex, colIndex })),
  );
}
