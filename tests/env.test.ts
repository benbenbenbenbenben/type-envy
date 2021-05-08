import { Nothing, TypeEnvy } from "../index"
import { SomeDumbTypeWithTypeEnvy } from "./TypeWithoutTypeEnvy"
import { TypeWithTypeEnvy } from "./TypeWithTypeEnvy"

describe('env', () => {
    it('should throw an exception if a required variable is not set', async () => {

        Object.assign(process.env, {
            CHEESE: "true",
            IP: "1.9.99.7",
            HOSTNAME: "foo,com",
            PASSWORD: "123",
            BOOL: "true",
            TIMEOUT: "1000",
            PORT: 8080,
            AAA: "0",
            ENDPOINT: "https://foo.bar?abc=def"
        })

        const env = TypeEnvy(types => ({
            IP: types.IpAddress,
            ENDPOINT: types.Url,
            TIMEOUT: [Nothing, Number] as const
        }))

        env

        const instA: typeof env = {
            ENDPOINT: new URL("https://foo.bar"),
            IP: "1.0.0.0",
            TIMEOUT: 100
        }

        new TypeWithTypeEnvy()

        const mixin = new SomeDumbTypeWithTypeEnvy()
        mixin._env.NODE_ENV // ?


    })
})
