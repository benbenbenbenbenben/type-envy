import { config } from "dotenv"
import { type } from "node:os";
import { Type } from "typescript";

const { parsed, error } = config()

if (error) {
    throw error
} else if (parsed) {
    //
}

type Constructor<T = {}> = new (...args: any[]) => T;

type ParseValidator<T> = (name: string, value: string) => boolean

export const typedEnv = <T>(): T => {
    return parsed as any as T
}

export type Schema<T> = {
    [Property in keyof T]: T[Property] extends (...args: any) => any
    ? ReturnType<T[Property]>
    : T[Property]
}

export const schema = <T>(template: T): Schema<T> => {
    parsed // ?
    let r = {

    }

    Object.keys(template).forEach(key => {
        if (template[key] instanceof Function) {
            r[key] = template[key](parsed[key]) // ?
        } else {
            // if (parsed[key] !== undefined) {
            // r[key] = parsed[key]
            // } else {
            r[key] = template[key]
            //  }
        }

    })

    return r as Schema<T>
}

export const required = <T>(defaultValue?: T): T => {
    throw ""
}