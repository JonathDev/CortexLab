from io import StringIO
from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from bson import ObjectId
from dashboard.models import Project
import json
import pandas as pd
from .utils import apply_filter, get_selected_datasets_from_project, get_dataframe_from_project, get_column_type, get_unique_values, replace_values_in_dataframe

from django.views.decorators.csrf import csrf_exempt


@login_required
def analyze_home(request):
    print("🔹 function : analyze_home")

    datasets, error_response = get_selected_datasets_from_project(request)
    if error_response:
        return render(request, "data_cleaning/analyze.html", {"datasets": []})

    print(f"✅ Datasets sélectionnés : {datasets}")
    return render(request, "data_cleaning/analyze.html", {"datasets": datasets})

@login_required
def load_dataset(request, dataset_id):
    print(f"🔍 Chargement du dataset ID : {dataset_id}")

    # 🔹 Récupérer le dataset depuis la session (ou MongoDB si absent)
    df, error = get_dataframe_from_project(request, dataset_id)
    
    if error:
        return JsonResponse({"error": error}, status=404)

    # 🔹 Convertir le DataFrame en format JSON pour le frontend
    data = {
        "id": dataset_id,
        "columns": df.columns.tolist(),
        "rows": df.to_dict(orient="records"),
    }

    print(f"✅ Dataset {dataset_id} chargé avec succès.")
    return JsonResponse(data)



@login_required
@csrf_exempt
def get_column_type_view(request, dataset_id):
    """
    Récupère le type d'une colonne spécifique pour un dataset et affiche les 4 valeurs uniques les plus courantes.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        # 🔹 Récupération du DataFrame depuis la session
        df, error = get_dataframe_from_project(request, dataset_id)
        if error:
            return JsonResponse({"error": error}, status=404)

        # 🔹 Extraction de la colonne demandée
        data = json.loads(request.body)
        column_name = data.get("column_name")

        if column_name not in df.columns:
            return JsonResponse({"error": f"Colonne {column_name} non trouvée."}, status=400)

        # 🔹 Détection du type de colonne
        column_type, error = get_column_type(df, column_name)
        if error:
            return JsonResponse({"error": error}, status=400)

        # 🔹 Compter les valeurs nulles
        null_count = int(df[column_name].isnull().sum())

        # 🔹 Obtenir les 4 valeurs uniques les plus courantes avec leur pourcentage
        value_counts = df[column_name].value_counts(normalize=True) * 100  # Convertir en pourcentage
        top_values = value_counts.head(4).to_dict()  # Prendre les 4 premières valeurs

        # 🔥 Debug : Afficher les valeurs uniques dans la console
        print(f"📌 DEBUG - Valeurs uniques pour {column_name}:", top_values)

      
        return JsonResponse({
            "column_type": column_type,
            "null_count": null_count,
            "top_values": top_values  # Renvoie les 4 valeurs uniques
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



@login_required
@csrf_exempt
def get_unique_values(request, dataset_id):
    print(f"📌 [DEBUG] Requête reçue pour les valeurs uniques de {dataset_id}")
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        df, error = get_dataframe_from_project(request, dataset_id)
        if error:
            return JsonResponse({"error": error}, status=404)

        data = json.loads(request.body)
        column_name = data.get("column_name")

        if column_name not in df.columns:
            return JsonResponse({"error": f"Colonne {column_name} non trouvée."}, status=400)

        unique_values = df[column_name].value_counts(normalize=True).round(4) * 100
        return JsonResponse({"unique_values": unique_values.to_dict()}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

@login_required
@csrf_exempt
def get_filtered_values(request, dataset_id):
    """
    Récupère et retourne les valeurs filtrées du dataset.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    df, error = get_dataframe_from_project(request, dataset_id)
    if error:
        return JsonResponse({"error": error}, status=400)

    try:
        data = json.loads(request.body)
        column = data.get("column")
        filter_type = data.get("filter")  # Condition (ex: "==" pour numérique)
        value = data.get("value")  # Valeur de filtrage

        if column not in df.columns:
            return JsonResponse({"error": "Colonne non trouvée."}, status=400)

        # 🔹 Vérification du type de colonne
        if df[column].dtype in ["int64", "float64"]:
            # 🔹 Filtrage numérique
            if filter_type and value:
                value = float(value)
                df_filtered = df.query(f"`{column}` {filter_type} @value")
            else:
                return JsonResponse({"error": "Condition et valeur requises pour un filtre numérique."}, status=400)

        elif df[column].dtype == "object":
            # 🔹 Filtrage texte (sans condition, seulement une correspondance stricte)
            if value:
                df_filtered = df[df[column].astype(str).str.contains(str(value), case=False, na=False)]
            else:
                return JsonResponse({"error": "Valeur requise pour un filtre texte."}, status=400)

        else:
            return JsonResponse({"error": "Type de colonne non pris en charge."}, status=400)

        filtered_rows = df_filtered.to_dict(orient="records")
        return JsonResponse({"filtered_rows": filtered_rows}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"Erreur de filtrage : {str(e)}"}, status=500)
    
