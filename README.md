# Cadastro de Pessoa Física — Aula 08 (Testes Unitários)

Módulo de validação de cadastro de Pessoa Física com suíte de testes unitários (`node:test`, nativo do Node — sem dependências).

## Como rodar os testes

Requer Node 18 ou superior (testado em Node 22).

```bash
node --test
```

Saída esperada (resumida):

```
# tests 34
# suites 5
# pass 34
# fail 0
```

## Regras de validação

| Campo | Regra | Erro devolvido |
|---|---|---|
| `nome` | Obrigatório; de 3 a 80 caracteres; pelo menos duas palavras de 2+ letras; só letras, espaço, apóstrofo e hífen | `nome: ...` |
| `cpf` | 11 dígitos (aceita máscara); não pode ter todos os dígitos iguais; dígitos verificadores corretos | `cpf: invalido` |
| `email` | Uma `@`, algo antes, domínio com ponto depois, sem espaços | `email: invalido` |
| `data_nascimento` | Formato `AAAA-MM-DD`; data que existe de verdade; não pode ser futura; idade até 120 anos | `data_nascimento: ...` |
| `possui_cnh` | Booleano de verdade (`true`/`false`); se `true`, idade tem que ser >= 18 | `possui_cnh: ...` |

A função `validar(pessoa, hoje)` nunca lança exceção — devolve a lista de erros (vazia = tudo certo).
A função `garantirValido(pessoa, hoje)` lança `DadosInvalidosError` (com a lista de erros dentro) quando o cadastro é inválido.

## Teste que vi falhar de propósito

Troquei temporariamente `< IDADE_MINIMA_CNH` por `<= IDADE_MINIMA_CNH` na regra de CNH e rodei a suíte: o teste `faz 18 anos exatamente hoje: pode ter cnh` ficou vermelho, porque passou a barrar quem faz 18 anos justamente hoje. Isso confirmou que o teste de fronteira realmente protege essa regra — sem ele, esse bug teria passado despercebido.

## Arquivos

- `pessoaFisica.js` — módulo de validação (funciona no Node e no navegador)
- `pessoaFisica.test.js` — suíte de testes unitários
- `index.html` — formulário que usa o mesmo módulo para validar no navegador
