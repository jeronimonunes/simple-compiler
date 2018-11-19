export const examples = [
    {
        name: "Hello World",
        code: `program helloWorld;
    begin
        write('h','e','l','o',' ', 'w', 'o', 'r', 'l', 'd')
    end`
    }, {
        name: "Factorial",
        code: `program factorial;
        teste: integer;
        integer PROCEDURE factorial(value integer: n):
        v: integer;
        begin
            if n < 1 then begin
                v := 1
            end else begin
                v := n * factorial(n - 1)
            end
        end
        v
        begin
            read(teste);
            teste := factorial(teste);
            write(teste)
        end
        `
    }, {
        name: "Hello World 10",
        code: `program helloWorld10;
        i:integer
        begin
        	i := 10;
            repeat begin
                write('h','e','l','o',' ', 'w', 'o', 'r', 'l', 'd', ' ', i);
                i := i - 1
            end until i > 0
        end`
    }, {
        name: "Fibonacci",
        code: `program fibonacci;
        teste: integer;
        integer PROCEDURE fib(value integer: n):
        v: integer;
        begin
            if n < 3 then begin
                v := 1
            end else begin
                v := fib(n-1) + fib(n-2)
            end
        end
        v
        begin
            read(teste);
            teste := fib(teste);
            write(teste)
        end
        `
    }

]