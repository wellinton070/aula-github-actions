// pessoaFisica.js
// Modulo de validacao de cadastro de Pessoa Fisica — Aula 08
// Funciona tanto no Node (require) quanto no navegador (window.PessoaFisica)

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PessoaFisica = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IDADE_MINIMA_CNH = 18;
  const IDADE_MAXIMA = 120;
  const FORMATO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const FORMATO_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ'\- ]+$/;
  const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

  class DadosInvalidosError extends Error {
    constructor(erros) {
      super(erros.join('; '));
      this.name = 'DadosInvalidosError';
      this.erros = erros; // a lista viaja dentro da excecao
    }
  }

  function soDigitos(texto) {
    return (texto ?? '').toString().replace(/\D/g, '');
  }

  function cpfValido(cpf) {
    const numeros = soDigitos(cpf);
    if (numeros.length !== 11) return false; // tamanho
    if (numeros === numeros[0].repeat(11)) return false; // 111.111.111-11 e amigos

    for (const quantidade of [9, 10]) {
      let soma = 0;
      for (let i = 0; i < quantidade; i++) {
        soma += Number(numeros[i]) * (quantidade + 1 - i);
      }
      const digito = ((soma * 10) % 11) % 10;
      if (digito !== Number(numeros[quantidade])) return false;
    }
    return true;
  }

  function idadeEm(nascimento, hoje) {
    let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
    const diffMes = hoje.getUTCMonth() - nascimento.getUTCMonth();
    if (diffMes < 0 || (diffMes === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) {
      idade--;
    }
    return idade;
  }

  function validarNome(nome, erros) {
    if (typeof nome !== 'string' || nome.trim().length === 0) {
      erros.push('nome: obrigatorio');
      return;
    }
    const limpo = nome.trim();
    if (limpo.length < 3) {
      erros.push('nome: tamanho minimo de 3 caracteres');
      return;
    }
    if (limpo.length > 80) {
      erros.push('nome: tamanho maximo de 80 caracteres');
      return;
    }
    if (!FORMATO_NOME.test(limpo)) {
      erros.push('nome: use apenas letras, espaco, apostrofo e hifen');
      return;
    }
    const palavras = limpo
      .split(/[\s-]+/)
      .filter((p) => p.replace(/'/g, '').length >= 2);
    if (palavras.length < 2) {
      erros.push('nome: informe nome e sobrenome');
    }
  }

  function validarNascimento(dataStr, hoje, erros) {
    if (typeof dataStr !== 'string' || dataStr.trim().length === 0) {
      erros.push('data_nascimento: obrigatorio');
      return null;
    }
    const match = FORMATO_DATA.exec(dataStr.trim());
    if (!match) {
      erros.push('data_nascimento: formato invalido, use AAAA-MM-DD');
      return null;
    }
    const ano = Number(match[1]);
    const mes = Number(match[2]);
    const dia = Number(match[3]);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    const dataExiste =
      data.getUTCFullYear() === ano &&
      data.getUTCMonth() === mes - 1 &&
      data.getUTCDate() === dia;
    if (!dataExiste) {
      erros.push('data_nascimento: data invalida');
      return null;
    }
    if (data.getTime() > hoje.getTime()) {
      erros.push('data_nascimento: nao pode estar no futuro');
      return null;
    }
    if (idadeEm(data, hoje) > IDADE_MAXIMA) {
      erros.push('data_nascimento: idade maxima de 120 anos');
      return null;
    }
    return data;
  }

  /**
   * Devolve a LISTA de erros (vazia = tudo certo). Nunca levanta excecao.
   * @param {object} pessoa
   * @param {Date} [hoje] - injecao de dependencia do "relogio", para testes
   */
  function validar(pessoa, hoje) {
    pessoa = pessoa || {};
    hoje = hoje || new Date();
    const erros = [];

    validarNome(pessoa.nome, erros);

    if (!cpfValido(pessoa.cpf)) {
      erros.push('cpf: invalido');
    }

    const email = (pessoa.email ?? '').toString().trim();
    if (!FORMATO_EMAIL.test(email)) {
      erros.push('email: invalido');
    }

    const nascimento = validarNascimento(pessoa.data_nascimento, hoje, erros);

    const possuiCnh = pessoa.possui_cnh;
    if (typeof possuiCnh !== 'boolean') {
      erros.push('possui_cnh: informe true ou false');
    } else if (possuiCnh && nascimento && idadeEm(nascimento, hoje) < IDADE_MINIMA_CNH) {
      erros.push('possui_cnh: so a partir de 18 anos');
    }

    return erros;
  }

  /**
   * Levanta DadosInvalidosError com a lista de erros dentro.
   * Usar quando o correto e interromper o fluxo (ex.: antes de salvar).
   */
  function garantirValido(pessoa, hoje) {
    const erros = validar(pessoa, hoje);
    if (erros.length) {
      throw new DadosInvalidosError(erros);
    }
    return true;
  }

  return { validar, garantirValido, cpfValido, idadeEm, DadosInvalidosError };
});
