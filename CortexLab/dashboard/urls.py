from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('projets/', views.projets_view, name='projets'),
    path('projets/create/', views.create_project, name='create_project'),
    path('projets/<str:id>/', views.view_project, name='view_project'),
    path('projets/<str:id>/analyze_data/', views.analyze_data, name='analyze_data'),
    path('projets/<str:id>/set_target/', views.set_target, name='set_target'),
    path('projets/<str:id>/set_features/', views.set_features, name='set_features'),
    path('projets/<str:id>/set_model_type/', views.set_model_type, name='set_model_type'),
    path('projets/<str:id>/delete_dataset/', views.delete_dataset, name='delete_dataset'),
    path('projets/<str:id>/prepare_analyze/', views.prepare_analyze, name='prepare_analyze'),
    path('projets/<str:id>/update_selected_datasets/', views.update_selected_datasets, name='update_selected_datasets'),

]
