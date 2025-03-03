import pandas as pd
import numpy as np
from bson import ObjectId
from dashboard.models import Project
from django.http import JsonResponse
from io import StringIO


def get_dataframe_from_project(request, dataset_id):
    """
    Récupère un DataFrame depuis la session si disponible, sinon depuis la base de données.
    """
    session_key = f"modified_dataset_{dataset_id}"
    
    try:
        # 🔹 Charger depuis la session si disponible
        if session_key in request.session:
            print(f"📌 Chargement du DataFrame depuis la session pour le dataset {dataset_id}.")
            
            # ✅ Correction : Lire le JSON correctement
            json_data = request.session[session_key]
            df = pd.read_json(json_data)  # StringIO n'est pas nécessaire
            
            print(f"✅ Dataset chargé depuis la session : {df.shape}")
        else:
            print(f"📌 Chargement du DataFrame depuis MongoDB pour le dataset {dataset_id}.")
            project_id = request.session.get("current_project_id")
            if not project_id:
                return None, "❌ Aucun projet actif trouvé."

            project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))
            
            # 🔹 Recherche sécurisée du dataset dans la liste des datasets du projet
            dataset = next((ds for ds in project.datasets if str(ds.id) == dataset_id), None)

            if not dataset:
                return None, "❌ Dataset non trouvé."

            # 🔹 Conversion en DataFrame
            df = pd.DataFrame({col.name: col.values for col in dataset.columns})
            print(f"✅ Dataset chargé depuis MongoDB : {df.shape}")

        return df, None

    except Exception as e:
        print(f"❌ Erreur lors du chargement du dataset : {str(e)}")
        return None, f"❌ Erreur lors du chargement du dataset : {str(e)}"


# 🔹 Récupération des datasets sélectionnés
def get_selected_datasets_from_project(request):
    print("🔹 Appel de get_selected_datasets_from_project()")

    project_id = request.session.get("current_project_id")
    if not project_id:
        print("❌ Aucun projet actif trouvé.")
        return None, JsonResponse({"error": "Aucun projet actif trouvé."}, status=404)

    try:
        project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))
        selected_dataset_ids = request.session.get("selected_datasets", [])

        datasets = [
            {
                "id": str(ds.id),
                "name": ds.name,
                "columns": [{"name": col.name} for col in ds.columns],
                "uploaded_at": ds.uploaded_at.strftime("%Y-%m-%d %H:%M:%S") if ds.uploaded_at else "Non disponible",
            }
            for ds in project.datasets if str(ds.id) in selected_dataset_ids
        ]

        print(f"✅ Datasets récupérés : {datasets}")
        return datasets, None

    except Project.DoesNotExist:
        print("❌ Projet introuvable.")
        return None, JsonResponse({"error": "Projet introuvable."}, status=404)
    
def get_column_type(df, column_name):
    """
    Détecte le type de données d'une colonne spécifique dans un DataFrame.

    Args:
        df (pd.DataFrame): Le DataFrame contenant les données.
        column_name (str): Le nom de la colonne dont on veut connaître le type.

    Returns:
        tuple: ("numérique" | "texte" | "date", None) si succès,
               (None, "Message d'erreur") si échec.
    """
    try:
        # 🔹 Vérification de l'existence de la colonne dans le DataFrame
        if column_name not in df.columns:
            print(f"❌ Erreur : Colonne '{column_name}' non trouvée dans le DataFrame.")
            return None, f"Colonne '{column_name}' non trouvée."

        # 🔹 Détection automatique du type de données
        col_dtype = df[column_name].dtype
        print(f"📌 Détection du type pour '{column_name}' : {col_dtype}")

        # 🔹 Si la colonne contient des nombres (int ou float)
        if pd.api.types.is_numeric_dtype(col_dtype):
            print(f"✅ Colonne '{column_name}' détectée comme numérique.")
            return "numérique", None

        # 🔹 Si la colonne contient des dates ou des timestamps
        elif pd.api.types.is_datetime64_any_dtype(col_dtype):
            print(f"✅ Colonne '{column_name}' détectée comme date.")
            return "date", None

        # 🔹 Si aucune correspondance, la colonne est considérée comme texte
        else:
            print(f"✅ Colonne '{column_name}' détectée comme texte.")
            return "texte", None

    except Exception as e:
        print(f"❌ Erreur lors de la détection du type de colonne '{column_name}' : {str(e)}")
        return None, f"Erreur lors de la détection du type : {str(e)}"



def get_unique_values(df, column_name):
    """
    Retourne toutes les valeurs uniques d'une colonne avec leur fréquence en pourcentage.

    Args:
        df (pd.DataFrame): Le DataFrame contenant les données.
        column_name (str): Le nom de la colonne dont on veut extraire les valeurs uniques.

    Returns:
        dict: Dictionnaire contenant les valeurs uniques et leur pourcentage.
    """
    if column_name not in df.columns:
        print(f"❌ Erreur : Colonne '{column_name}' non trouvée dans le DataFrame.")
        return {"error": f"Colonne '{column_name}' non trouvée."}

    try:
        # 🔹 Calcul des fréquences des valeurs uniques en pourcentage
        value_counts = df[column_name].value_counts(normalize=True).round(4) * 100
        unique_values = value_counts.to_dict()
        print(f"📌 DEBUG - Valeurs uniques pour {column_name}:", unique_values)

        return unique_values

    except Exception as e:
        print(f"❌ Erreur lors de la récupération des valeurs uniques pour '{column_name}' : {str(e)}")
        return {"error": str(e)}
    
