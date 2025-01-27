import pandas as pd
from .models import ColumnData
from bson import ObjectId


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


def validate_and_prepare_dataset(file, dataset_name):
    df, error = load_data(file)
    if error:
        raise ValueError(error)

    columns = [
        ColumnData(name=col, values=df[col].tolist()) for col in df.columns
    ]

    return {
        "name": dataset_name,
        "columns": columns,
        "uploaded_at": pd.Timestamp.now(),
    }


def delete_dataset_from_project(project_id, dataset_id):
    from .models import Project
    try:
        project = Project.objects.get(id=ObjectId(project_id))
        project.datasets = [ds for ds in project.datasets if ds.id != dataset_id]
        project.save()
    except Project.DoesNotExist:
        raise ValueError("Projet introuvable.")
