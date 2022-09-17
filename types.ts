export type UnknownFunction<Input extends never[] = never[], Output = unknown> =
  (...args: Input) => Output;

export type TestCase<Input = unknown, Expected = unknown> = {
  name: string;
  input: Input;
  expected: Expected;
};

export type Arguments<Func extends UnknownFunction> = Func extends
  (...args: infer In) => infer Out
  ? Out extends UnknownFunction ? [In, ...Arguments<Out>]
  : [In]
  : never;

export type DeepReturnType<Func extends UnknownFunction> = Func extends
  (...args: infer In) => infer Out
  ? Out extends UnknownFunction ? DeepReturnType<Out>
  : Out
  : never;

export type TestCaseOf<Func extends UnknownFunction> = TestCase<
  Arguments<Func>,
  DeepReturnType<Func>
>;
