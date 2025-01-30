#!/bin/bash

set -e  # Para encerrar o script caso ocorra um erro

# Diretório raiz do projeto
ROOT_DIR=$(pwd)

# Encontrar todas as pastas que contêm serverless.yml e package.json
APIS=$(find . -type f -name "serverless.yml" -exec dirname {} \;)

for API in $APIS; do
  if [ -f "$API/package.json" ]; then
    echo "🔄 Processando $API..."
    cd "$API"
    
    # Remover node_modules e package-lock.json
    echo "🗑️  Removendo node_modules e package-lock.json..."
    rm -rf node_modules package-lock.json
    
    # Reinstalar dependências
    echo "📦 Instalando dependências..."
    npm install
    
    cd "$ROOT_DIR"
  fi
done

# Rodar docker-compose up -d se houver docker-compose.yml no diretório
DOCKER_COMPOSE_FILES=$(find . -type f -name "docker-compose.yml" -exec dirname {} \;)

if [ -n "$DOCKER_COMPOSE_FILES" ]; then
  for DIR in $DOCKER_COMPOSE_FILES; do
    echo "🚀 Iniciando Docker Compose em $DIR..."
    cd "$DIR"
    docker-compose up -d
    cd "$ROOT_DIR"
  done
  
# Aguardar alguns segundos para garantir que os containers estejam prontos
  echo "⏳ Aguardando 5 segundos para inicialização dos serviços..."
  sleep 5

  # Criar a tabela no DynamoDB Local
  echo "📌 Criando tabela no DynamoDB..."
  aws dynamodb create-table \
      --table-name transactions \
      --attribute-definitions \
          AttributeName=transactionId,AttributeType=S \
          AttributeName=createdAt,AttributeType=S \
          AttributeName=accountNumber,AttributeType=S \
      --key-schema \
          AttributeName=transactionId,KeyType=HASH \
          AttributeName=createdAt,KeyType=RANGE \
      --billing-mode PAY_PER_REQUEST \
      --global-secondary-indexes '[
          {
              "IndexName": "AccountCreatedAtIndex",
              "KeySchema": [
                  {"AttributeName": "accountNumber", "KeyType": "HASH"},
                  {"AttributeName": "createdAt", "KeyType": "RANGE"}
              ],
              "Projection": {
                  "ProjectionType": "ALL"
              }
          }
      ]' \
      --endpoint-url http://localhost:8000

  # Criar a fila SQS no LocalStack
  echo "📌 Criando fila SQS..."
  aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name transactions-queue --region sa-east-1

else
  echo "⚠️ Nenhum arquivo docker-compose.yml encontrado."
fi

# Executar migrações Prisma
PRISMA_DIRS=$(find . -type f -name "schema.prisma" -exec dirname {} \;)

if [ -n "$PRISMA_DIRS" ]; then
  for PRISMA_DIR in $PRISMA_DIRS; do
    echo "📌 Rodando Prisma Migrations em $PRISMA_DIR..."
    cd "$PRISMA_DIR"
    npx prisma generate
    npx prisma migrate dev
    cd "$ROOT_DIR"
  done
else
  echo "⚠️ Nenhum projeto Prisma encontrado."
fi

echo "✅ Processo concluído!"
