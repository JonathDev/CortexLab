"""
from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dashboard'

"""
# dashboard/apps.py

from django.apps import AppConfig
from django.conf import settings
from mongoengine import connect

class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dashboard'
    label = 'dashboard_app'

    def ready(self):
        db_settings = settings.MONGODB_SETTINGS
        connect(
            db=db_settings['db'],
            host=db_settings['host'],
            port=db_settings['port'],
            username=db_settings.get('username'),
            password=db_settings.get('password'),
            authentication_source=db_settings.get('authentication_source', 'admin'),
            alias='default'
        )
