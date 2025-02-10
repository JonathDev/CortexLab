from django.urls import path
from . import views  # Import correct des vues

# Nom de l'application pour la gestion des datasets
app_name = 'data_cleaning'

# Définition des routes et des vues associées
urlpatterns = [
    path("get_selected_datasets/", views.get_selected_datasets, name="get_selected_datasets"),
    path("analyze/", views.analyze_home, name="analyze_home"), 
    path("load_dataset/<str:dataset_id>/", views.load_dataset, name="load_dataset"),
    path("get_column_type/<str:dataset_id>/", views.get_column_type_view, name="get_column_type"),
    path("apply_filter/<str:dataset_id>/", views.apply_filter, name="apply_filter"),
]
