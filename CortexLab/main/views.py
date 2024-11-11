from django.shortcuts import render
from django.contrib.auth.decorators import login_required


def base_view(request):
    return render(request, 'main/base.html')

@login_required
def dashboard_home(request):
    return render(request, 'main/dashboard_home.html')  # Assurez-vous que le template est spécifié ici