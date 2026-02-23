# Dockerfile para app Flet
FROM python:3.11-slim

# Instala dependências básicas
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# Configura ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV TZ=America/Sao_Paulo

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos do projeto
COPY . /app

# Instala dependências
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Expõe a porta usada pelo Flet
EXPOSE 8080

# Comando para rodar a aplicação
CMD ["python","main.py"]