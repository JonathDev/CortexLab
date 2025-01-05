from django.urls import path
from . import views

app_name = 'data_cleaning'

urlpatterns = [
    path('', views.analyze_home, name='analyze_home'),
    path('dataset/<str:dataset_id>/', views.dataset_detail, name='dataset_detail'),
    path('get_dataset_info/<str:dataset_id>/', views.get_dataset_info, name='get_dataset_info'),
    path('dataset/full/<str:dataset_id>/', views.get_full_dataset, name='get_full_dataset'),
]
