type Cell = string;
type Row = Cell[];
type Table = Row[];
type Column = {
  header: Cell;
  delimiter: Cell;
  body: Cell[];
};
type ParsedTable = {
  columns: Column[];
};

const NEW_LINE_REGEXP = /\r?\n/;
const NEW_LINE = "\n";
const BAR = "|";
const DELIMITER = "-";
const SPACE = " ";
const MIN_DELIMITERS = 3;

/**
 * 列 {@link row} のセルの内最大の長さのものを求める
 */
const getMaxLength = (row: Row, min = 0): number => {
  const lengths = [...new Set(row)].map(({ length }) => length);
  return Math.max(0, min, ...lengths);
};

/**
 * 2次元配列 {@link table} の行と列を入れ替える
 */
const rotateMatrix = (table: Table): Table => {
  const [firstRow] = table;
  if (firstRow == null) {
    return [];
  }
  return firstRow.map((_, x) => table.map((cell) => cell[x] ?? ""));
};

/**
 * 行をパースしてセルの値の配列を返す
 */
const parseRow = (row: string): Cell[] => {
  const rawCells = row.trim().split(BAR);
  const first = rawCells.at(0);
  const cells = rawCells.slice(1, -1);
  const last = rawCells.at(-1);
  if (first) cells.unshift(first);
  if (last) cells.push(last);
  return cells.map((cell) => cell.trim());
};

/**
 * {@link row} を {@link length} の長さにそろえる
 */
export const normalizeRow = (length: number) =>
  (row: Row): Row => {
    const shortage = length - row.length;
    if (shortage >= 0) {
      return row.concat(Array<string>(shortage).fill(""));
    }
    return row.slice(0, shortage);
  };

/**
 * テーブル {@link table} を検証して、不正な形式の場合は例外を投げる
 * @throws {Error | RangeError}
 */
const validateTable = (table: Table) => {
  const [header, delimiter, ...body] = table;
  if (header == null) {
    throw new Error("ヘッダが存在しません");
  }
  if (delimiter == null) {
    throw new Error("デリミタが存在しません");
  }
  const columnSize = header.length;
  if (columnSize === 0 || columnSize !== delimiter.length) {
    throw new RangeError("テーブルの列数が不正です");
  }
  return { header, delimiter, body: body.map(normalizeRow(columnSize)) };
};

/**
 * テーブル {@link table} の各行を読み取りパースする
 * @throws {Error | RangeError}
 */
export const parseTable = (table: string): ParsedTable => {
  const parsedTable = table.trim().split(NEW_LINE_REGEXP).map(parseRow);
  const { header, body } = validateTable(parsedTable);
  const rotatedBody = rotateMatrix(body);
  return {
    columns: header.map((heading, x) => ({
      header: heading,
      // TODO: この後では使ってないのでここではいらない
      delimiter: "",
      body: rotatedBody[x] ?? [],
    })),
  };
};

/**
 * パースされたテーブル {@link table} の列ごとのセルの長さを揃える
 */
const formatTable = (table: ParsedTable): ParsedTable => {
  const columns: Column[] = table.columns.map((column) => {
    const cellSize = getMaxLength(
      [column.header, ...column.body],
      MIN_DELIMITERS,
    );
    return {
      header: column.header.padEnd(cellSize),
      delimiter: DELIMITER.repeat(cellSize),
      body: column.body.map((cell) => cell.padEnd(cellSize)),
    };
  });
  return { columns };
};

/**
 * パースした列 {@link row} を文字列に戻す
 */
const stringifyRow = (row: Row): string => {
  return [BAR, ...row.flatMap((cell) => [cell, BAR])].join(SPACE);
};

/**
 * パースしたテーブル {@link table} を文字列に戻す
 */
const stringifyTable = (table: ParsedTable): string => {
  const header: Row = table.columns.map(({ header }) => header);
  const delimiter: Row = table.columns.map(({ delimiter }) => delimiter);
  const body: Row[] = rotateMatrix(table.columns.map(({ body }) => body));
  return [header, delimiter, ...body].map(stringifyRow).join(NEW_LINE);
};

/**
 * ----------------------------------------------------------------------------------------------------
 * 文字列としてのテーブル {@link table} をフォーマットする
 */
export const format = (table: string): string => {
  try {
    const parsedTable = parseTable(table);
    return stringifyTable(formatTable(parsedTable));
  } catch {
    return table;
  }
};
