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
    path("replace_filtered_values/<str:dataset_id>/", views.replace_filtered_values, name="replace_filtered_values"),
    path('delete_filtered_rows/<str:dataset_id>/', views.delete_filtered_rows, name='delete_filtered_rows'),
    path('delete_column/<str:dataset_id>/', views.delete_column, name='delete_column'),
    path('undo_last_action/<str:dataset_id>/', views.undo_last_action, name='undo_last_action'),


    
    #path("get_selected_datasets/", views.get_selected_datasets, name="get_selected_datasets"),
    

    
    #path('get_unique_values/<str:dataset_id>/', views.get_unique_values, name='get_unique_values'),
    #path("replace_values/<str:dataset_id>/", views.replace_values, name="replace_values"),
    #path("get_filtered_values/<str:dataset_id>/", views.get_filtered_values, name="get_filtered_values"),
    #

]
