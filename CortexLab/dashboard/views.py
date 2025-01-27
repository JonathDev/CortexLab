from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, Http404
from django.urls import reverse
from django.utils import timezone
from .models import Project, Dataset
from .forms import ProjectForm
from .utils import validate_and_prepare_dataset, delete_dataset_from_project
from bson import ObjectId
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages


@login_required
def projets_view(request):
    projects = Project.objects(user_id=str(request.user.id))
    return render(request, 'dashboard/projets.html', {'projects': projects})


@login_required
def create_project(request):
    if request.method == 'POST':
        form = ProjectForm(request.POST)
        if form.is_valid():
            project = Project(
                user_id=str(request.user.id),
                name=form.cleaned_data['name'],
                description=form.cleaned_data.get('description', ''),
                created_at=timezone.now()
            )
            project.save()
            return redirect('dashboard:view_project', id=str(project.id))
    else:
        form = ProjectForm()

    return render(request, 'dashboard/create_projet.html', {'form': form})


@login_required
def view_project(request, id):
    try:
        project = Project.objects.get(id=ObjectId(id), user_id=str(request.user.id))
    except Project.DoesNotExist:
        raise Http404("Projet non trouvé")

    return render(request, "dashboard/view_project.html", {"project": project})


@csrf_exempt
@login_required
def analyze_data(request, id):
    print("La fonction `analyze_data` est appelée.")  # Log
    if request.method == "POST" and 'file' in request.FILES:
        try:
            # Récupérer le projet
            project = Project.objects.get(id=ObjectId(id), user_id=str(request.user.id))
        except Project.DoesNotExist:
            messages.error(request, "Projet non trouvé.")
            return redirect(reverse('dashboard:view_project', args=[id]))
        
        file = request.FILES['file']
        dataset_name = request.POST.get('dataset_name', file.name)

        try:
            # Validation et préparation du dataset
            dataset_data = validate_and_prepare_dataset(file, dataset_name)
        except ValueError as e:
            messages.error(request, f"Erreur dans le dataset : {str(e)}")
            return redirect(reverse('dashboard:view_project', args=[id]))

        # Ajouter le dataset au projet
        try:
            new_dataset = Dataset(**dataset_data)
            project.datasets.append(new_dataset)
            project.save()
        except Exception as e:
            messages.error(request, f"Erreur lors de l'enregistrement du dataset : {str(e)}")
            return redirect(reverse('dashboard:view_project', args=[id]))

        # Réponse JSON en cas de succès
        messages.success(request, "Dataset ajouté avec succès.")
        # Rester sur la même page après succès
        return redirect(reverse('dashboard:view_project', args=[id]))

    messages.error(request, "Requête invalide.")
    return redirect(reverse('dashboard:view_project', args=[id]))



@csrf_exempt
@login_required
def delete_dataset(request, id):
    """
    Supprime un dataset spécifique du projet et recharge la page.
    """
    if request.method == "POST":
        dataset_id = request.POST.get("dataset_id")
        if not dataset_id:
            messages.error(request, "ID du dataset manquant")
            return redirect('dashboard:view_project', id=id)

        try:
            delete_dataset_from_project(id, dataset_id)
            messages.success(request, "Dataset supprimé avec succès.")
        except ValueError as e:
            messages.error(request, str(e))

        # Redirection vers la page du projet après suppression
        return redirect('dashboard:view_project', id=id)

    messages.error(request, "Méthode non autorisée.")
    return redirect('dashboard:view_project', id=id)


@login_required
def set_target(request, id):
    if request.method == "POST":
        try:
            project = Project.objects.get(id=ObjectId(id), user_id=str(request.user.id))
        except Project.DoesNotExist:
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        target_name = request.POST.get('target')
        if not target_name:
            return JsonResponse({"error": "Aucune cible sélectionnée."}, status=400)

        column_names = [col.name for col in project.datasets[0].columns]
        if target_name not in column_names:
            return JsonResponse({"error": f"Colonne cible invalide : {target_name}"}, status=400)

        project.target = target_name
        project.save()

        return JsonResponse({"message": "Cible enregistrée avec succès."})

    return JsonResponse({"error": "Méthode non autorisée."}, status=405)


@login_required
def set_features(request, id):
    if request.method == "POST":
        try:
            project = Project.objects.get(id=ObjectId(id), user_id=str(request.user.id))
        except Project.DoesNotExist:
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        selected_features = request.POST.getlist('features')
        if not selected_features:
            return JsonResponse({"error": "Aucune caractéristique sélectionnée."}, status=400)

        column_names = [col.name for col in project.datasets[0].columns]
        invalid_features = [f for f in selected_features if f not in column_names]
        if invalid_features:
            return JsonResponse({"error": f"Colonnes invalides : {invalid_features}"}, status=400)

        project.features = selected_features
        project.save()

        return JsonResponse({"message": "Caractéristiques enregistrées avec succès."})

    return JsonResponse({"error": "Méthode non autorisée."}, status=405)


@login_required
def set_model_type(request, id):
    if request.method == 'POST':
        try:
            project = Project.objects.get(id=ObjectId(id), user_id=str(request.user.id))
        except Project.DoesNotExist:
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        data = json.loads(request.body)
        model_type = data.get('model_type')

        if model_type not in ['clustering', 'regression', 'classification']:
            return JsonResponse({"error": "Type de modèle invalide"}, status=400)

        project.model_type = model_type
        project.save()

        return JsonResponse({"message": "Type de modèle enregistré avec succès."})

    return JsonResponse({"error": "Méthode non autorisée."}, status=405)


@login_required
def prepare_analyze(request, id):
    print('function : prepare_analyse')
    if request.method == "POST":
        data = json.loads(request.body)
        selected_datasets = data.get("selected_datasets", [])
        request.session["current_project_id"] = id
        request.session["selected_datasets"] = selected_datasets
        request.session.modified = True  # Important pour sauvegarder la session
        print(f"Session updated: project_id={id}, selected_datasets={selected_datasets}")
        return JsonResponse({"redirect_url": "/data_cleaning/analyze/"})
    return JsonResponse({"error": "Méthode non autorisée."}, status=405)

@csrf_exempt
@login_required
def update_selected_datasets(request, id):
    print('fucntion udupdate_selected_datasets')
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            print(data)
            selected_datasets = data.get("selected_datasets", [])
            print(selected_datasets)
            # Mettre à jour la session avec les datasets sélectionnés
            request.session["selected_datasets"] = selected_datasets
            request.session.modified = True  # Marquer la session comme modifiée
            return JsonResponse({"message": "Datasets sélectionnés mis à jour."})
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de la mise à jour : {str(e)}"}, status=400)
    return JsonResponse({"error": "Méthode non autorisée."}, status=405)