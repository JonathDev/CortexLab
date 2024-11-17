from django.contrib.admin import AdminSite
from django.urls import path
from django.shortcuts import render
from .models import Project
import logging


from django.http import HttpResponse

def test_view(request):
    return HttpResponse("Mongo Admin fonctionne")

logger = logging.getLogger(__name__)

class MongoAdminSite(AdminSite):
    site_header = "MongoDB Admin"
    site_title = "Gestion MongoDB"
    index_title = "Bienvenue dans l'interface MongoDB"

    def get_urls(self):
        logger.info("Appel à get_urls dans MongoAdminSite")
        urls = super().get_urls()
        custom_urls = [
            path('test/', self.admin_view(test_view), name='test_view'),  # Vue de test
            path('projects/', self.admin_view(self.project_list), name='mongo_projects'),
        ]
        return custom_urls + urls
    

    def has_permission(self, request):
        # Permettre l'accès à tous les utilisateurs authentifiés
        logger.info(f"Utilisateur : {request.user.username}, Staff : {request.user.is_staff}")
        return request.user.is_staff


    def project_list(self, request):
        projects = Project.objects.all()
        logger.info(f"Projets récupérés : {projects.count()}")  # Vérifie le nombre de projets
        return render(request, 'mongo_admin/project_list.html', {'projects': projects})

mongo_admin_site = MongoAdminSite(name='mongo_admin')
