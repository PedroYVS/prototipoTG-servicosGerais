import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { SoftSkills, TestesProficiencia, TestesProficienciaQuestoes, conexaoDataBase } from './ServicosGerais.DAOclasses.js'
import {
    TokenNaoFornecido,
    TokenExpirado,
    TokenInvalido,
    ViolacaoUniqueSS,
    ViolacaoUniqueTP,
    ServicoIndisponivel,
    NenhumaSoftSkillEncontrada,
    NenhumTesteProficienciaEncontrado,
    FalhaRegistroTesteProficiencia,
    FalhaEdicaoTesteProficiencia
} from './ErrorList.js'

const appServer = express()
appServer.use(express.json())
appServer.use(cors())

dotenv.config()
const { JWT_UC_ACCESS_KEY, JWT_UA_ACCESS_KEY, JWT_UE_ACCESS_KEY } = process.env
const PORT = process.env.PORT || 6004

await SoftSkills.sync()
await TestesProficiencia.sync()
await TestesProficienciaQuestoes.sync()
/*Sequelize não suporta a criação de tabelas com chaves estrangeiras compostas,
então a criação da tabela alternativas_questoes é feita com uma query.*/
await conexaoDataBase.getConnection()
.then(async (connection: any) => {
    try{
        await connection.query(
            'CREATE TABLE IF NOT EXISTS alternativas_questoes\
            (\
                id_teste_proficiencia INT NOT NULL,\
                id_questao INT NOT NULL,\
                id_alternativa INT NOT NULL,\
                texto_alternativa VARCHAR(250) NOT NULL,\
                \
                CONSTRAINT fk_alternativas_questoes FOREIGN KEY (id_teste_proficiencia, id_questao) \
                REFERENCES testes_proficiencia_questoes (id_teste_proficiencia, id_questao) ON DELETE CASCADE,\
                CONSTRAINT pk_alternativas_questoes PRIMARY KEY (id_teste_proficiencia, id_questao, id_alternativa)\
            ) ENGINE=InnoDB;'
        )
        console.log('Tabela alternativas_questoes criada com sucesso')
    }
    catch(err){
        console.error('Erro na criação da tabela alternativas_questoes', err)
    }
    connection.release()
})
.catch((err: any) => {
    console.error('Erro na conexão com o banco de dados', err)
})

const verificaToken = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')
    if(!token){
        res.status(400).send(new TokenNaoFornecido())
        return
    }
    let chave: string | undefined
    switch(req.query.tipoUsuario){
        case 'UA':
            chave = JWT_UA_ACCESS_KEY
            break
        case 'UC':
            chave = JWT_UC_ACCESS_KEY
            break
        case 'UE':
            chave = JWT_UE_ACCESS_KEY
            break
    }
    jwt.verify(token[1], chave!, (err: any, result: any) => {
        if(err){
            console.error("Erro na verificação do Token", err)
            switch(err.name){
                case 'TokenExpiredError':
                    res.status(401).send(new TokenExpirado())
                    return
                case 'JsonWebTokenError':
                    res.status(401).send(new TokenInvalido())
                    return
            }
        }
        req.usuario = result.usuario
        next()
    })
}

appServer.post('/registrar-softskill', verificaToken, async (req, res) => {
    const { nome_soft_skill, descricao_soft_skill, email_admin } = req.body
    try{
        await SoftSkills.create({ nome_soft_skill, descricao_soft_skill, email_admin })
        res.status(201).send('Soft Skill Registrada com Sucesso')
    }catch(err: any){
        console.error("Erro ao registrar soft skill", err)
        switch(err.errors[0].type){
            case 'unique violation':
                res.status(409).send(new ViolacaoUniqueSS())
                break
            default:
                res.status(503).send(new ServicoIndisponivel())
        }
    }
})

appServer.get('/listar-softskills', verificaToken, async (_req, res) => {
    try{
        const softSkills = await SoftSkills.findAll()
        if(softSkills.length > 0){
            res.status(200).send(softSkills)
        }
        else{
            res.status(404).send(new NenhumaSoftSkillEncontrada())
        }
    }catch(err){
        console.error("Erro ao listar soft skills", err)
        res.status(503).send(new ServicoIndisponivel())
    }
})

