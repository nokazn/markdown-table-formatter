import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.155.0/testing/asserts.ts";

import { format, normalizeRow, parseTable } from "./format.ts";
import type { TestCaseOf, UnknownFunction } from "./types.ts";

type RunTestsCallback<F extends UnknownFunction> = (
  c: TestCaseOf<F>,
) => void | Promise<void>;

const runTests = (test: Deno.TestContext) =>
  async <F extends UnknownFunction>(
    cases: TestCaseOf<F>[],
    callback: RunTestsCallback<F>,
  ) => {
    for (const c of cases) {
      await test.step(c.name, () => callback(c));
    }
  };

Deno.test(normalizeRow.name, async (test) => {
  const cases: TestCaseOf<typeof normalizeRow>[] = [
    {
      name: "長さ3の配列に対して、-1の長さを指定すると長さ0に揃える",
      input: [[-1], [["1", "2", "3"]]],
      expected: [],
    },
    {
      name: "長さ3の配列に対して、0の長さを指定すると長さ0に揃える",
      input: [[0], [["1", "2", "3"]]],
      expected: [],
    },
    {
      name: "長さ3の配列に対して、0の長さを指定すると長さ0に揃える",
      input: [[2], [["1", "2", "3"]]],
      expected: ["1", "2"],
    },
    {
      name: "長さ3の配列に対して、3の長さを指定すると長さ3に揃える",
      input: [[3], [["1", "2", "3"]]],
      expected: ["1", "2", "3"],
    },
    {
      name: "長さ3の配列に対して、4の長さを指定すると長さ4に揃える",
      input: [[4], [["1", "2", "3"]]],
      expected: ["1", "2", "3", ""],
    },
    {
      name: "長さ3の配列に対して、10の長さを指定すると長さ10に揃える",
      input: [[10], [["1", "2", "3"]]],
      expected: ["1", "2", "3", "", "", "", "", "", "", ""],
    },
  ];
  await runTests(test)(cases, ({ input, expected }) => {
    const result = normalizeRow(...input[0])(...input[1]);
    assertEquals(result, expected);
  });
});

Deno.test(parseTable.name, async (test) => {
  const cases: TestCaseOf<typeof parseTable>[] = [
    {
      name: "入力例1",
      input: [
        [
          `| header1 | header2 |
| ------- | --- |
| 1  | 2          |
| 3     | 4 |`,
        ],
      ],
      expected: {
        columns: [
          {
            header: "header1",
            delimiter: "",
            body: ["1", "3"],
          },
          {
            header: "header2",
            delimiter: "",
            body: ["2", "4"],
          },
        ],
      },
    },
    {
      name: "入力例2",
      input: [
        [
          `


header1 | header2 | header3 | | |
| --- | --- |--- | --- | ---|
    1-1 | 1-2 | 1-3  | 1-4 |         1 -  5
| 2-1 | 2 -  2 |          |2-4|2-5
  3-1 | 3-2 |  | | 3-5|
    |
  || 4- 2 |  | |

`,
        ],
      ],
      expected: {
        columns: [
          {
            header: "header1",
            delimiter: "",
            body: ["1-1", "2-1", "3-1", "", ""],
          },
          {
            header: "header2",
            delimiter: "",
            body: ["1-2", "2 -  2", "3-2", "", "4- 2"],
          },
          {
            header: "header3",
            delimiter: "",
            body: ["1-3", "", "", "", ""],
          },
          {
            header: "",
            delimiter: "",
            body: ["1-4", "2-4", "", "", ""],
          },
          {
            header: "",
            delimiter: "",
            body: ["1 -  5", "2-5", "3-5", "", ""],
          },
        ],
      },
    },
  ];

  await runTests(test)(cases, ({ input, expected }) => {
    const result = parseTable(...input[0]);
    assertEquals(result, expected);
  });
});

Deno.test(format.name, async (test) => {
  const cases: TestCaseOf<typeof format>[] = [
    {
      name: "入力例1",
      input: [
        [
          `| header1 | header2 |
| ------- | --- |
| 1  | 2          |
| 3     | 4 |`,
        ],
      ],
      expected: `| header1 | header2 |
| ------- | ------- |
| 1       | 2       |
| 3       | 4       |`,
    },
    {
      name: "入力例2",
      input: [
        [
          `| header1 | header2 |
|------ | --- |
| 1  |          |
| 3     | 4 |`,
        ],
      ],
      expected: `| header1 | header2 |
| ------- | ------- |
| 1       |         |
| 3       | 4       |`,
    },
    {
      name: "入力例3",
      input: [
        [
          `|             artist name|    url|
| --- | ------ |
|Tame Impala                  | https://tameimpala.com/        |
|     cocteau twins|  https://cocteautwins.com        |
|Fishmans|                               http://www.fishmans.jp/                             |`,
        ],
      ],
      expected: `| artist name   | url                      |
| ------------- | ------------------------ |
| Tame Impala   | https://tameimpala.com/  |
| cocteau twins | https://cocteautwins.com |
| Fishmans      | http://www.fishmans.jp/  |`,
    },
    {
      name: "入力例4",
      input: [
        [
          `


header1 | header2 | header3 | | |
| --- | --- |--- | --- | ---|
 1-1 | 1-2 | 1-3  | 1-4 |         1 -  5
| 2-1 | 2 -  2 |          |2-4|2-5
  3-1 | 3-2 |  | | 3-5|
  |
  || 4- 2 |  | |


`,
        ],
      ],
      expected: `| header1 | header2 | header3 |     |        |
| ------- | ------- | ------- | --- | ------ |
| 1-1     | 1-2     | 1-3     | 1-4 | 1 -  5 |
| 2-1     | 2 -  2  |         | 2-4 | 2-5    |
| 3-1     | 3-2     |         |     | 3-5    |
|         |         |         |     |        |
|         | 4- 2    |         |     |        |`,
    },
    {
      name: "入力例5",
      input: [
        [
          `||||||
|---|---|---|---|---|
||||||
|||||
||||||
||||||
||||||
||||||
||||||
|
||||||
||||||`,
        ],
      ],
      expected: `|     |     |     |     |     |
| --- | --- | --- | --- | --- |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |
|     |     |     |     |     |`,
    },
  ];

  await runTests(test)(cases, ({ input, expected }) => {
    const result = format(...input[0]);
    assert(result, expected);
  });
});
