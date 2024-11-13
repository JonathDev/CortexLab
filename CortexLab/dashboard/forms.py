# dashboard/forms.py
from django import forms

class ProjectForm(forms.Form):
    name = forms.CharField(max_length=255, label='Nom du Projet')
    model_type = forms.ChoiceField(choices=[
        ('clustering', 'Clustering'),
        ('regression', 'Régression'),
        ('classification', 'Classification'),
    ], label='Type de Modèle')
    description = forms.CharField(
        max_length=255,
        label='Description',
        required=False,
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': 'Ajoutez une description du projet (facultatif)'})
    )
