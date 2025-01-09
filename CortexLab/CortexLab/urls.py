"""
URL configuration for CortexLab project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from dashboard.mongo_admin import mongo_admin_site
from dashboard.mongo_admin import test_view
import logging

logger = logging.getLogger(__name__)
logger.info("MongoAdminSite chargé avec succès")    

urlpatterns = [
    path('mongo-test/', test_view), 
    path('mongo-admin/', mongo_admin_site.urls),  # Interface MongoDB Admin
    path('admin/', admin.site.urls),  # Interface admin standard
    path('', include('main.urls', namespace='main')),
    path('accounts/', include('accounts.urls', namespace='accounts')),
    path('dashboard/', include('dashboard.urls', namespace='dashboard')),
    path('data_cleaning/', include('data_cleaning.urls', namespace='data_cleaning')),

]