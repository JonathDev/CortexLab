from django.shortcuts import render, redirect, get_object_or_404
from bson import ObjectId
from django.http import JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .forms import ProjectForm
from .models import Project
from .utils import load_data, get_columns, save_target, save_features, save_model_type
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json


@login_required
def projets_view(request):
    projects = Project.objects(user_id=str(request.user.id))
    return render(request, 'dashboard/projets.html', {'projects': projects})

@login_required
def create_project(request):
    # Réinitialiser les colonnes en session
    request.session.pop('columns', None)

    if request.method == 'POST':
        form = ProjectForm(request.POST)
        if form.is_valid():
            try:
                project = Project(
                    user_id=str(request.user.id),
                    name=form.cleaned_data['name'],
                    description=form.cleaned_data.get('description', ''),
                    created_at=timezone.now()
                )
                project.save()
                return redirect('dashboard:view_project', id=str(project.id))
            except Exception as e:
                form.add_error(None, f"Erreur lors de la création du projet : {str(e)}")
    else:
        form = ProjectForm()

    return render(request, 'dashboard/create_projet.html', {'form': form})



@login_required
def view_project(request, id):
    try:
        project = Project.objects.get(id=ObjectId(id))
    except Project.DoesNotExist:
        raise Http404("Projet non trouvé")

    context = {
        'project': project,
        'target': project.target.get('name') if project.target else None,
        'features': list(project.features.keys()) if project.features else None,
        'columns': project.columns,  # Charger les colonnes sauvegardées
    }
    return render(request, 'dashboard/view_project.html', context)

"""
@login_required
def view_project(request, id):
    try:
        project = Project.objects.get(id=ObjectId(id))
    except Project.DoesNotExist:
        raise Http404("Projet non trouvé")

    # Effacer les données de session pour éviter des conflits entre les projets
    if 'columns' not in request.session:
        request.session['columns'] = None

    context = {
        'project': project,
        'target': project.target.get('name') if project.target else None,
        'features': list(project.features.keys()) if project.features else None,
        'columns': request.session.get('columns')  # Charger les colonnes de la session
    }
    return render(request, 'dashboard/view_project.html', context)
"""
"""
@csrf_exempt
@login_required
def analyze_data(request, id):
    if request.method == "POST" and 'file' in request.FILES:
        file = request.FILES["file"]
        df, error = load_data(file)
        if error:
            return JsonResponse({"error": error}, status=400)

        # Mettre à jour la session uniquement avec les nouvelles colonnes détectées
        columns = get_columns(df)
        request.session['columns'] = columns  # Met à jour les colonnes dans la session
        return JsonResponse({"columns": columns})

    return JsonResponse({"error": "Aucun fichier fourni."}, status=400)
"""

@csrf_exempt
@login_required
def analyze_data(request, id):
    if request.method == "POST" and 'file' in request.FILES:
        file = request.FILES["file"]
        df, error = load_data(file)
        if error:
            return JsonResponse({"error": error}, status=400)

        columns = get_columns(df)  # Obtenez les colonnes du fichier
        request.session['columns'] = columns  # Sauvegarde dans la session (optionnel)

        try:
            # Mettre à jour les colonnes dans la base de données
            project = Project.objects.get(id=ObjectId(id))
            project.columns = columns
            project.save()
        except Project.DoesNotExist:
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        return JsonResponse({"columns": columns})

    return JsonResponse({"error": "Aucun fichier fourni."}, status=400)


@csrf_exempt
def set_target(request, id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=403)
    
    if request.method == "POST":
        try:
            project = Project.objects.get(id=ObjectId(id))
        except Project.DoesNotExist:
            raise Http404("Projet non trouvé")

        selected_target = request.POST.get('target')
        if selected_target and selected_target in request.session.get('columns', []):
            save_target(project, selected_target)
            return JsonResponse({"message": "Target définie avec succès."})
        return JsonResponse({"error": "Colonne cible non valide."}, status=400)


@csrf_exempt
def set_features(request, id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=403)
    
    if request.method == "POST":
        try:
            project = Project.objects.get(id=ObjectId(id))
        except Project.DoesNotExist:
            raise Http404("Projet non trouvé")

        selected_features = request.POST.getlist('features')
        valid_features = [f for f in selected_features if f in request.session.get('columns', [])]
        if valid_features:
            save_features(project, valid_features)
            return JsonResponse({"message": "Features définies avec succès."})
        return JsonResponse({"error": "Features non valides."}, status=400)
"""    
@login_required
def set_model_type(request, id):
    if request.method == 'POST':
        try:
            project = Project.objects.get(id=ObjectId(id))
        except Project.DoesNotExist:
            return JsonResponse({"message": "Projet non trouvé"}, status=404)

        # Récupérer le type de modèle depuis le corps de la requête
        try:
            data = json.loads(request.body)
            model_type = data.get('model_type')
        except json.JSONDecodeError:
            return JsonResponse({"message": "Requête invalide"}, status=400)

        # Valider le type de modèle
        if model_type not in ['clustering', 'regression', 'classification']:
            return JsonResponse({"message": "Type de modèle invalide"}, status=400)

        # Sauvegarder le type de modèle
        save_model_type(project, model_type)
        return JsonResponse({"message": "Type de modèle enregistré avec succès"})

    return JsonResponse({"message": "Requête non autorisée"}, status=405)
"""

@login_required
def set_model_type(request, id):
    if request.method == 'POST':
        try:
            project = Project.objects.get(id=ObjectId(id))
        except Project.DoesNotExist:
            return JsonResponse({"message": "Projet non trouvé"}, status=404)

        # Récupérer le type de modèle depuis le corps de la requête
        try:
            data = json.loads(request.body)
            model_type = data.get('model_type')
        except json.JSONDecodeError:
            return JsonResponse({"message": "Requête invalide"}, status=400)

        # Valider le type de modèle
        if model_type not in ['clustering', 'regression', 'classification']:
            return JsonResponse({"message": "Type de modèle invalide"}, status=400)

        # Sauvegarder le type de modèle sans modifier les colonnes
        project.model_type = model_type
        project.save()

        return JsonResponse({"message": "Type de modèle enregistré avec succès"})
