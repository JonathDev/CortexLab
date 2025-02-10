import pandas as pd
from datetime import datetime
import numpy as np

def get_column_type(dataset, column_name):
    """
    Détecte le type de la colonne (numérique, texte ou date).
    """
    if column_name not in dataset:
        return None, f"Colonne {column_name} non trouvée."

    try:
        # Vérifier si la colonne est numérique
        if pd.api.types.is_numeric_dtype(dataset[column_name]):
            return "numérique", None
        # Vérifier si la colonne est de type date
        elif pd.api.types.is_datetime64_any_dtype(dataset[column_name]):
            return "date", None
        # Sinon, c'est une colonne texte
        else:
            return "texte", None
    except Exception as e:
        return None, f"Erreur lors de la détection du type de colonne : {str(e)}"


def filter_numeric(dataset, column_name, condition, value):
    """
    Filtre une colonne numérique selon une condition (<, <=, >, >=, ==).
    """
    if column_name not in dataset:
        return dataset, f"Colonne {column_name} non trouvée."

    try:
        value = float(value)  # Convertir en nombre pour la comparaison
        if condition == "<":
            dataset = dataset[dataset[column_name] < value]
        elif condition == "<=":
            dataset = dataset[dataset[column_name] <= value]
        elif condition == ">":
            dataset = dataset[dataset[column_name] > value]
        elif condition == ">=":
            dataset = dataset[dataset[column_name] >= value]
        elif condition == "==":
            dataset = dataset[dataset[column_name] == value]
        else:
            return dataset, f"Condition invalide : {condition}"
    except ValueError:
        return dataset, "Valeur non valide pour une colonne numérique."
    
    return dataset, "Filtrage numérique appliqué."


def filter_date(dataset, column_name, condition, date_value):
    """
    Filtre une colonne de type date selon une condition (avant/après une date).
    """
    if column_name not in dataset:
        return dataset, f"Colonne {column_name} non trouvée."

    try:
        date_value = pd.to_datetime(date_value)  # Convertir en objet datetime
        dataset[column_name] = pd.to_datetime(dataset[column_name])  # Assurer le format datetime
        if condition == "before":
            dataset = dataset[dataset[column_name] < date_value]
        elif condition == "after":
            dataset = dataset[dataset[column_name] > date_value]
        else:
            return dataset, f"Condition invalide : {condition}"
    except Exception as e:
        return dataset, f"Erreur lors du filtrage des dates : {str(e)}"

    return dataset, "Filtrage des dates appliqué."


def filter_text(dataset, column_name, search_value):
    """
    Filtre une colonne de type texte contenant une valeur spécifique.
    """
    if column_name not in dataset:
        return dataset, f"Colonne {column_name} non trouvée."

    try:
        dataset = dataset[dataset[column_name].astype(str).str.contains(str(search_value), case=False, na=False)]
    except Exception as e:
        return dataset, f"Erreur lors du filtrage texte : {str(e)}"

    return dataset, "Filtrage texte appliqué."


def apply_filter(dataset, column_name, filter_type, condition=None, value=None):
    """
    Applique le filtre correspondant au type de colonne.
    """
    column_type, error = get_column_type(dataset, column_name)
    if error:
        return dataset, error

    if column_type == "numérique" and condition and value is not None:
        return filter_numeric(dataset, column_name, condition, value)
    elif column_type == "date" and condition and value is not None:
        return filter_date(dataset, column_name, condition, value)
    elif column_type == "texte" and value is not None:
        return filter_text(dataset, column_name, value)
    else:
        return dataset, "Type de colonne ou paramètres de filtrage invalides."
    
def preprocess_missing_values(dataset, column_name):
    if column_name in dataset:
        dataset[column_name] = dataset[column_name].replace(["N/A", "", None], np.nan)
    return dataset
