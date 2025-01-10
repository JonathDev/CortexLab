from django.urls import path
from . import views

# Nom de l'application pour la gestion des datasets
app_name = 'data_cleaning'

# Définition des routes et des vues associées
urlpatterns = [
    # Vue principale pour l'analyse et la gestion des datasets
    path('', views.analyze_home, name='analyze_home'),
    
    # Vue pour récupérer les détails d'un dataset spécifique
    path('dataset/<str:dataset_id>/', views.dataset_detail, name='dataset_detail'),
    
    # Vue pour obtenir des informations générales sur un dataset
    #path('get_dataset_info/<str:dataset_id>/', views.get_dataset_info, name='get_dataset_info'),
    
    # Vue pour récupérer toutes les données d'un dataset
    #path('dataset/full/<str:dataset_id>/', views.get_full_dataset, name='get_full_dataset'),
    
    # Vue pour supprimer des colonnes d'un dataset
    path('dataset/<str:dataset_id>/delete_column/', views.delete_column, name='delete_columns'),

     # Vue pour gerer les valeurs manquantes d'un dataset
    path('dataset/<str:dataset_id>/manage_missing_values/', views.manage_missing_values, name='manage_missing_values'),


]
