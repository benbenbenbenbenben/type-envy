import { Nothing, TypeEnvy, TypeEnvyArgument } from '..';
import { TypeWithTypeEnvy } from './TypeWithTypeEnvy';
import { URL } from 'url';

describe('env', () => {
    it('should throw an exception if a required variable is not set', async () => {
        // const FunType = () => 'hello';

        // type FunTypeReturn = ReturnType<typeof FunType>;

        // type UnwrapReturn<T> = {
        //     [P in keyof T]: T[P] extends () => any ? ReturnType<T[P]> : string;
        // };

        // type UnwrapTarget = {
        //     [key: string]: (...args: any) => any;
        // };

        // const DoUnwrap = <T extends UnwrapTarget>(wrapped: T): UnwrapReturn<T> => {
        //     return wrapped as UnwrapReturn<T>;
        // };

        // const constFun = () => false;

        // const g = DoUnwrap({
        //     x: () => true,
        //     y: constFun,
        // });

        // g.y = 1;

        Object.assign(process.env, {
            CHEESE: 'true',
            IP: '1.9.99.7',
            HOSTNAME: 'foo,com',
            PASSWORD: '123',
            BOOL: 'true',
            TIMEOUT: '1000',
            PORT: 8080,
            AAA: '0',
            ENDPOINT: 'https://foo.bar?abc=def',
        });

        const Paths = function (value: TypeEnvyArgument): readonly string[] {
            return value.value?.split(':') || [];
        };

        const env = TypeEnvy((types) => ({
            IP: types.IpAddress,
            ENDPOINT: types.Url,
            TIMEOUT: [Nothing, Number] as const,
            FOO: [Number, Nothing] as const,
            PATH: Paths,
        }));

        expect<{ PATH: readonly string[] }>(env).toBe<Pick<typeof env, 'PATH'>>(env);
        // expect<{ PATH: string }>(env).toBe<Pick<typeof env, 'PATH'>>(env);

        if (env.FOO !== Nothing) {
            env.FOO++;
        }

        const instA: typeof env = {
            ENDPOINT: new URL('https://foo.bar'),
            IP: '1.0.0.0',
            TIMEOUT: 100,
            FOO: 0,
            PATH: [''],
        };

        new TypeWithTypeEnvy();
    });
});
