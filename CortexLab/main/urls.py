from django.urls import path

from .views import base_view, dashboard_home

app_name = 'main'

urlpatterns = [
    path('', base_view, name='base'),
    path('dashboard/', dashboard_home, name='dashboard_home'),  # URL de tableau de bord
]