#!/bin/bash
# setup_postgres.sh
# Script completo para configurar PostgreSQL no Replit com permissões corretas

# Nome do data directory
DATA_DIR="./database"

# Nome do logfile
LOGFILE="./logfile.log"

# Nome do banco e usuário
DB_NAME="meu_banco"
DB_USER="meu_usuario"
DB_PASS="sua_senha"

# Caminhos dos arquivos SQL
SQL1="main/datadb/matriculas_autorizadas.sql"
SQL2="main/datadb/users.sql"
SQL3="main/datadb/resetSenha.sql"
SQL4="main/datadb/ordens.sql"
SQL5="main/datadb/ordens_problemas.sql"
SQL6="main/datadb/ordens_instalacoes.sql"
SQL7="main/datadb/ordens_anexos.sql"


echo "=== Inicializando PostgreSQL ==="

# Inicializa o banco se ainda não existir
if [ ! -d "$DATA_DIR" ]; then
    echo "Criando data directory..."
    initdb -D "$DATA_DIR"
fi

# Cria pasta para o lock file
mkdir -p /run/postgresql
chmod 777 /run/postgresql

# Inicia o PostgreSQL
echo "Iniciando servidor PostgreSQL..."
pg_ctl -D "$DATA_DIR" -l "$LOGFILE" start

# Espera alguns segundos para garantir que o servidor subiu
sleep 2

# Cria banco
echo "Criando banco $DB_NAME..."
createdb -h 127.0.0.1 -U runner "$DB_NAME"

# Cria usuário
echo "Criando usuário $DB_USER..."
psql -h 127.0.0.1 -U runner -d "$DB_NAME" -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';"

# Transfere ownership do schema public para o novo usuário
echo "Alterando owner do schema public para $DB_USER..."
psql -h 127.0.0.1 -U runner -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO $DB_USER;"

# Roda os scripts SQL com o usuário correto
echo "Importando SQLs..."
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL1"
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL2"
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL3"
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL4"
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL5"
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL6"
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f "$SQL7"

echo "=== PostgreSQL configurado com sucesso! ==="
echo "Para acessar o banco: psql -h 127.0.0.1 -U $DB_USER -d $DB_NAME"
