

export const Url = Symbol("Url")
export const IpAddress = Symbol("IpAddress")
export const Nothing = Symbol("Nothing")

export function Optional<T>(pattern: T): T | null {
    return pattern as T | null
}

export type RequiresType<T> = {
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
        : U extends Symbol
        ? U
        : U
    )
    : T[P] extends typeof Url
    ? URL
    : T[P] extends typeof IpAddress
    ? `${number}.${number}.${number}.${number}`
    : never
}
export type VariableTemplate = { [key: string]: typeof Url | typeof IpAddress | StringConstructor | BooleanConstructor | NumberConstructor | readonly (typeof Nothing | string | number | boolean | StringConstructor | BooleanConstructor | NumberConstructor)[] }

export function Requires<Variable extends VariableTemplate>(variable: Variable, validator?: (variable: RequiresType<Variable>) => boolean) {
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
                } else if (type === Url) {
                    try {
                        const url = new URL(value)
                        return url
                    } catch (e) {
                        throw new Error(`Could not safely convert required value ${key} from ${value || "<empty>"} to URL.`)
                    }
                } else if (type === IpAddress) {
                    const ok = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)
                    if (!ok) {
                        throw new Error(`Could not safely convert required value ${key} from ${value || "<empty>"} to IpAddress.`)
                    }
                    return value.toString()
                } else if (type === Nothing) {
                    [type, value] // ?
                    if (value) {
                        throw new Error(Nothing.toString())
                    }
                    return Nothing
                } else {
                    [type, value] // ?
                    if (typeof type === "string" || typeof type === "boolean" || typeof type === "number") {
                        const ok = type.toString() === value.toString()
                        if (!ok) {
                            throw new Error(`Could not safely convert required value ${key} from ${value || "<empty>"} to ${type}`)
                        }
                        return validatePrimitive(key, value, {
                            string: String,
                            boolean: Boolean,
                            number: Number
                        }[typeof type])
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
                    const firstError = ok.find(e => e instanceof Error && e.message !== Nothing.toString()) as Error | undefined
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


export interface TypeEnvyTypes {
    IpAddress: typeof IpAddress
    Url: typeof Url
    Nothing: typeof Nothing
}

export function TypeEnvy<T extends VariableTemplate>(types: (types: TypeEnvyTypes) => T): RequiresType<T> {
    return Requires(types({
        IpAddress,
        Url,
        Nothing,
    }))
}
