"""
import pandas as pd
import json

def get_cached_dataset(dataset_id, cache):
    
    #Récupère un dataset depuis le cache.
    
    print(f"Requête pour récupérer le dataset {dataset_id} depuis le cache...")
    dataset = cache.get(dataset_id)
    if dataset:
        print(f"Dataset {dataset_id} trouvé dans le cache.")
    else:
        print(f"Dataset {dataset_id} introuvable dans le cache.")
    return dataset


def load_dataset_to_cache(project, dataset_id, cache):
    
    #Charge un dataset depuis MongoDB dans le cache.
   
    print(f"Tentative de chargement du dataset {dataset_id} dans le cache...")
    for dataset in project.datasets:
        if dataset.id == dataset_id:
            print(f"Dataset trouvé : {dataset.name}")
            dataset_data = {
                "name": dataset.name,
                "columns": [col.name for col in dataset.columns],
                "rows_count": len(dataset.columns[0].values) if dataset.columns else 0,
                "data": [
                    {col.name: col.values[i] for col in dataset.columns}
                    for i in range(len(dataset.columns[0].values)) if dataset.columns
                ],
            }
            cache[dataset_id] = dataset_data
            print(f"Dataset {dataset_id} chargé dans le cache avec succès.")
            return dataset_data
    print(f"Erreur : Dataset {dataset_id} introuvable dans le projet.")
    raise ValueError(f"Dataset {dataset_id} introuvable dans le projet.")
"""