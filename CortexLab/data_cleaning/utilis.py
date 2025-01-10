import pandas as pd
import json

def load_dataset(dataset_path):
    """
    Charge un dataset à partir d'un fichier CSV et retourne ses colonnes et un aperçu.
    """
    try:
        df = pd.read_csv(dataset_path)
        print(f"Chargement du dataset depuis {dataset_path}. Aperçu :\n{df.head()}")
        columns = df.columns.tolist()
        preview = df.head(10).to_dict(orient="records")
        return {
            "success": True,
            "columns": columns,
            "rows_count": len(df),
            "preview": preview
        }
    except Exception as e:
        print(f"Erreur lors du chargement du dataset : {e}")
        return {"success": False, "error": str(e)}

def remove_columns(data, columns_to_remove):
    """
    Supprime les colonnes spécifiées d'un DataFrame simulé.
    """
    try:
        print(f"Colonnes avant suppression : {data['columns']}")
        data["columns"] = [col for col in data["columns"] if col not in columns_to_remove]
        data["preview"] = [
            {key: row[key] for key in row if key not in columns_to_remove}
            for row in data["preview"]
        ]
        print(f"Colonnes après suppression : {data['columns']}")
        return data
    except Exception as e:
        print(f"Erreur lors de la suppression des colonnes : {e}")
        raise ValueError(f"Erreur : {e}")

def get_cleaned_preview(data):
    """
    Retourne un aperçu des données nettoyées.
    """
    print(f"Aperçu des données nettoyées : {data['preview']}")
    return data["preview"]

def dataframe_to_json(df):
    """
    Convertit un DataFrame en JSON pour le frontend.
    """
    return {
        "columns": df.columns.tolist(),
        "rows_count": len(df),
        "preview": df.head(10).to_dict(orient="records")
    }


def remove_rows(df, start_line, end_line):
    """
    Supprime les lignes d'un DataFrame selon une plage spécifiée.
    """
    try:
        print(f"Suppression des lignes de {start_line} à {end_line} dans le DataFrame.")
        df = df.drop(df.index[start_line:end_line + 1]).reset_index(drop=True)
        print("DataFrame après suppression des lignes :")
        print(df.head())
        return df
    except Exception as e:
        raise ValueError(f"Erreur lors de la suppression des lignes : {e}")

def remove_missing_values(dataset, axis='rows', threshold=0.5):
    """
    Supprime les lignes ou colonnes contenant des valeurs manquantes au-delà d'un seuil.
    
    Parameters:
        dataset (dict): Dataset au format JSON-like.
        axis (str): 'rows' pour supprimer les lignes, 'columns' pour supprimer les colonnes.
        threshold (float): Proportion maximale de valeurs manquantes tolérées.
    """
    df = pd.DataFrame(dataset["preview"])
    missing_ratio = df.isnull().mean(axis=0 if axis == 'columns' else 1)
    if axis == 'rows':
        df = df[missing_ratio <= threshold]
    elif axis == 'columns':
        df = df.loc[:, missing_ratio <= threshold]
    return dataframe_to_dict(df)

def fill_missing_values(dataset, method='default', value=None, column=None):
    """
    Remplit les valeurs manquantes dans le dataset ou une colonne spécifique.

    Parameters:
        dataset (dict): Dataset au format JSON-like.
        method (str): Méthode ('default', 'mean', 'median', 'interpolate').
        value (Any): Valeur pour le remplissage si `method='default'`.
        column (str): Colonne spécifique à traiter.
    """
    df = pd.DataFrame(dataset["preview"])
    if column:
        if method == 'default':
            df[column] = df[column].fillna(value)
        elif method == 'mean':
            df[column] = df[column].fillna(df[column].mean())
        elif method == 'median':
            df[column] = df[column].fillna(df[column].median())
        elif method == 'interpolate':
            df[column] = df[column].interpolate(method='linear', limit_direction='forward')
    else:
        if method == 'default':
            df = df.fillna(value)
        elif method == 'mean':
            df = df.fillna(df.mean(numeric_only=True))
        elif method == 'median':
            df = df.fillna(df.median(numeric_only=True))
        elif method == 'interpolate':
            df = df.interpolate(method='time', limit_direction='forward', axis=0)
    return dataframe_to_dict(df)

def dataframe_to_dict(df):
    """
    Convertit un DataFrame en dict JSON-like pour le frontend.
    """
    return {
        "columns": df.columns.tolist(),
        "rows_count": len(df),
        "preview": df.to_dict(orient="records")
    }

