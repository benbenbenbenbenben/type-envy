import { IpAddress, Requires, RequiresType, Url } from "../index"

describe('env', () => {
    it('should throw an exception if a required variable is not set', async () => {

        Object.assign(process.env, {
            IP: "1.9.99.9",
            HOSTNAME: "foo.com",
            PASSWORD: "123",
            BOOL: "true",
            TIMEOUT: "1000",
            PORT: 8080,
            AAA: "0",
            ENDPOINT: "https://foo.bar?abc=def"
        })

        const f = Requires({ DEBUG: String })

        expect<{ DEBUG: string }>(f)

        function TypeEnvy<
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

        const a = TypeEnvy(
            Requires({
                IP: IpAddress,
                ENDPOINT: Url,
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
            IP: "128.0.0.1",
            ENDPOINT: new URL("ftp://foo.bar"),
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
            IP: "1.1.1.1",
            BOOL: true,
            DEBUG: false,
            HOSTNAME: "",
            PASSWORD: "",
            PORT: 8080,
            TIMEOUT: 9,
            USERNAME: "",
            AAA: 1,
            ENDPOINT: new URL("http://s")
        })

    })
})