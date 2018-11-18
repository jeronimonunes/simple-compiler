export const helloWorld = `program p;
begin
    write('h','e','l','o',' ', 'w', 'o', 'r', 'l', 'd')
end`;

export const fib = `program fib;
teste: char;
begin
    read(teste);
    fib(teste)
end
`;


export const factorial = `program factorial;
teste: integer;
integer PROCEDURE factorial(value integer: n):
begin
	if n < 1 then begin
    	v := 1
    end else begin
    	v := factorial(n - 1)
    end
end
begin
    read(teste);
    teste := factorial(teste);
    write(teste)
end
`;