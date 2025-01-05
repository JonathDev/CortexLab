from django.shortcuts import render, redirect, get_object_or_404
from bson import ObjectId
from django.http import JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .forms import ProjectForm
from .models import ColumnData, Project, Dataset
from .utils import load_data, get_columns, load_data_from_project, save_features_with_data, save_target, save_features, save_model_type, save_target_with_data, validate_dataset,delete_dataset_from_project 
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.contrib import messages
import pandas as pd 


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

    context = {
        'project': project,
        'datasets': project.datasets  # Inclure les datasets dans le contexte
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
    # Ajout des logs pour déboguer
    print(f"Requête reçue dans analyze_data : {request.method}")
    print(f"Contenu de FILES : {request.FILES}")
    print(f"Contenu de POST : {request.POST}")

    if request.method == "POST" and 'file' in request.FILES:
        file = request.FILES["file"]
        print(f"Fichier reçu : {file.name}")  # Log du fichier reçu
        
        # Charger les données depuis le fichier
        df_new, error = load_data(file)
        if error:
            print(f"Erreur de chargement du fichier : {error}")
            return JsonResponse({"error": error}, status=400)

        try:
            project = Project.objects.get(id=ObjectId(id))
            print(f"Projet trouvé : {project.name}")  # Log du projet trouvé
        except Project.DoesNotExist:
            print("Erreur : Projet non trouvé")
            return JsonResponse({"error": "Projet non trouvé."}, status=404)

        # Récupérer le nom du dataset depuis le formulaire ou utiliser le nom du fichier
        dataset_name = request.POST.get('dataset_name', file.name)
        print(f"Nom du dataset : {dataset_name}")  # Log du nom du dataset
        
        # Préparer les colonnes pour le dataset
        column_data = [
            ColumnData(name=col, values=df_new[col].tolist()) for col in df_new.columns
        ]
        print(f"Colonnes du dataset : {column_data}")  # Log des colonnes

        new_dataset = Dataset(
            name=dataset_name,
            columns=column_data,
            uploaded_at=timezone.now()
        )

        # Ajouter la validation ici
        try:
            validate_dataset(new_dataset)  # Validation du dataset
            print("Validation réussie")  # Log si validation réussie
            project.datasets.append(new_dataset)  # Ajouter au projet si validé
        except ValueError as e:
            print(f"Erreur de validation : {str(e)}")  # Log de l'erreur de validation
            return JsonResponse({"error": str(e)}, status=400)

        # Sauvegarder le projet
        try:
            project.save()
            print(f"Projet enregistré dans MongoDB : {project.id}")  # Log de l'enregistrement
        except Exception as e:
            print(f"Erreur lors de l'enregistrement : {e}")  # Log de l'erreur d'enregistrement
            return JsonResponse({"error": "Erreur lors de l'enregistrement."}, status=500)

        # Retourner les données du nouveau dataset
        column_names = [col.name for col in column_data]
        return JsonResponse({
            "dataset": {
                "id": new_dataset.id,
                "name": new_dataset.name,
                "columns": column_names,
                "uploaded_at": new_dataset.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
        })

    print("Erreur : Aucun fichier fourni ou requête invalide")
    return JsonResponse({"error": "Aucun fichier fourni ou requête invalide."}, status=400)



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

    return JsonResponse({"message": "Requête non autorisée"}, status=405)return JsonResponse({
    "dataset": {
        "id": new_dataset.id,  # Retourner l'ID unique
        "name": new_dataset.name,
        "columns": column_names,
        "uploaded_at": new_dataset.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
    }
})
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

@csrf_exempt
@login_required
def delete_dataset(request, id):
    print("Requête reçue pour supprimer un dataset")

    if request.method == "POST":
        try:
            dataset_id = request.POST.get("dataset_id")  # Récupérer l'ID du dataset
            print(f"ID du dataset reçu : {dataset_id}")

            if not dataset_id:
                return JsonResponse({"error": "ID du dataset manquant"}, status=400)

            # Récupérer le projet
            project = Project.objects.get(id=ObjectId(id))
            print(f"Projet trouvé : {project.name}")

            # Filtrer et supprimer le dataset
            initial_length = len(project.datasets)
            project.datasets = [ds for ds in project.datasets if ds.id != dataset_id]

            if len(project.datasets) == initial_length:
                print("Dataset introuvable.")
                return JsonResponse({"error": "Dataset introuvable"}, status=404)

            # Sauvegarder le projet après suppression
            project.save()
            print(f"Dataset {dataset_id} supprimé avec succès.")
            return JsonResponse({"message": "Dataset supprimé avec succès"})

        except Project.DoesNotExist:
            return JsonResponse({"error": "Projet non trouvé"}, status=404)
        except Exception as e:
            print(f"Erreur inattendue : {e}")
            return JsonResponse({"error": "Erreur interne"}, status=500)

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)



@csrf_exempt
def save_selected_datasets(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        request.session['selected_datasets'] = data.get('datasets', [])
        return JsonResponse({'message': 'Datasets enregistrés avec succès'})
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)
