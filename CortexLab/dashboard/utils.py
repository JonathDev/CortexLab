import pandas as pd
from .models import Project
from django.http import JsonResponse

def load_data(file):
    try:
        if file.name.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.name.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file)
        else:
            return None, "Type de fichier non supporté."
        return df, None
    except Exception as e:
        return None, str(e)

def get_columns(df):
    return df.columns.tolist()

def set_target(project, target_name):
    project.target = {'name': target_name}
    project.save()

def set_features(project, features_list):
    project.features = {feature: None for feature in features_list}
    project.save()
