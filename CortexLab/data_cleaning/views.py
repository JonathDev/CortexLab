from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId  # Pour manipuler les ObjectId de MongoDB
from dashboard.models import Project
from .utilis import load_dataset, remove_columns, dataframe_to_json
import json

# Cache global pour stocker les datasets modifiés
dataset_cache = {}

# Vue principale pour la gestion des datasets
def analyze_home(request):
    """
    Vue principale pour afficher les datasets sélectionnés et les charger dans le cache.
    """
    dataset_ids = request.GET.get('datasets', '').split(',')
    datasets = []

    for project in Project.objects.all():
        for dataset in project.datasets:
            if str(dataset.id) in dataset_ids:
                datasets.append(dataset)
                # Charger le dataset dans le cache
                dataset_cache[str(dataset.id)] = {
                    "name": dataset.name,
                    "uploaded_at": dataset.uploaded_at.isoformat(),
                    "columns": [col.name for col in dataset.columns],
                    "rows_count": len(dataset.columns[0].values) if dataset.columns else 0,
                    "preview": [
                        {col.name: col.values[i] for col in dataset.columns}
                        for i in range(min(10, len(dataset.columns[0].values)))
                    ] if dataset.columns else []
                }
                print(f"Dataset ajouté au cache : {dataset.name} (ID : {dataset.id})")

    context = {'datasets': datasets}
    return render(request, 'data_cleaning/analyze.html', context)

# Vue pour récupérer les détails d'un dataset depuis le cache
def dataset_detail(request, dataset_id):
    print(f"Requête pour le dataset ID : {dataset_id}")
    if dataset_id in dataset_cache:
        data = dataset_cache[dataset_id]
        print(f"Dataset trouvé dans le cache : {data['name']}")
        return JsonResponse({"success": True, "data": data})
    else:
        print("Erreur : Dataset introuvable dans le cache.")
        return JsonResponse({"success": False, "error": "Dataset introuvable dans le cache."}, status=404)

# Vue pour supprimer des colonnes d'un dataset dans le cache
@csrf_exempt
def delete_column(request, dataset_id):
    """
    Supprime des colonnes du dataset dans le cache.
    """
    print(f"Requête pour suppression des colonnes pour le dataset ID : {dataset_id}")

    if request.method == "POST":
        try:
            # Vérifier si le dataset est dans le cache
            if dataset_id not in dataset_cache:
                print("Erreur : Dataset introuvable dans le cache.")
                return JsonResponse({"success": False, "error": "Dataset introuvable dans le cache."}, status=404)

            # Charger le dataset depuis le cache
            cached_dataset = dataset_cache[dataset_id]
            print(f"Dataset chargé depuis le cache : {cached_dataset['name']}")

            # Charger les colonnes à supprimer depuis le corps de la requête
            body = json.loads(request.body)
            columns_to_delete = body.get("columns", [])
            print(f"Colonnes à supprimer : {columns_to_delete}")

            if not columns_to_delete:
                print("Aucune colonne spécifiée dans la requête.")
                return JsonResponse({"success": False, "error": "Aucune colonne spécifiée."}, status=400)

            # Vérifier l'existence des colonnes
            column_names = cached_dataset["columns"]
            invalid_columns = [col for col in columns_to_delete if col not in column_names]

            if invalid_columns:
                print(f"Colonnes invalides : {invalid_columns}")
                return JsonResponse({"success": False, "error": f"Colonnes non valides : {', '.join(invalid_columns)}"}, status=404)

            # Supprimer les colonnes spécifiées
            cached_dataset["columns"] = [col for col in cached_dataset["columns"] if col not in columns_to_delete]
            cached_dataset["preview"] = [
                {key: row[key] for key in row if key not in columns_to_delete}
                for row in cached_dataset["preview"]
            ]
            print(f"Colonnes restantes : {cached_dataset['columns']}")

            # Mettre à jour le cache
            dataset_cache[dataset_id] = cached_dataset
            print("Cache mis à jour avec succès.")

            return JsonResponse({"success": True, "message": f"Colonnes supprimées : {', '.join(columns_to_delete)}"})

        except Exception as e:
            print(f"Erreur inconnue : {e}")
            return JsonResponse({"success": False, "error": str(e)}, status=500)

    print("Erreur : Méthode HTTP non autorisée.")
    return JsonResponse({"success": False, "error": "Méthode non autorisée."}, status=405)
