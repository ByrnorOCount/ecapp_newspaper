import knex0bj from 'knex';

const knex = knex0bj({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'newspaper_db'
    },
    pool: { min: 0, max: 7 }
});

export default knex;