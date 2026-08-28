// pessoaFisica.test.js — suite de testes unitarios (node:test, sem dependencias)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validar, garantirValido, cpfValido, DadosInvalidosError } = require('./pessoaFisica');

// o "relogio" injetado: os testes nao dependem do dia real
const HOJE = new Date(Date.UTC(2026, 7, 21)); // 21/08/2026

function pessoa(mudancas = {}) {
  return {
    nome: 'Ana Maria Souza',
    cpf: '529.982.247-25',
    email: 'ana.souza@escola.com.br',
    data_nascimento: '1998-03-14',
    possui_cnh: true,
    ...mudancas,
  };
}

function temErro(erros, trecho) {
  return erros.some((e) => e.includes(trecho));
}

// 1) O CAMINHO FELIZ ------------------------------------------------------
test('caminho feliz: cadastro completo e valido', () => {
  assert.deepEqual(validar(pessoa(), HOJE), []);
});

test('cadastro vazio acumula erro de todos os campos obrigatorios', () => {
  const erros = validar({}, HOJE);
  assert.ok(temErro(erros, 'nome'));
  assert.ok(temErro(erros, 'cpf'));
  assert.ok(temErro(erros, 'email'));
  assert.ok(temErro(erros, 'data_nascimento'));
  assert.ok(temErro(erros, 'possui_cnh'));
});

// 2) NOME — as linhas tortas ----------------------------------------------
describe('nome', () => {
  const casos = [
    ['', 'obrigatorio'],
    ['Al', 'minimo'],
    ['A'.repeat(81), 'maximo'],
    ['Ana', 'sobrenome'],
    ['Ana Souza 3', 'letras'],
  ];
  for (const [nome, trecho] of casos) {
    test(`invalido: ${JSON.stringify(nome)} -> contem "${trecho}"`, () => {
      assert.ok(temErro(validar(pessoa({ nome }), HOJE), trecho));
    });
  }

  test('aceita nome composto com hifen e apostrofo', () => {
    const erros = validar(pessoa({ nome: "Ana-Clara D'Avila Souza" }), HOJE);
    assert.ok(!temErro(erros, 'nome'));
  });
});

// 3) CPF --------------------------------------------------------------------
describe('cpf', () => {
  const invalidos = ['111.111.111-11', '529.982.247-24', '5299822472', '', null, undefined];
  for (const cpf of invalidos) {
    test(`cpfValido rejeita ${JSON.stringify(cpf)}`, () => {
      assert.equal(cpfValido(cpf), false);
    });
  }

  test('cpfValido aceita CPF valido com ou sem mascara', () => {
    assert.equal(cpfValido('529.982.247-25'), true);
    assert.equal(cpfValido('52998224725'), true);
  });

  test('validar aponta cpf invalido no cadastro', () => {
    const erros = validar(pessoa({ cpf: '111.111.111-11' }), HOJE);
    assert.ok(temErro(erros, 'cpf: invalido'));
  });
});

// 4) EMAIL --------------------------------------------------------------------
describe('email', () => {
  const invalidos = ['', 'sem-arroba.com', '@semantes.com', 'ana@semponto', 'ana @escola.com'];
  for (const email of invalidos) {
    test(`invalido: ${JSON.stringify(email)}`, () => {
      assert.ok(temErro(validar(pessoa({ email }), HOJE), 'email: invalido'));
    });
  }

  test('aceita e-mail valido', () => {
    const erros = validar(pessoa({ email: 'joao@escola.com' }), HOJE);
    assert.ok(!temErro(erros, 'email'));
  });
});

// 5) DATA DE NASCIMENTO — formato e fronteiras -------------------------------
describe('data_nascimento', () => {
  test('formato errado (DD/MM/AAAA) e rejeitado', () => {
    assert.ok(temErro(validar(pessoa({ data_nascimento: '14/03/1998' }), HOJE), 'data_nascimento'));
  });

  test('data que nao existe (30 de fevereiro) e rejeitada', () => {
    assert.ok(temErro(validar(pessoa({ data_nascimento: '1998-02-30' }), HOJE), 'data_nascimento'));
  });

  test('data no futuro e rejeitada', () => {
    const erros = validar(pessoa({ data_nascimento: '2030-01-01' }), HOJE);
    assert.ok(temErro(erros, 'data_nascimento: nao pode estar no futuro'));
  });

  test('idade acima de 120 anos e rejeitada', () => {
    assert.ok(temErro(validar(pessoa({ data_nascimento: '1890-01-01' }), HOJE), 'data_nascimento'));
  });
});

// 6) POSSUI_CNH — tipo e a fronteira dos 18 anos -----------------------------
describe('possui_cnh', () => {
  test('tipo errado (string em vez de booleano) e rejeitado', () => {
    const erros = validar(pessoa({ possui_cnh: 'sim' }), HOJE);
    assert.ok(temErro(erros, 'possui_cnh: informe true ou false'));
  });

  test('menor de 18 anos nao pode ter cnh', () => {
    const erros = validar(
      pessoa({ data_nascimento: '2010-01-05', possui_cnh: true }),
      HOJE
    );
    assert.ok(temErro(erros, 'possui_cnh'));
  });

  test('faz 18 anos exatamente hoje: pode ter cnh', () => {
    const erros = validar(
      pessoa({ data_nascimento: '2008-08-21', possui_cnh: true }),
      HOJE
    );
    assert.deepEqual(erros, []);
  });

  test('faz 18 anos amanha: ainda nao pode', () => {
    const erros = validar(
      pessoa({ data_nascimento: '2008-08-22', possui_cnh: true }),
      HOJE
    );
    assert.ok(temErro(erros, 'possui_cnh'));
  });

  test('possui_cnh false nao exige idade minima', () => {
    const erros = validar(
      pessoa({ data_nascimento: '2015-01-01', possui_cnh: false }),
      HOJE
    );
    assert.ok(!temErro(erros, 'possui_cnh'));
  });
});

// 7) A COMBINACAO -------------------------------------------------------------
test('acumula todos os erros de uma vez, nao para no primeiro', () => {
  const erros = validar(
    {
      nome: 'Al',
      cpf: '123',
      email: 'x',
      data_nascimento: '2030-01-01',
      possui_cnh: 'sim',
    },
    HOJE
  );
  assert.ok(erros.length >= 5);
});

// 8) A EXCECAO ------------------------------------------------------------------
test('garantirValido levanta DadosInvalidosError com a lista de erros', () => {
  assert.throws(
    () => garantirValido(pessoa({ cpf: '111.111.111-11' }), HOJE),
    DadosInvalidosError
  );

  try {
    garantirValido(pessoa({ cpf: '111.111.111-11' }), HOJE);
    assert.fail('deveria ter lancado excecao');
  } catch (erro) {
    assert.deepEqual(erro.erros, ['cpf: invalido']);
  }
});

test('garantirValido nao lanca excecao para cadastro valido', () => {
  assert.doesNotThrow(() => garantirValido(pessoa(), HOJE));
});
