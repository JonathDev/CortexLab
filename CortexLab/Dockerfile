# Utiliser une image Python comme base
FROM python:3.11

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier requirements.txt et installer les dépendances
COPY requirements.txt /app/
RUN pip install -r requirements.txt

# Copier le reste de l'application
COPY . /app/

# Exposer le port 8000
EXPOSE 8000

# La commande est définie dans `docker-compose.yml`
