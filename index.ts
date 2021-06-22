import { URL } from 'url';

export const Url = Symbol.for('Url');
export const IpAddress = Symbol.for('IpAddress');
export const Nothing = Symbol.for('Nothing');
export type IpAddressMask = `${number}.${number}.${number}.${number}`;

export interface TypeEnvyArgument {
    key: string;
    keyExists: boolean;
    value?: string;
    error?: (error: string | Error) => void;
    warn?: (warning: string | Error) => void;
}

export type VariablesType<T> = {
    [P in keyof T]: T[P] extends (arg: TypeEnvyArgument) => infer R
        ? R
        : T[P] extends readonly (infer U)[]
        ? U extends StringConstructor
            ? string
            : U extends BooleanConstructor
            ? boolean
            : U extends NumberConstructor
            ? number
            : U extends symbol
            ? U
            : U extends typeof Nothing
            ? typeof Nothing
            : U
        : T[P] extends typeof Url
        ? URL
        : T[P] extends typeof IpAddress
        ? IpAddressMask
        : never;
};

/*  eslint-disable @typescript-eslint/no-explicit-any */
export type VariableTemplate =
    | {
          [key: string]:
              | ((arg: TypeEnvyArgument) => any)
              | typeof Url
              | typeof IpAddress
              | string
              | StringConstructor
              | BooleanConstructor
              | NumberConstructor
              | readonly (
                    | typeof Nothing
                    | string
                    | number
                    | boolean
                    | StringConstructor
                    | BooleanConstructor
                    | NumberConstructor
                    | undefined
                )[]
              | never;
      }
    | never;

function Requires<I extends Record<string, unknown>, Variable extends VariableTemplate>(
    input: I,
    variable: Variable,
    validator?: (variable: VariablesType<Variable>) => boolean,
) {
    const output = Object.keys(variable).reduce((a, c) => ({ ...a, [c]: input[c] }), {}) as VariablesType<Variable>;
    if (validator) {
        const valid = validator(output);
        if (!valid) {
            throw new Error('Invalid Environment Variables');
        }
    } else {
        Object.keys(variable).forEach((key) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validatePrimitive = (key: string, value: any, type: any): unknown => {
                if (type === String) {
                    const ok = value === String(value); // ?
                    if (!ok) {
                        throw new Error(
                            `Could not safely convert required value ${key} from ${value || '<empty>'} to String.`,
                        );
                    }
                    return value;
                } else if (type === Boolean) {
                    const isTrue = ['yes', 'true', 'on', 'y', '1'].indexOf(value?.toLowerCase()) >= 0;
                    const isFalse = ['no', 'false', 'off', 'n', '0'].indexOf(value?.toLowerCase()) >= 0;
                    if (!isTrue && !isFalse) {
                        throw new Error(
                            `Could not safely convert required value ${key} from ${value || '<empty>'} to Boolean.`,
                        );
                    }
                    return isTrue;
                } else if (type === Number) {
                    const ok = !isNaN(parseFloat(value?.toString()));
                    if (!ok) {
                        throw new Error(
                            `Could not safely convert required value ${key} from ${value || '<empty>'} to Number.`,
                        );
                    }
                    return parseFloat(value as string);
                } else if (type === Url) {
                    try {
                        const url = new URL(value);
                        return url;
                    } catch (e) {
                        throw new Error(
                            `Could not safely convert required value ${key} from ${value || '<empty>'} to URL.`,
                        );
                    }
                } else if (type === IpAddress) {
                    const ok = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
                        value,
                    );
                    if (!ok) {
                        throw new Error(
                            `Could not safely convert required value ${key} from ${value || '<empty>'} to IpAddress.`,
                        );
                    }
                    return value.toString();
                } else if (type === Nothing) {
                    [type, value]; // ?
                    if (value) {
                        throw new Error(Nothing.toString());
                    }
                    return Nothing;
                } else if (type === undefined) {
                    [type, value]; // ?
                    if (value) {
                        throw new Error('undefined');
                    }
                    return undefined;
                } else if (typeof type === 'function') {
                    try {
                        const ok = (type as (x: TypeEnvyArgument) => boolean)({
                            key: key,
                            keyExists: value !== undefined,
                            value: value,
                            // TODO: error/warning callback
                        });
                        return ok;
                    } catch (e) {
                        throw new Error(e instanceof Error ? e.message : e.toString());
                    }
                } else {
                    if (typeof type === 'string' || typeof type === 'boolean' || typeof type === 'number') {
                        const ok = type.toString() === value?.toString();
                        if (!ok) {
                            throw new Error(
                                `Could not safely convert required value ${key} from ${value || '<empty>'} to ${type}`,
                            );
                        }
                        return validatePrimitive(
                            key,
                            value,
                            {
                                string: String,
                                boolean: Boolean,
                                number: Number,
                                bigint: BigInt,
                                undefined: undefined,
                                function: Function,
                                object: Object,
                                symbol: Symbol,
                            }[typeof type],
                        );
                    }
                }
            };
            const realValue = output[key];
            const keyType = variable[key];
            if (Array.isArray(keyType)) {
                const ok = keyType.map((otherType) => {
                    try {
                        return validatePrimitive(key, realValue, otherType);
                    } catch (e) {
                        return e;
                    }
                });
                if (ok.find((e) => !(e instanceof Error))) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (output as any)[key] = ok.find((e) => !(e instanceof Error));
                } else {
                    const firstError = ok.find(
                        (e) => e instanceof Error && e.message !== Nothing.toString() && e.message !== 'undefined',
                    );
                    if (firstError) {
                        throw firstError;
                    }
                }
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (output as any)[key] = validatePrimitive(key, realValue, keyType);
            }
        });
    }
    return output;
}
interface TypeEnvyTypes {
    IpAddress: typeof IpAddress;
    Url: typeof Url;
    Nothing: typeof Nothing;
}

export function TypeEnvy<R extends VariableTemplate>(types: (types: TypeEnvyTypes) => R): VariablesType<R> {
    return fromAny(process.env).toType(types);
}

export function fromAny<T extends Record<string, unknown>>(
    value: T,
): { toType: <R extends VariableTemplate>(types: (types: TypeEnvyTypes) => R) => VariablesType<R> } {
    return {
        toType: <R extends VariableTemplate>(types: (types: TypeEnvyTypes) => R): VariablesType<R> => {
            return Requires(
                value,
                types({
                    IpAddress,
                    Url,
                    Nothing,
                }),
            );
        },
    };
}
