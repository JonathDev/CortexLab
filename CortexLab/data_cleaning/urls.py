from django.urls import path
from . import views

app_name = 'data_cleaning'

urlpatterns = [
    path('', views.analyze_home, name='analyze_home'),
    path('dataset/<str:dataset_id>/', views.dataset_detail, name='dataset_detail'),
]
