#!/bin/bash
# stop_all.sh
# Script para parar PostgreSQL, Node e Express no Replit

# Data directory do PostgreSQL
DATA_DIR="/home/runner/workspace/database"

echo "=== Parando PostgreSQL ==="
pg_ctl -D "$DATA_DIR" stop

echo "=== Parando processos Node ==="
# Mata todos os processos Node/Express do usuário runner
pkill -f node

echo "=== Tudo parado! ==="
