
from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import InscriptionForm
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import reverse_lazy


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




class ConnexionView(LoginView):
        template_name = 'accounts/connexion.html'
        success_url = reverse_lazy('dashboard:dashboard_home')
  

class DeconnexionView(LogoutView):
    next_page = 'accounts:connexion'  # Rediriger vers la page de connexion après la déconnexion