@login_required
@csrf_exempt

@login_required
@csrf_exempt
def replace_filtered_values(request, dataset_id):
    """
    Remplace les valeurs filtrées par une nouvelle valeur dans le dataset en tenant compte de la condition.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    df, error = get_dataframe_from_project(request, dataset_id)
    if error:
        return JsonResponse({"error": error}, status=400)

    try:
        data = json.loads(request.body)
        column = data.get("column")
        condition = data.get("condition")  # Condition de filtrage (<, >, etc.)
        old_value = data.get("old_value")
        new_value = data.get("new_value")

        if column not in df.columns:
            return JsonResponse({"error": "Colonne non trouvée."}, status=400)

        # Sécuriser le nom de colonne pour Pandas (éviter les erreurs de syntaxe)
        column_safe = f"`{column}`"  # Ajout de ` pour éviter les problèmes avec les noms

        # 🔹 Vérifier si c'est une colonne numérique avec une condition
        if df[column].dtype in ["int64", "float64"] and condition:
            try:
                old_value = float(old_value)
                df.loc[df.query(f"{column_safe} {condition} @old_value").index, column] = new_value
            except Exception as e:
                return JsonResponse({"error": f"Erreur d'application du filtre : {str(e)}"}, status=400)
        else:
            # 🔹 Remplacement direct pour du texte sans condition
            df[column] = df[column].replace(str(old_value), str(new_value))

        # 🔹 Sauvegarde dans la session
        request.session[f"modified_dataset_{dataset_id}"] = df.to_json()

        updated_rows = df.to_dict(orient="records")
        return JsonResponse({"updated_rows": updated_rows}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"Erreur lors du remplacement : {str(e)}"}, status=500)

    
@login_required
@csrf_exempt
def delete_filtered_rows(request, dataset_id):
    """
    Supprime les lignes correspondant aux valeurs filtrées en fonction d'une condition.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    df, error = get_dataframe_from_project(request, dataset_id)
    if error:
        return JsonResponse({"error": error}, status=400)

    try:
        data = json.loads(request.body)
        column = data.get("column")
        condition = data.get("condition")
        value = data.get("value")

        if column not in df.columns:
            return JsonResponse({"error": "Colonne non trouvée."}, status=400)

        # 🔹 Appliquer la condition et supprimer les lignes correspondantes
        column_safe = f"`{column}`"  # Sécurisation du nom de colonne pour query()

        if df[column].dtype in ["int64", "float64"] and condition:
            try:
                value = float(value)
                df = df.query(f"not ({column_safe} {condition} @value)")  # Supprime les lignes qui correspondent
            except Exception as e:
                return JsonResponse({"error": f"Erreur de suppression : {str(e)}"}, status=400)
        else:
            # 🔹 Supprimer les lignes qui contiennent la valeur spécifiée
            df = df[df[column].astype(str) != str(value)]

        # 🔹 Sauvegarde dans la session
        request.session[f"modified_dataset_{dataset_id}"] = df.to_json()

        updated_rows = df.to_dict(orient="records")
        return JsonResponse({"updated_rows": updated_rows}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"Erreur lors de la suppression : {str(e)}"}, status=500)
    
