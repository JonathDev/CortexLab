from django.shortcuts import render, redirect, get_object_or_404
from bson import ObjectId
from django.http import JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .forms import ProjectForm
from .models import Project
from .utils import load_data, get_columns, set_target, set_features

from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

@login_required
def create_project(request):
    if request.method == 'POST':
        form = ProjectForm(request.POST)
        if form.is_valid():
            project = Project(
                user_id=str(request.user.id),
                name=form.cleaned_data['name'],
                model_type=form.cleaned_data['model_type'],
                created_at=timezone.now()
            )
            project.save()
            return redirect('dashboard:projets')
    else:
        form = ProjectForm()
    return render(request, 'dashboard/create_projet.html', {'form': form})

@login_required
def projets_view(request):
    projects = Project.objects(user_id=str(request.user.id))
    return render(request, 'dashboard/projets.html', {'projects': projects})

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
        'columns': request.session.get('columns')  # Charger les colonnes de la session si disponibles
    }
    return render(request, 'dashboard/view_project.html', context)

@csrf_exempt
@login_required
def analyze_data(request, id):
    if request.method == "POST" and 'file' in request.FILES:
        file = request.FILES["file"]
        df, error = load_data(file)
        if error:
            return JsonResponse({"error": error}, status=400)
        
        columns = get_columns(df)
        request.session['columns'] = columns  # Stocke les colonnes dans la session
        return JsonResponse({"columns": columns})
    
    return JsonResponse({"error": "Aucun fichier fourni."}, status=400)

@csrf_exempt
@login_required
def set_target(request, id):
    if request.method == "POST":
        project = get_object_or_404(Project, id=ObjectId(id))
        selected_target = request.POST.get('target')
        if selected_target and selected_target in request.session.get('columns', []):
            set_target(project, selected_target)
            return JsonResponse({"message": "Target définie avec succès."})
        return JsonResponse({"error": "Colonne cible non valide."}, status=400)

@csrf_exempt
@login_required
def set_features(request, id):
    if request.method == "POST":
        project = get_object_or_404(Project, id=ObjectId(id))
        selected_features = request.POST.getlist('features')
        valid_features = [f for f in selected_features if f in request.session.get('columns', [])]
        if valid_features:
            set_features(project, valid_features)
            return JsonResponse({"message": "Features définies avec succès."})
        return JsonResponse({"error": "Features non valides."}, status=400)
