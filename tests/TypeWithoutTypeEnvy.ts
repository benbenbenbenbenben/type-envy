import { Nothing, TypeEnvy } from ".."

type Constructor = new (...args: any[]) => {}

function WithTypeEnvy<T extends Constructor>(Base: T) {
    const NodeEnvSelector = (value: string): undefined | "DEV" | "PROD" | "TEST" => {
        if (/^test/.test(value.toLowerCase())) {
            return "TEST"
        }
        if (/^dev/.test(value.toLowerCase())) {
            return "DEV"
        }
        if (/^prod/.test(value.toLowerCase())) {
            return "PROD"
        }
        return undefined
    }
    return class WithTypeEnvy extends Base {
        _env = TypeEnvy(types => ({
            NODE_ENV: NodeEnvSelector
        }))
    }
}

class SomeDumbType {

}

export const SomeDumbTypeWithTypeEnvy = WithTypeEnvy(SomeDumbType)