# 🔹 Application des filtres selon le type
def apply_filter(df, column_name, filter_type, condition=None, value=None):
    if column_name not in df.columns:
        return df, f"Colonne {column_name} introuvable."

    try:
        if filter_type == "numérique":
            return filter_numeric(df, column_name, condition, value)
        elif filter_type == "date":
            return filter_date(df, column_name, condition, value)
        elif filter_type == "texte":
            return filter_text(df, column_name, value)
        else:
            return df, "❌ Type de colonne inconnu."
    except Exception as e:
        return df, f"Erreur lors de l'application du filtre : {str(e)}"


# 🔹 Filtres spécifiques aux types de données
def filter_numeric(dataset, column_name, condition, value):
    if column_name not in dataset:
        return dataset, f"Colonne {column_name} non trouvée."

    try:
        dataset[column_name] = pd.to_numeric(dataset[column_name], errors="coerce")

        value = float(value)  # Convertir la valeur saisie
        conditions = {
            "<": dataset[column_name] < value,
            "<=": dataset[column_name] <= value,
            ">": dataset[column_name] > value,
            ">=": dataset[column_name] >= value,
            "==": dataset[column_name] == value
        }

        dataset = dataset[conditions.get(condition, dataset)]
    except ValueError:
        return dataset, "Valeur non valide pour une colonne numérique."

    return dataset, "Filtrage numérique appliqué."


def filter_date(dataset, column_name, condition, date_value):
    if column_name not in dataset:
        return dataset, f"Colonne {column_name} non trouvée."

    try:
        date_value = pd.to_datetime(date_value)
        dataset[column_name] = pd.to_datetime(dataset[column_name])

        if condition == "before":
            dataset = dataset[dataset[column_name] < date_value]
        elif condition == "after":
            dataset = dataset[dataset[column_name] > date_value]
        else:
            return dataset, f"Condition invalide : {condition}"
    except Exception as e:
        return dataset, f"Erreur lors du filtrage des dates : {str(e)}"

    return dataset, "Filtrage des dates appliqué."


def filter_text(dataset, column_name, search_value):
    if column_name not in dataset:
        return dataset, f"Colonne {column_name} non trouvée."

    try:
        dataset = dataset[dataset[column_name].astype(str).str.contains(str(search_value), case=False, na=False)]
    except Exception as e:
        return dataset, f"Erreur lors du filtrage texte : {str(e)}"

    return dataset, "Filtrage texte appliqué."


"""
# 🔹 Récupération du dataset depuis la session ou la base de données
def get_dataframe_from_project(request, dataset_id):
    session_key = f"modified_dataset_{dataset_id}"
    try:
        if session_key in request.session:
            df = pd.read_json(request.session[session_key])
        else:
            project_id = request.session.get("current_project_id")
            if not project_id:
                return None, "❌ Aucun projet actif trouvé."

            project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))
            dataset = next((ds for ds in project.datasets if str(ds.id) == dataset_id), None)

            if not dataset:
                return None, "❌ Dataset non trouvé."

            df = pd.DataFrame({col.name: col.values for col in dataset.columns})

        # Vérifier la cohérence des colonnes
        column_lengths = {col: len(df[col]) for col in df.columns}
        if len(set(column_lengths.values())) > 1:
            min_length = min(column_lengths.values())
            for col in df.columns:
                df[col] = df[col][:min_length]

        return df, None

    except Exception as e:
        return None, f"❌ Erreur lors du chargement du dataset : {str(e)}"





# 🔹 Remplacement des valeurs selon une condition
def replace_value_in_dataframe(df, column_name, old_value, new_value, condition="=="):
    if column_name not in df.columns:
        return df, f"❌ Colonne '{column_name}' introuvable."

    conditions = {
        "==": df[column_name] == old_value,
        "<": df[column_name] < old_value,
        "<=": df[column_name] <= old_value,
        ">": df[column_name] > old_value,
        ">=": df[column_name] >= old_value,
        "contains": df[column_name].astype(str).str.contains(str(old_value), na=False)
    }

    df.loc[conditions.get(condition, False), column_name] = new_value

    return df, "✅ Valeurs remplacées avec succès."


# 🔹 Suppression des valeurs selon un filtre
def delete_values_from_dataframe(df, column_name, filter_condition, filter_type, filter_value):
    if column_name not in df.columns:
        return df, f"❌ Colonne {column_name} introuvable."

    conditions = {
        "==": df[column_name] != filter_value,
        "<": df[column_name] >= filter_value,
        "<=": df[column_name] > filter_value,
        ">": df[column_name] <= filter_value,
        ">=": df[column_name] < filter_value,
        "contains": ~df[column_name].astype(str).str.contains(filter_value, case=False, na=False)
    }

    df = df[conditions.get(filter_condition, df)]

    return df, "✅ Valeurs supprimées avec succès."
"""