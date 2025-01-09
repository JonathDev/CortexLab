from django.shortcuts import render
from django.http import JsonResponse
from dashboard.models import Project

from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId  # Import pour gérer ObjectId de MongoDB
import json



def analyze_home(request):
    """
    Vue principale pour afficher les datasets sélectionnés.
    """
    # Récupérer les IDs transmis dans l'URL
    dataset_ids = request.GET.get('datasets', '').split(',')
    print("Dataset IDs reçus :", dataset_ids)

    # Récupérer les datasets correspondant aux IDs
    datasets = []
    for project in Project.objects.all():
        print(f"Vérification du projet : {project.name}")
        for dataset in project.datasets:
            if str(dataset.id) in dataset_ids:  # Comparaison d'ID sous forme de chaîne
                print(f"Dataset ajouté : {dataset.name}")
                datasets.append(dataset)

    # Déboguer les datasets récupérés
    print("Datasets récupérés :", [dataset.name for dataset in datasets])

    # Passer les datasets au template
    context = {'datasets': datasets}
    return render(request, 'data_cleaning/analyze.html', context)


def dataset_detail(request, dataset_id):
    try:
        # Récupérer le projet contenant le dataset
        project = Project.objects(datasets__id=dataset_id).first()
        if not project:
            return JsonResponse({"success": False, "error": "Projet contenant ce dataset non trouvé."})

        # Trouver le dataset dans la liste des datasets du projet
        dataset = next((ds for ds in project.datasets if ds.id == dataset_id), None)
        if not dataset:
            return JsonResponse({"success": False, "error": "Dataset non trouvé dans le projet."})

        # Extraire les données nécessaires
        data = {
            "success": True,
            "data": {
                "name": dataset.name,
                "uploaded_at": dataset.uploaded_at.isoformat(),
                "columns": [col.name for col in dataset.columns],
                "rows_count": len(dataset.columns[0].values) if dataset.columns else 0,
                "preview": [
                    {col.name: col.values[i] for col in dataset.columns}
                    for i in range(min(5, len(dataset.columns[0].values)))  # Max 5 lignes
                ] if dataset.columns else []
            }
        }

        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})



def get_dataset_info(request, dataset_id):
    """
    Vue pour récupérer des informations détaillées d'un dataset pour l'afficher dans la visualisation.
    """
    print(f"Requête reçue pour obtenir les infos du dataset : {dataset_id}")
    try:
        # Récupérer le projet contenant le dataset
        project = Project.objects.get(datasets__id=dataset_id)
        print(f"Projet trouvé : {project.name}")

        dataset = next(ds for ds in project.datasets if str(ds.id) == dataset_id)
        print(f"Dataset trouvé : {dataset.name}")

        # Construire les données pour la réponse
        data = {
            "rows_count": len(dataset.data),  # Remplacez par la méthode réelle pour compter les lignes
            "columns": list(dataset.columns.keys()),  # Assurez-vous que columns est un dict
            "preview": dataset.data[:5]  # Les 5 premières lignes du dataset
        }

        print("Données retournées :", data)
        return JsonResponse({"success": True, "data": data})

    except Project.DoesNotExist:
        print("Projet ou dataset introuvable")
        return JsonResponse({"success": False, "error": "Projet ou dataset introuvable."}, status=404)

    except Exception as e:
        print(f"Erreur dans get_dataset_info : {e}")
        return JsonResponse({"success": False, "error": "Une erreur est survenue."}, status=500)


def get_full_dataset(request, dataset_id):
    try:
        print(f"Requête reçue pour le dataset complet avec ID : {dataset_id}")
        project = Project.objects.get(datasets__id=dataset_id)
        dataset = next(ds for ds in project.datasets if str(ds.id) == dataset_id)

        # Préparer les données pour la réponse JSON
        data = {
            "success": True,
            "columns": [col.name for col in dataset.columns],
            "rows": [
                {col.name: col.values[i] for col in dataset.columns}
                for i in range(len(dataset.columns[0].values))
            ]  # Toutes les lignes
        }

        print(f"Données renvoyées : {data}")
        return JsonResponse(data)
    except Exception as e:
        print(f"Erreur lors du traitement de la requête pour {dataset_id}: {e}")
        return JsonResponse({"success": False, "error": str(e)})


@csrf_exempt
def delete_column(request, dataset_id):
    """
    Vue pour supprimer une ou plusieurs colonnes d'un dataset spécifique.
    """
    if request.method == "POST":
        try:
            # Convertir en ObjectId si nécessaire
            try:
                dataset_object_id = ObjectId(dataset_id)
            except Exception as e:
                return JsonResponse({"success": False, "error": "L'ID du dataset n'est pas un ObjectId valide."}, status=400)

            # Récupérer le projet contenant le dataset
            project = Project.objects.get(datasets__id=dataset_object_id)
            dataset = next(ds for ds in project.datasets if str(ds.id) == dataset_id)

            # Charger le corps de la requête
            body = json.loads(request.body)
            columns_to_delete = body.get("columns", [])

            if not columns_to_delete:
                return JsonResponse({"success": False, "error": "Aucune colonne spécifiée."}, status=400)

            # Vérifier si les colonnes existent
            column_names = [col.name for col in dataset.columns]
            invalid_columns = [col for col in columns_to_delete if col not in column_names]

            if invalid_columns:
                return JsonResponse({"success": False, "error": f"Colonnes invalides : {', '.join(invalid_columns)}"}, status=404)

            # Supprimer les colonnes
            dataset.columns = [col for col in dataset.columns if col.name not in columns_to_delete]

            # Sauvegarder le projet après modification
            project.save()

            return JsonResponse({"success": True, "message": f"Colonnes supprimées : {', '.join(columns_to_delete)}"})
        except Project.DoesNotExist:
            return JsonResponse({"success": False, "error": "Projet ou dataset non trouvé."}, status=404)
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)

    return JsonResponse({"success": False, "error": "Méthode non autorisée."}, status=405)
