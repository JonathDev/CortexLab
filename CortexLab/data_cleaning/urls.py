from django.urls import path
from . import views  # Import correct des vues

# Nom de l'application pour la gestion des datasets
app_name = 'data_cleaning'

# Définition des routes et des vues associées
urlpatterns = [
    path("analyze/", views.analyze_home, name="analyze_home"), 
    path("load_dataset/<str:dataset_id>/", views.load_dataset, name="load_dataset"),
    path("get_column_type/<str:dataset_id>/", views.get_column_type_view, name="get_column_type"),
    path('get_unique_values/<str:dataset_id>/', views.get_unique_values, name='get_unique_values'),
    path("get_filtered_values/<str:dataset_id>/", views.get_filtered_values, name="get_filtered_values"),


    
    #path("get_selected_datasets/", views.get_selected_datasets, name="get_selected_datasets"),
    

    
    #path('get_unique_values/<str:dataset_id>/', views.get_unique_values, name='get_unique_values'),
    #path("replace_values/<str:dataset_id>/", views.replace_values, name="replace_values"),
    #path("get_filtered_values/<str:dataset_id>/", views.get_filtered_values, name="get_filtered_values"),
    #path("delete_filtered_values/<str:dataset_id>/", views.delete_filtered_values, name="delete_filtered_values"),

]
