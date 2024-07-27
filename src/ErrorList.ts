export class ServicoIndisponivel extends Error {
    constructor(){
        super()
        this.name = 'ServicoIndisponivel'
        this.message = 'Serviço Indisponível'
    }
}
export class ViolacaoUniqueSS extends Error {
    constructor(){
        super()
        this.name ='NomeJaCadastrado'
        this.message = 'Nome de Soft Skill já registrado'
    }
}
export class ViolacaoUniqueTP extends Error {
    constructor(){
        super()
        this.name ='NomeJaCadastrado'
        this.message = 'Nome de Teste de Proeficiência já registrado'
    }
}
export class TokenNaoFornecido extends Error {
    constructor(){
        super()
        this.name = 'TokenNaoFornecido'
        this.message = 'Token não fornecido'
    }
}
export class TokenInvalido extends Error {
    constructor(){
        super()
        this.name = 'TokenInvalido'
        this.message = 'Token Inválido'
    }
}
export class TokenExpirado extends Error {
    constructor(){
        super()
        this.name = 'TokenExpirado'
        this.message = 'Token Expirado'
    }
}
export class NenhumaSoftSkillEncontrada extends Error {
    constructor(){
        super()
        this.name = 'NenhumaSoftSkillEncontrada'
        this.message = 'Nenhuma Soft Skill encontrada'
    }
}
export class NenhumTesteProeficienciaEncontrado extends Error {
    constructor(){
        super()
        this.name = 'NenhumTesteProeficienciaEncontrado'
        this.message = 'Nenhum teste de proeficiência encontrado'
    }
}
export class FalhaRegistroTesteProeficiencia extends Error {
    constructor(){
        super()
        this.name = 'FalhaRegistroTesteProeficiencia'
        this.message = 'Falha ao registrar teste de proeficiência'
    }
}
export class FalhaEdicaoTesteProeficiencia extends Error {
    constructor(){
        super()
        this.name = 'FalhaEdicaoTesteProeficiencia'
        this.message = 'Falha ao editar teste de proeficiência'
    }
}