@login_required
@csrf_exempt
def delete_column(request, dataset_id):
    """
    Supprime temporairement une colonne du dataset en session, sans affecter la base de données.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    df, error = get_dataframe_from_project(request, dataset_id)
    if error:
        return JsonResponse({"error": error}, status=400)

    try:
        data = json.loads(request.body)
        column = data.get("column")

        if column not in df.columns:
            return JsonResponse({"error": f"Colonne '{column}' non trouvée."}, status=400)

        # 🔹 Récupérer la liste des colonnes supprimées en session
        deleted_columns = request.session.get(f"deleted_columns_{dataset_id}", [])
        
        if column in deleted_columns:
            return JsonResponse({"error": f"Colonne '{column}' déjà supprimée en session."}, status=400)

        # 🔹 Ajouter la colonne à la liste des colonnes supprimées
        deleted_columns.append(column)
        request.session[f"deleted_columns_{dataset_id}"] = deleted_columns

        # 🔹 Supprimer la colonne du DataFrame en session uniquement
        df = df.drop(columns=[column])

        # 🔹 Mise à jour du dataset temporaire dans la session
        request.session[f"modified_dataset_{dataset_id}"] = df.to_json()

        updated_columns = list(df.columns)  # ✅ Récupérer les nouvelles colonnes après suppression
        updated_rows = df.to_dict(orient="records")  # ✅ Mise à jour des lignes aussi

        return JsonResponse({"updated_columns": updated_columns, "updated_rows": updated_rows}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"Erreur lors de la suppression temporaire : {str(e)}"}, status=500)


@login_required
@csrf_exempt
def undo_last_action(request, dataset_id):
    """
    Annule la dernière action entreprise en restaurant les données stockées dans la session.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    session_key = f"modified_dataset_{dataset_id}"

    # Vérifie s'il existe une version précédente du dataset en session
    if session_key not in request.session:
        return JsonResponse({"error": "Aucune action à annuler."}, status=400)

    try:
        # 🔹 Restaurer la version précédente du dataset
        request.session.pop(session_key, None)  # Supprime la version modifiée
        return JsonResponse({"success": "Action annulée avec succès, rechargement nécessaire."}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"Erreur lors de l'annulation : {str(e)}"}, status=500)



"""


# 🔹 Récupération des datasets sélectionnés
@login_required
def get_selected_datasets(request):
    print("🔹 function : get_selected_datasets")

    datasets, error_response = get_selected_datasets_from_project(request)
    if error_response:
        return error_response  

    print(f"✅ Datasets récupérés pour API : {datasets}")
    return JsonResponse({"datasets": datasets})


# 🔹 Chargement d'un dataset
@login_required
def load_dataset(request, dataset_id):
    print(f"🔹 function : load_dataset {dataset_id}")
    df, error = get_dataframe_from_project(request, dataset_id)
    
    if error:
        return JsonResponse({"error": error}, status=404)

    data = {
        "id": dataset_id,
        "columns": df.columns.tolist(),
        "rows": df.to_dict(orient="records"),
    }
    return JsonResponse(data)









# 🔹 Remplacement des valeurs filtrées
@login_required
@csrf_exempt
def replace_values(request, dataset_id):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        df, error = get_dataframe_from_project(request, dataset_id)
        if error:
            return JsonResponse({"error": error}, status=404)

        data = json.loads(request.body)
        column_name = data.get("column")
        old_value = data.get("old_value")
        new_value = data.get("new_value")
        condition = data.get("condition", "==")

        df, message = replace_value_in_dataframe(df, column_name, old_value, new_value, condition)

        request.session[f"modified_dataset_{dataset_id}"] = df.to_json()
        request.session.modified = True

        return JsonResponse({"message": message}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# 🔹 Suppression des valeurs filtrées
@login_required
@csrf_exempt
def delete_filtered_values(request, dataset_id):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        df, error = get_dataframe_from_project(request, dataset_id)
        if error:
            return JsonResponse({"error": error}, status=404)

        data = json.loads(request.body)
        column_name = data.get("column")
        filter_condition = data.get("filter")
        filter_type = data.get("type")
        filter_value = data.get("value")

        df, message = delete_values_from_dataframe(df, column_name, filter_condition, filter_type, filter_value)

        request.session[f"modified_dataset_{dataset_id}"] = df.to_json()
        request.session.modified = True

        return JsonResponse({"message": message}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
"""