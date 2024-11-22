from django.shortcuts import render, redirect, get_object_or_404
from bson import ObjectId
from django.http import JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .forms import ProjectForm
from .models import ColumnData, Project
from .utils import load_data, get_columns, load_data_from_project, save_features_with_data, save_target, save_features, save_model_type, save_target_with_data
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.contrib import messages


@login_required
def projets_view(request):
    projects = Project.objects(user_id=str(request.user.id))  # Assurez-vous d'utiliser le bon champ pour le filtrage
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

    # Préparer les données pour les 5 premières lignes
    dataset_preview = []
    if project.columns:
        max_rows = 5
        for i in range(max_rows):
            row = [col.values[i] if len(col.values) > i else "-" for col in project.columns]
            dataset_preview.append(row)

    context = {
        'project': project,
        'target': project.target if project.target else None,
        'features': project.features if project.features else [],
        'columns': project.columns,
        'dataset_preview': dataset_preview,  # Données préparées pour le tableau
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
        df, error = load_data(file)  # Votre fonction pour charger le fichier dans un DataFrame
        if error:
            print(f"Erreur lors du chargement des données : {error}")
            return JsonResponse({"error": error}, status=400)

        try:
            project = Project.objects.get(id=ObjectId(id))
        except Project.DoesNotExist:
            print("Projet non trouvé.")
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        # Convertir les colonnes en ColumnData
        column_data = []
        for col in df.columns:
            column_data.append(ColumnData(name=col, values=df[col].tolist()))
        print(f"Colonnes détectées : {[col.name for col in column_data]}")

        # Enregistrer les colonnes dans le projet
        project.columns = column_data
        project.save()

        # Retourner une réponse JSON avec les colonnes
        column_names = [col.name for col in column_data]
        return JsonResponse({"columns": column_names})

    print("Aucun fichier fourni.")
    return JsonResponse({"error": "Aucun fichier fourni."}, status=400)




@csrf_exempt
@login_required
def set_target(request, id):
    if request.method == "POST":
        try:
            project = Project.objects.get(id=ObjectId(id))
        except Project.DoesNotExist:
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        target_name = request.POST.get('target')
        if not target_name:
            return JsonResponse({"error": "Aucune cible sélectionnée."}, status=400)

        # Vérifier si la colonne existe
        column_names = [col.name for col in project.columns]
        if target_name not in column_names:
            return JsonResponse({"error": f"Colonne cible invalide : {target_name}"}, status=400)

        # Enregistrer la cible
        try:
            project.target = target_name
            project.save()
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de l'enregistrement de la cible : {str(e)}"}, status=500)

        return JsonResponse({"message": "Target enregistrée avec succès."})




@csrf_exempt
@login_required
def set_features(request, id):
    if request.method == "POST":
        try:
            project = Project.objects.get(id=ObjectId(id))
        except Project.DoesNotExist:
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        selected_features = request.POST.getlist('features')
        if not selected_features:
            return JsonResponse({"error": "Aucune caractéristique sélectionnée."}, status=400)

        # Vérifier si les colonnes existent
        column_names = [col.name for col in project.columns]
        invalid_features = [f for f in selected_features if f not in column_names]
        if invalid_features:
            return JsonResponse({"error": f"Colonnes invalides : {invalid_features}"}, status=400)

        # Enregistrer les features
        try:
            project.features = selected_features
            project.save()
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de l'enregistrement des caractéristiques : {str(e)}"}, status=500)

        return JsonResponse({"message": "Features enregistrées avec succès."})


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
