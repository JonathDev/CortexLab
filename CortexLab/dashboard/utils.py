import pandas as pd
from .models import Project
from django.http import JsonResponse
from .models import ColumnData
import os 
from bson import ObjectId


def load_data(file):
    try:
        if file.name.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.name.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file)
        else:
            return None, "Type de fichier non supporté."
        return df, None
    except Exception as e:
        return None, str(e)

def get_columns(df):
    return df.columns.tolist()

def save_target(project, target_name):
    project.target = {'name': target_name}
    project.save()

def save_features(project, features_list):
    project.features = {feature: None for feature in features_list}
    project.save()


def save_model_type(project, model_type):
    """
    Met à jour le type de modèle pour un projet.
    """
    project.model_type = model_type
    project.save()


def save_features_with_data(project, df, selected_features):
    features_data = []
    for feature in selected_features:
        if feature in df.columns:
            column_data = ColumnData(name=feature, values=df[feature].tolist())
            features_data.append(column_data)
    project.features = features_data
    project.save()


def save_target_with_data(project, df, target_name):
    if target_name in df.columns:
        target_data = ColumnData(name=target_name, values=df[target_name].tolist())
        project.target = target_data
        project.save()
    else:
        raise ValueError(f"La colonne cible '{target_name}' n'existe pas dans les données.")


def load_data_from_project(project):
    """
    Charge le fichier de données téléchargé et retourne un DataFrame.
    """
    # Implémentez une logique pour retrouver le chemin du fichier téléchargé
    file_path = f"uploads/{project.id}_data.csv"  # Exemple de chemin
    if not os.path.exists(file_path):
        return None, "Fichier de données non trouvé."

    try:
        df = pd.read_csv(file_path)  # Chargez le fichier CSV
        return df, None
    except Exception as e:
        return None, str(e)


def validate_dataset(dataset):
    """
    Valide que le dataset est correctement structuré.
    """
    if not dataset.name:
        raise ValueError("Le dataset doit avoir un nom.")
    if not dataset.columns or len(dataset.columns) == 0:
        raise ValueError("Le dataset doit contenir au moins une colonne.")
    


def delete_dataset_from_project(project_id, dataset_name):
    from bson import ObjectId

    print(f"Suppression du dataset : {dataset_name} dans le projet : {project_id}")
    try:
        project = Project.objects.get(id=ObjectId(project_id))
        print(f"Projet trouvé : {project.name}")
    except Project.DoesNotExist:
        raise ValueError("Projet non trouvé.")

    # Filtrer les datasets
    datasets = [ds for ds in project.datasets if ds.name != dataset_name]
    if len(datasets) == len(project.datasets):  # Aucun changement
        raise ValueError("Dataset introuvable.")

    # Sauvegarder les changements
    project.datasets = datasets
    project.save()
    print(f"Dataset '{dataset_name}' supprimé avec succès")

