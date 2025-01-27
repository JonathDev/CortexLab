from django.urls import path
from .views import inscription_view, ConnexionView, DeconnexionView


app_name = 'accounts'

urlpatterns = [
    path('inscription/', inscription_view, name='inscription'),
    path('connexion/', ConnexionView, name='connexion'),
    path('deconnexion/', DeconnexionView.as_view(), name='deconnexion'),
]