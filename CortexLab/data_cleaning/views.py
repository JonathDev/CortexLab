from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from bson import ObjectId
from django.http import JsonResponse
from dashboard.models import Project
import json
import pandas as pd
from .utils import filter_numeric, filter_date, filter_text, apply_filter, get_column_type, preprocess_missing_values
from django.views.decorators.csrf import csrf_exempt

@login_required
def analyze_home(request):
    print("function : analyze_home")
    selected_dataset_ids = request.session.get("selected_datasets", [])
    project_id = request.session.get("current_project_id")

    if not project_id:
        return render(request, "data_cleaning/analyze.html", {"datasets": []})

    try:
        # Récupérer le projet
        project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))

        # Filtrer les datasets sélectionnés
        datasets = [
            {
                "id": ds.id,
                "name": ds.name,
                "columns": [{"name": col.name} for col in ds.columns],
                "uploaded_at": ds.uploaded_at.strftime("%Y-%m-%d %H:%M:%S") if ds.uploaded_at else "Non disponible",
            }
            for ds in project.datasets if str(ds.id) in selected_dataset_ids
        ]

        print(f"Selected datasets: {datasets}")

        return render(request, "data_cleaning/analyze.html", {"datasets": datasets})

    except Project.DoesNotExist:
        print("Projet non trouvé")
        return render(request, "data_cleaning/analyze.html", {"datasets": []})


@login_required
def get_selected_datasets(request):
    print('function : get_select_datasets')
    print(f"Session Data: {request.session.items()}")  # Log complet de la session

    # Récupère les datasets sélectionnés depuis la session
    project_id = request.session.get('current_project_id')
    print(f"Project ID from session: {project_id}")

    selected_dataset_ids = request.session.get("selected_datasets", [])
    print(f"Selected Dataset IDs from session: {selected_dataset_ids}")

    if not project_id:
        return JsonResponse({"datasets": [], "error": "Aucun projet actif."}, status=400)

    try:
        project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))
        datasets = [
            {
                "id": ds.id,
                "name": ds.name,
                "columns": [{"name": col.name} for col in ds.columns],
                "uploaded_at": ds.uploaded_at.strftime("%Y-%m-%d %H:%M:%S") if ds.uploaded_at else "Non disponible"
            }
            for ds in project.datasets if ds.id in selected_dataset_ids
        ]
        print(f"Filtered Datasets: {datasets}")
        return JsonResponse({"datasets": datasets})
    except Project.DoesNotExist:
        return JsonResponse({"datasets": [], "error": "Projet non trouvé."}, status=404)



@login_required
def load_dataset(request, dataset_id):
    print(f"function : load_dataset {dataset_id}")
    project_id = request.session.get("current_project_id")
    if not project_id:
        return JsonResponse({"error": "Aucun projet actif trouvé."}, status=404)

    try:
        project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))
        dataset = next((ds for ds in project.datasets if str(ds.id) == dataset_id), None)

        if not dataset:
            return JsonResponse({"error": "Dataset non trouvé."}, status=404)

        # Construire la structure des données pour le frontend
        data = {
            "id": str(dataset.id),
            "name": dataset.name,
            "columns": [col.name for col in dataset.columns],
            "rows": [
                {
                    "row_id": index + 1,  # Ajout de l'ID de la ligne
                    **{col.name: value for col, value in zip(dataset.columns, row)}
                }
                for index, row in enumerate(zip(*(col.values for col in dataset.columns)))
            ],
        }
        print("Data envoyée :", data)
        return JsonResponse(data)
    except Exception as e:
        print(f"Erreur : {e}")
        return JsonResponse({"error": f"Erreur lors du chargement du dataset : {str(e)}"}, status=500)
    

    
@login_required
def apply_filter(request, dataset_id):
    """
    Applique un filtre sur un dataset sélectionné en fonction du type de colonne.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        # Récupérer le projet et le dataset
        project_id = request.session.get("current_project_id")
        if not project_id:
            return JsonResponse({"error": "Aucun projet actif trouvé."}, status=404)

        project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))
        dataset = next((ds for ds in project.datasets if str(ds.id) == dataset_id), None)

        if not dataset:
            return JsonResponse({"error": "Dataset non trouvé."}, status=404)

        # Charger les données sous forme de DataFrame
        df = pd.DataFrame({col.name: col.values for col in dataset.columns})

        # Récupérer les données de la requête
        data = json.loads(request.body)
        column_name = data.get("column")
        filter_type = data.get("type")  # "numérique", "texte", "date"
        condition = data.get("filter")
        value = data.get("value")

        # Appliquer le filtre selon le type
        filtered_df, message = apply_filter(df, column_name, filter_type, condition, value)

        if "Filtrage appliqué" not in message:
            return JsonResponse({"error": message}, status=400)

        # Convertir les données filtrées pour le frontend
        filtered_data = filtered_df.to_dict(orient="records")
        return JsonResponse({"filtered_rows": filtered_data, "message": message}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"Erreur lors de l'application du filtre : {str(e)}"}, status=500)
    


@login_required
@csrf_exempt
def apply_filter_view(request, dataset_id):
    """
    Vue pour appliquer un filtre sur un dataset.
    """
    if request.method == "POST":
        try:
            # Charger le dataset du projet
            project_id = request.session.get("current_project_id")
            project = Project.objects.get(id=project_id, user_id=str(request.user.id))
            dataset = next(ds for ds in project.datasets if str(ds.id) == dataset_id)

            # Convertir les données en DataFrame Pandas
            df = pd.DataFrame.from_records(
                {col.name: col.values for col in dataset.columns}
            )

            # Récupérer les données envoyées par le frontend
            payload = json.loads(request.body)
            column = payload.get("column")
            filter_type = payload.get("type")
            condition = payload.get("filter")
            value = payload.get("value")

            # Appliquer le filtre
            filtered_df, message = apply_filter(df, column, filter_type, condition, value)
            if "Filtrage appliqué" not in message:
                return JsonResponse({"error": message}, status=400)

            # Convertir les résultats en JSON pour le frontend
            filtered_data = filtered_df.to_dict(orient="records")
            return JsonResponse({"filtered_rows": filtered_data}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Requête invalide."}, status=400)

@csrf_exempt
@login_required
def get_column_type_view(request, dataset_id):
    if request.method == "POST":
        try:
            project_id = request.session.get("current_project_id")
            project = Project.objects.get(id=ObjectId(project_id), user_id=str(request.user.id))
            dataset = next(ds for ds in project.datasets if str(ds.id) == dataset_id)

            payload = json.loads(request.body)
            column_name = payload.get("column_name")

            # Charger les données sous forme de DataFrame
            df = pd.DataFrame({col.name: col.values for col in dataset.columns})

            # Prétraiter les valeurs manquantes
            df = preprocess_missing_values(df, column_name)

            # Calculer les statistiques
            column_type, error = get_column_type(df, column_name)
            if error:
                return JsonResponse({"error": error}, status=400)

            null_count = int(df[column_name].isnull().sum())
            unique_values = (
                df[column_name]
                .value_counts(normalize=True)
                .round(4) * 100  # Convertir en pourcentage
            ).to_dict()

            response_data = {
                "column_type": column_type,
                "null_count": null_count,
                "unique_values": unique_values,
            }
            return JsonResponse(response_data)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Requête invalide."}, status=400)
