from django.shortcuts import render
from django.http import JsonResponse
from dashboard.models import Project, Dataset
def analyze_home(request):
    """
    Vue principale pour afficher les datasets sélectionnés.
    """
    # Récupérer les IDs transmis dans l'URL
    dataset_ids = request.GET.get('datasets', '').split(',')

    # Récupérer les datasets correspondant aux IDs
    datasets = []
    for project in Project.objects.all():
        for dataset in project.datasets:
            # Comparaison d'ID sous forme de chaîne
            if str(dataset.id) in dataset_ids:
                datasets.append(dataset)

    # Déboguer les datasets récupérés
    print("Datasets récupérés :", datasets)

    # Passer les datasets au template
    context = {'datasets': datasets}
    return render(request, 'data_cleaning/analyze.html', context)




def dataset_detail(request, dataset_id):
    # Parcourir tous les projets pour trouver le dataset avec l'ID correspondant
    for project in Project.objects.all():
        for dataset in project.datasets:
            if str(dataset.id) == dataset_id:
                return JsonResponse({
                    "name": dataset.name,
                    "uploaded_at": dataset.uploaded_at,
                    "columns": [col.name for col in dataset.columns],
                })
    return JsonResponse({"error": "Dataset non trouvé"}, status=404)