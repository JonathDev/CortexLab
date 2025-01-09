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
