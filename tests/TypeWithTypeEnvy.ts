import { TypeEnvy, Nothing, Url } from "..";

Object.assign(process.env, {
    SOME_API: "http://this.is.a.fake.domain/and/this/is/a/path",
    ...process.env
})

const IsDebugMode = (v:string) => v === "DEBUG"

export class TypeWithTypeEnvy {

    env = TypeEnvy(types => ({
        SOME_API: Url,
        OS: String,
        DEBUG: [String, Boolean] as const,
        NODE_ENV: IsDebugMode,
        ACME_API_TIMEOUT: [Nothing, Number] as const,
        NUMBER_OF_PROCESSORS: [1, 2, String] as const
    }))

    constructor() {
        if (this.env.ACME_API_TIMEOUT === Nothing) {
            console.log("No timeout specified, using default value 1000");
        }
        console.log(`You are using ${this.env.OS} and your API is ${this.env.SOME_API.hostname}`)
        switch (this.env.NUMBER_OF_PROCESSORS) {
            case 1:
                this.usePrimaryRunMode();
                break;
            case 2:
                this.useSecondaryRunMode();
                break;
            default:
                this.env.NUMBER_OF_PROCESSORS // ?
                break;
        }
    }

    usePrimaryRunMode() {
        //
    }

    useSecondaryRunMode() {
        //
    }
}