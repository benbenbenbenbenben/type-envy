# TypeEnvy

TypeEnvy is a super simple library that gives you **typed environment variables**!

It couldn't be easier to use. Just do:

`yarn add type-envy`

Then in your code that needs environment variables do:

## Quick Start

```TypeScript
import { TypeEnvy, TypeEnvyArgument } from "type-envy";

const env = TypeEnvy(types => ({
    // TypeScript Primitives
    SOME_STRING_VARIABLE: types.String,
    SOME_NUMBER_VARIABLE: types.Number,
    // TypeScript Unions
    SOME_CHOICE_VARIABLE: ["yes", "no"] as const,
    SOME_OPTIONAL_STRING_VARIABLE: [types.Nothing, types.String] as const,
    // Custom Types
    SOME_CUSTOM_TYPE: (build: TypeEnvyArgument): SpecialType => ({
        someFlag: build.value ? true | false,
        someValue: build.value ? parseFloat(build.value.toString()) * 100 : NaN
    })
}))

type SpecialType = {
    someFlag: boolean,
    someValue: number,
}
```

## Dealing with Missing Variables

When an environment variable is not available or cannot be converted to your type, you'll get a useful runtime exception:

```TypeScript
// Error: Could not safely convert required value THIS_VAR_DOES_NOT_EXIST from <empty> to String.
const env = TypeEnvy(types => ({
    THIS_VAR_DOES_NOT_EXIST: types.String
}))
```

## Roadmap:

- Error and warning capture for user type functions (TypeEnvyArgument).
- Optionally defer process.env to make re-exporting TypeEnvy type more developer friendly.