import dotenv from 'dotenv'
import { Sequelize, DataTypes, Model } from 'sequelize'
import mysql from 'mysql2/promise'


dotenv.config()
const { HOST, USER, PASSWORD, DATABASE, PORT_DATABASE_CONNECTION, SSL } = process.env

export const sequelize = new Sequelize({
    database: DATABASE,
    username: USER,
    password: PASSWORD,
    host: HOST,
    port: +PORT_DATABASE_CONNECTION!,
    ssl: SSL === 'REQUIRED' ? true : false,
    dialect: 'mysql'
})

export const conexaoDataBase = mysql.createPool({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    port: +PORT_DATABASE_CONNECTION!,
})

export class SoftSkills extends Model {}

SoftSkills.init(
    {
        id_soft_skill: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nome_soft_skill: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true
        },
        descricao_soft_skill: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        email_admin: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: 'SoftSkills',
        tableName: 'soft_skills',
        timestamps: false,
    }
)

export class TestesProeficiencia extends Model {}

TestesProeficiencia.init(
    {
        id_teste_proeficiencia: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nome_teste_proeficiencia: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true
        },
        descricao_teste_proeficiencia: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        email_admin: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: 'TestesProeficiencia',
        tableName: 'testes_proeficiencia',
        timestamps: false,
    }
)

export class TestesProeficienciaQuestoes extends Model {}

TestesProeficienciaQuestoes.init(
    {
        id_teste_proeficiencia: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: TestesProeficiencia,
                key: 'id_teste_proeficiencia'
            },
            onDelete: 'CASCADE'
        },
        id_questao: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        enunciado_questao: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        valor_questao: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false
        },
        alternativa_correta: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_soft_skill: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: SoftSkills,
                key: 'id_soft_skill'
            },
            onDelete: 'SET NULL'
        }
    },
    {
        sequelize,
        modelName: 'TestesProeficienciaQuestoes',
        tableName: 'testes_proeficiencia_questoes',
        timestamps: false
    }
) 

// export class AlternativasQuestoes extends Model {}

// AlternativasQuestoes.init(
//     {
//         id_teste_proeficiencia: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             primaryKey: true,
//         },
//         id_questao: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             primaryKey: true,
//         },
//         id_alternativa: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             primaryKey: true
//         },
//         texto_alternativa: {
//             type: DataTypes.STRING(500),
//             allowNull: false
//         }
//     },
//     {
//         sequelize,
//         modelName: 'AlternativasQuestoes',
//         tableName: 'alternativas_questoes',
//         timestamps: false
//     }
// )