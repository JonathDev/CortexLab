from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from django.shortcuts import get_object_or_404
from bson import ObjectId
from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from dashboard.models import Project

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