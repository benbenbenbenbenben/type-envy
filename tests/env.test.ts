import { executionAsyncId } from "node:async_hooks"
import { Schema } from "../env"

describe('env', () => {
    it('should throw an exception if a required variable is not set', async () => {

        Object.assign(process.env, {
            HOSTNAME: "foo.com",
            PASSWORD: "123",
            BOOL: "true",
            TIMEOUT: "1000",
            PORT: 8080,
            AAA: "0"
        })

        type RequiresType<T> = {
            [P in keyof T]
            : T[P] extends (...args: any) => any
            ? ReturnType<T[P]>
            : T[P] extends readonly (infer U)[]
            ? (
                U extends StringConstructor
                ? string
                : U extends BooleanConstructor
                ? boolean
                : U extends NumberConstructor
                ? number
                : U
            )
            : T[P] extends infer U
            ? U
            : never
        }

        function Requires<Variable extends { [key: string]: StringConstructor | BooleanConstructor | NumberConstructor | readonly (string | number | boolean | StringConstructor | BooleanConstructor | NumberConstructor)[] }>(variable: Variable, validator?: (variable: RequiresType<Variable>) => boolean) {
            const output = Object.keys(variable).reduce((a, c) => ({ ...a, [c]: process.env[c] }), {}) as RequiresType<Variable>
            if (validator) {
                const valid = validator(output)
                if (!valid) {
                    throw new Error("Invalid Environment Variables")
                }
            } else {
                Object.keys(variable).forEach((key, i) => {
                    const validatePrimitive = (key, value, type) => {
                        if (type === String) {
                            const ok = value === String(value) // ?
                            if (!ok) {
                                throw new Error(`Could not safely convert required value ${key} from ${value || "<empty>"} to String.`)
                            }
                            return value
                        } else if (type === Boolean) {
                            const isTrue = ["yes", "true", "on", "y", "1"].indexOf(value?.toLowerCase()) >= 0
                            const isFalse = ["no", "false", "off", "n", "0"].indexOf(value?.toLowerCase()) >= 0
                            if (!isTrue && !isFalse) {
                                throw new Error(`Could not safely convert required value ${key} from ${value || "<empty>"} to Boolean.`)
                            }
                            return isTrue
                        } else if (type === Number) {
                            const ok = !isNaN(parseFloat(value as string | undefined))
                            if (!ok) {
                                throw new Error(`Could not safely convert required value ${key} from ${value || "<empty>"} to Number.`)
                            }
                            return parseFloat(value as string)
                        } else {
                            if (typeof type === "string" || typeof type === "boolean" || typeof type === "number") {
                                const ok = type.toString() === value.toString()
                                if (!ok) {
                                    throw new Error(`Could not safely convert required value ${key} from ${value || "<empty>"} to ${type}`)
                                }
                                return value
                            }
                        }
                    }
                    const realValue = output[key]
                    const keyType = variable[key]
                    if (Array.isArray(keyType)) {
                        const ok = keyType.map((otherType) => {
                            try {
                                return validatePrimitive(key, realValue, otherType)
                            } catch (e) {
                                return e
                            }
                        })
                        if (ok.find(e => !(e instanceof Error))) {
                            (output as any)[key] = ok.find(e => !(e instanceof Error))
                        } else {
                            const firstError = ok.find(e => e instanceof Error) as Error | undefined
                            if (firstError) {
                                throw firstError
                            }
                        }
                    } else {
                        (output as any)[key] = validatePrimitive(key, realValue, keyType)
                    }

                })
            }
            return output
        }

        const f = Requires({ DEBUG: String })


        expect<{ DEBUG: string }>(f)

        function Merge<
            One extends RequiresType<any>,
            Two extends RequiresType<any>,
            Three extends RequiresType<any>,
            Four extends RequiresType<any>
        >(
            one: One,
            two?: Two,
            three?: Three,
            four?: Four,
        ) {
            return { ...one, ...two, ...three, ...four } as One & Two & Three & Four
        }

        const a = Merge(
            Requires({
                HOSTNAME: String,
                USERNAME: String,
                PASSWORD: String,
                TIMEOUT: Number,
                BOOL: Boolean,
                PORT: [8080, 8030] as const,
                DEBUG: [String, false] as const
            }),
            Requires({
                AAA: Number
            })
        )

        a // ?

        const b: typeof a = {
            ANOTHER_VAR: false,
            SOME_VAR: "d",
            SOME_PICK: "bar",
            DEBUG: "aaa",
            HOSTNAME: "",
            PASSWORD: "",
            PORT: 8080,
            USERNAME: "",
            TIMEOUT: 8,
            BOOL: true,
            AAA: 1
        }

        b // ?

        class Foo {
            constructor(config: typeof a) {

            }
        }


        new Foo({
            BOOL: true,
            DEBUG: false,
            HOSTNAME: "",
            PASSWORD: "",
            PORT: 8080,
            TIMEOUT: 9,
            USERNAME: "",
            AAA: 1
        })

    })
})