appServer.put('/editar-softskill', verificaToken, async (req, res) => {
    const { id_soft_skill } = req.query
    const { nome_soft_skill, descricao_soft_skill } = req.body
    console.log(`Dados: ${id_soft_skill}, ${nome_soft_skill}, ${descricao_soft_skill}`)
    try{
        await SoftSkills.update({ nome_soft_skill, descricao_soft_skill }, { where: { id_soft_skill } })
        res.status(200).send('Soft Skill Editada com Sucesso')
    }catch(err: any){
        console.error("Erro ao editar soft skill", err)
        res.status(503).send(new ServicoIndisponivel())
    }
})

appServer.delete('/deletar-softskill', verificaToken, async (req, res) => {
    console.log(req.query)
    const { id_soft_skill } = req.query
    try{
        await SoftSkills.destroy({ where: { id_soft_skill } })
        res.status(200).send('Soft Skill Deletada com Sucesso')
    }catch(err: any){
        console.error("Erro ao deletar soft skill", err)
        res.status(503).send(new ServicoIndisponivel())
    }
})

appServer.post('/registrar-teste-proficiencia', verificaToken, async (req, res) => {
    const { 
        nome_teste_proficiencia, 
        descricao_teste_proficiencia, 
        email_admin, 
        questoes, 
        alternativas 
    } = req.body

    let idTP: number, con: any
    try{
        con = await conexaoDataBase.getConnection()
    }
    catch(err: any){
        console.log('Erro ao estabelecer conexão ', err)
        res.status(503).send(new ServicoIndisponivel())
        return
    }
    con.beginTransaction()
    .then(() => {
        return con.query(
            `INSERT INTO testes_proficiencia (nome_teste_proficiencia, 
            descricao_teste_proficiencia, email_admin) VALUES 
            ('${nome_teste_proficiencia}', '${descricao_teste_proficiencia}', 
            '${email_admin}')`
        )
    })
    .then((result: any) => {
        idTP = result[0].insertId
        const quests = []
        for(let i = 0; i < questoes.length; i++){
            const q = [
                idTP,
                questoes[i].id_questao,
                questoes[i].enunciado_questao,
                questoes[i].valor_questao,
                questoes[i].alternativa_correta,
                questoes[i].id_soft_skill
            ]
            quests.push(q)
        }
        return con.query(
            'INSERT INTO testes_proficiencia_questoes \
            (id_teste_proficiencia, id_questao, enunciado_questao, \
            valor_questao, alternativa_correta, id_soft_skill) \
            VALUES ?',
            [quests]
        )
    })
    .then(() => {
        const alts = []
        for(let i = 0; i < alternativas.length; i++){
            const a = [
                idTP,
                alternativas[i].id_questao,
                alternativas[i].id_alternativa,
                alternativas[i].texto_alternativa
            ]
            alts.push(a)
        }
        return con.query(
            'INSERT INTO alternativas_questoes (id_teste_proficiencia, \
            id_questao, id_alternativa, texto_alternativa) VALUES ?',
            [alts]
        )
    })
    .then(() => {
        con.commit().then(() => {
            res.status(201).send('Teste de Proficiência Registrado com Sucesso')
        })
    })
    .catch((reason: any) => {
        con.rollback().then(() => {
            console.error('Erro ao registrar teste de proficiência', reason)
            switch(reason.code){
                case 'ER_DUP_ENTRY':
                    res.status(409).send(new ViolacaoUniqueTP())
                    break
                default:
                    res.status(503).send(new FalhaRegistroTesteProficiencia())
            }
        })
    })
    .finally(() => {
        con.release()
    })
})

