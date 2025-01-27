# dashboard/forms.py
from django import forms


class ProjectForm(forms.Form):
    name = forms.CharField(max_length=255, label='Nom du Projet', required=True)
    description = forms.CharField(
        max_length=255,
        label='Description',
        required=False,
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': 'Ajoutez une description du projet (facultatif)'})
    )
