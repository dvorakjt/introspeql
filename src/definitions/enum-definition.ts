export class EnumDefinition {
  constructor(
    public pgName: string,
    public tsDocComment: string | undefined,
    public values: string[],
  ) {}
}
