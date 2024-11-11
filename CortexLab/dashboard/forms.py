# dashboard/forms.py

from django import forms

class ProjectForm(forms.Form):
    name = forms.CharField(max_length=255, label='Nom du Projet')
    model_type = forms.ChoiceField(choices=[
        ('clustering', 'Clustering'),
        ('regression', 'Régression'),
        ('classification', 'Classification'),
    ], label='Type de Modèle')
