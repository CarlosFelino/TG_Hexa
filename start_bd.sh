#!/bin/bash
# start_bd.sh
# Script para iniciar PostgreSQL no Replit

# Diretório do banco
DATA_DIR="database"
LOGFILE="logfile"

# Garantir diretório do socket
mkdir -p /run/postgresql
chmod 777 /run/postgresql

# Iniciar o PostgreSQL
pg_ctl -D "$DATA_DIR" -l "$LOGFILE" start
