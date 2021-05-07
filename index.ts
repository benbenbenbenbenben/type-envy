

export const Url = "Url" as const
export const IpAddress = "IpAddress" as const

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
        : U
    )
    : T[P] extends typeof Url
    ? URL
    : T[P] extends typeof IpAddress
    ? `${number}.${number}.${number}.${number}`
    : never
}

export function Requires<Variable extends { [key: string]: "Url" | "IpAddress" | StringConstructor | BooleanConstructor | NumberConstructor | readonly (string | number | boolean | StringConstructor | BooleanConstructor | NumberConstructor)[] }>(variable: Variable, validator?: (variable: RequiresType<Variable>) => boolean) {
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