appServer.get('/listar-testes-proficiencia', verificaToken, async (_req, res) => {
    let con: any
    try{
        con = await conexaoDataBase.getConnection()
        const dadosTestes = await con.query(
            'SELECT * FROM testes_proficiencia ORDER BY id_teste_proficiencia'
        )
        if(dadosTestes[0].length === 0){
            res.status(404).send(new NenhumTesteProficienciaEncontrado())
            con.release()
            return
        }
        const dadosQuestoes = await con.query(
            'SELECT tb1.*, tb2.nome_soft_skill FROM testes_proficiencia_questoes \
            tb1 LEFT OUTER JOIN soft_skills tb2 ON tb1.id_soft_skill = tb2.id_soft_skill;'
        )
        const dadosAlternativas = await con.query('SELECT * FROM alternativas_questoes')
        const TestesProficiencia = {
            testes: dadosTestes[0],
            questoes: dadosQuestoes[0],
            alternativas: dadosAlternativas[0]
        }
        res.status(200).send(TestesProficiencia)
    }
    catch(err: any){
        console.log('Erro ao estabelecer conexão ', err)
        res.status(503).send(new ServicoIndisponivel())
    }
    finally{
        if(con) con.release()
    }
})

appServer.delete('/deletar-teste-proficiencia', verificaToken, async (req, res) => {
    const { id_teste_proficiencia } = req.query
    try{
        await TestesProficiencia.destroy({ where: { id_teste_proficiencia } })
        res.status(200).send('Teste de Proficiência Deletado com Sucesso')
    }
    catch(err: any){
        console.log('Erro ao estabelecer conexão ', err)
        res.status(503).send(new ServicoIndisponivel())
    }
})

appServer.put('/editar-teste-proficiencia', verificaToken, async (req, res) => {
    const { 
        id_teste_proficiencia,
        nome_teste_proficiencia,
        descricao_teste_proficiencia,
        email_admin,
        questoes,
        alternativas
    } = req.body

    let con: any
    try{
        con = await conexaoDataBase.getConnection()
    }
    catch(err: any){
        console.log('Erro ao estabelecer conexão ', err)
        res.status(503).send(new ServicoIndisponivel())
        return
    }

    con.beginTransaction()
    .then(() => {
        return con.query(
            `UPDATE testes_proficiencia SET nome_teste_proficiencia = 
            '${nome_teste_proficiencia}', descricao_teste_proficiencia = 
            '${descricao_teste_proficiencia}', email_admin = '${email_admin}'
            WHERE id_teste_proficiencia = ${id_teste_proficiencia}`
        )
    })
    .then(() => {
        return con.query(
            `DELETE FROM testes_proficiencia_questoes 
            WHERE id_teste_proficiencia = ${id_teste_proficiencia}`
        )
    })
    .then(() => {
        const quests = []
        for(let i = 0; i < questoes.length; i++){
            const q = [
                id_teste_proficiencia,
                questoes[i].id_questao,
                questoes[i].enunciado_questao,
                questoes[i].valor_questao,
                questoes[i].alternativa_correta,
                questoes[i].id_soft_skill
            ]
            quests.push(q)
        }
        return con.query(
            'INSERT INTO testes_proficiencia_questoes \
            (id_teste_proficiencia, id_questao, enunciado_questao, \
            valor_questao, alternativa_correta, id_soft_skill) VALUES ?',
            [quests]
        )
    })
    .then(() => {
        const alts = []
        for(let i = 0; i < alternativas.length; i++){
            const a = [
                id_teste_proficiencia,
                alternativas[i].id_questao,
                alternativas[i].id_alternativa,
                alternativas[i].texto_alternativa
            ]
            alts.push(a)
        }
        return con.query(
            'INSERT INTO alternativas_questoes \
            (id_teste_proficiencia, id_questao, \
            id_alternativa, texto_alternativa) VALUES ?',
            [alts]
        )
    })
    .then(() => {
        con.commit().then(() => {
            res.status(200).send('Teste de Proficiência Editado com Sucesso')
        })
    })
    .catch((reason: any) => {
        con.rollback().then(() => {
            console.error('Erro ao editar teste de proficiência', reason)
            switch(reason.code){
                case 'ER_DUP_ENTRY':
                    res.status(409).send(new ViolacaoUniqueTP())
                    break
                default:
                    res.status(503).send(new FalhaEdicaoTesteProficiencia())
            }
        })
    })
    .finally(() => {
        con.release()
    })
})

appServer.listen(PORT, () => console.log(`Serviços Gerais. Servidor rodando na porta ${PORT}`))