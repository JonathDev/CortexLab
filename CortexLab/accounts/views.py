
from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import InscriptionForm
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import reverse_lazy

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .forms import InscriptionForm, ConnexionForm
from dashboard.models import Project


def inscription_view(request):
    if request.method == 'POST':
        form = InscriptionForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Connexion automatique après l'inscription
            return redirect('main:dashboard_home') # Rediriger vers le tableau de bord ou la page souhaitée
    else:
        form = InscriptionForm()
    return render(request, 'accounts/inscription.html', {'form': form})






def ConnexionView(request):
    if request.method == 'POST':
        form = ConnexionForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']

            # Authentifier l'utilisateur
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                # L'utilisateur est authentifié, on le connecte et on démarre la session
                login(request, user)  # Django gère la session automatiquement

                # Optionnel : Ajouter un message de bienvenue
                #messages.success(request, f"Bienvenue {user.username} !")

                # Rediriger vers la page des projets ou vers une autre page
                return redirect('dashboard:projets')  # Remplace par l'URL de ton choix
            else:
                # L'utilisateur n'est pas trouvé ou le mot de passe est incorrect
                form.add_error(None, "Nom d'utilisateur ou mot de passe incorrect.")
    else:
        form = ConnexionForm()

    return render(request, 'accounts/connexion.html', {'form': form})
  

class DeconnexionView(LogoutView):
    next_page = 'accounts:connexion'  # Rediriger vers la page de connexion après la déconnexion