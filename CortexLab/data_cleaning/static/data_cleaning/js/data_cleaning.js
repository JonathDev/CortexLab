// Fonction pour récupérer le CSRF token
function getCsrfToken() {
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfInput) {
        console.log("CSRF token trouvé :", csrfInput.value);
        return csrfInput.value;
    } else {
        console.error("CSRF token introuvable. Assurez-vous que votre formulaire ou page inclut un CSRF token.");
        return null;
    }
}

// Cache pour les datasets
const datasetCache = {};

// Initialisation une fois le DOM entièrement chargé
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM entièrement chargé.");

    // Initialisation des sélections de datasets
    try {
        initDatasetSelection();
    } catch (error) {
        console.error("Erreur lors de l'initialisation des sélections de datasets :", error);
    }

    // Ajout de l'événement pour le bouton "Supprimer Colonnes"
    const deleteColumnsBtn = document.getElementById("delete-columns-btn");
    if (deleteColumnsBtn) {
        deleteColumnsBtn.addEventListener("click", function () {
            const datasetSelector = document.getElementById("dataset-selector");
            const datasetId = datasetSelector ? datasetSelector.value : null;

            if (!datasetId) {
                alert("Veuillez sélectionner un dataset pour gérer les colonnes.");
                console.error("Erreur : Aucun dataset sélectionné.");
                return;
            }

            console.log(`Ouverture de la modal pour suppression des colonnes pour le dataset ID : ${datasetId}`);
            openDeleteColumnsModal(datasetId);
        });
    } else {
        console.warn("Bouton 'Supprimer Colonnes' introuvable dans le DOM.");
    }
});

// Initialisation des sélections de datasets
function initDatasetSelection() {
    console.log("Initialisation des sélections de datasets.");
    const datasetSelector = document.getElementById("dataset-selector");

    if (!datasetSelector) {
        console.warn("Élément #dataset-selector introuvable dans le DOM.");
        return;
    }

    datasetSelector.addEventListener("change", function () {
        const datasetId = this.value;
        if (!datasetId) {
            console.error("Erreur : Aucun dataset sélectionné.");
            return;
        }
        console.log(`Dataset sélectionné : ${datasetId}`);
        loadDatasetDetails(datasetId);
    });
}

// Chargement des détails d'un dataset
function loadDatasetDetails(datasetId) {
    console.log(`Chargement des détails pour le dataset ID : ${datasetId}`);
    
    if (datasetCache[datasetId]) {
        console.log("Dataset trouvé dans le cache :", datasetCache[datasetId]);
        updateDatasetVisualization(datasetCache[datasetId]);
        return;
    }

    fetch(`/data_cleaning/dataset/${datasetId}/`)
        .then(response => {
            if (!response.ok) {
                console.error(`Erreur HTTP : ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log("Données reçues :", data);
                datasetCache[datasetId] = data.data; // Mise à jour du cache
                updateDatasetVisualization(data.data); // Mise à jour de l'affichage
            } else {
                console.error(`Erreur dans la réponse : ${data.error}`);
                alert(`Erreur : ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Erreur réseau :", error);
            alert("Impossible de charger les données du dataset.");
        });
}

// Mise à jour de la visualisation des données
function updateDatasetVisualization(data) {
    console.log("Mise à jour de la visualisation avec les données :", data);

    const visualizationDiv = document.getElementById("dataset-visualization");
    if (!visualizationDiv) {
        console.error("Erreur : Élément #dataset-visualization introuvable.");
        return;
    }

    if (!data.columns || !data.preview) {
        visualizationDiv.innerHTML = `<p>Aucune donnée à afficher pour ce dataset.</p>`;
        return;
    }

    const tableHeaders = data.columns.map(col => `<th>${col}</th>`).join("");
    const tableRows = data.preview.map(row => `
        <tr>${data.columns.map(col => `<td>${row[col] || ''}</td>`).join("")}</tr>
    `).join("");

    visualizationDiv.innerHTML = `
        <h6>Visualisation des Données</h6>
        <p><strong>Nom du dataset :</strong> ${data.name}</p>
        <p><strong>Nombre de lignes :</strong> ${data.rows_count}</p>
        <p><strong>Colonnes :</strong> ${data.columns.join(", ")}</p>
        <table class="table table-bordered">
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;
    console.log("Visualisation mise à jour avec succès.");
}

// Ouvrir la modal de suppression des colonnes
function openDeleteColumnsModal(datasetId) {
    console.log(`Ouverture de la modal pour suppression des colonnes pour le dataset ID : ${datasetId}`);

    const dataset = datasetCache[datasetId];
    if (!dataset) {
        console.error("Erreur : Dataset non trouvé dans le cache.");
        return;
    }

    const columnsContainer = document.getElementById("columns-checkboxes");
    if (!columnsContainer) {
        console.error("Erreur : Élément #columns-checkboxes introuvable.");
        return;
    }

    columnsContainer.innerHTML = "";
    dataset.columns.forEach(column => {
        columnsContainer.innerHTML += `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${column}" id="col-${column}">
                <label class="form-check-label" for="col-${column}">${column}</label>
            </div>
        `;
    });

    const deleteColumnsModal = new bootstrap.Modal(document.getElementById("deleteColumnsModal"));
    deleteColumnsModal.show();
}

// Suppression des colonnes dans le cache
function removeColumnsFromCache(datasetId, columnsToRemove) {
    const dataset = datasetCache[datasetId];
    if (!dataset) {
        console.error("Erreur : Dataset non trouvé dans le cache.");
        return;
    }

    dataset.columns = dataset.columns.filter(col => !columnsToRemove.includes(col));
    dataset.preview = dataset.preview.map(row => {
        const updatedRow = {};
        Object.keys(row).forEach(key => {
            if (!columnsToRemove.includes(key)) {
                updatedRow[key] = row[key];
            }
        });
        return updatedRow;
    });

    console.log("Colonnes supprimées dans le cache :", columnsToRemove);
    updateDatasetVisualization(dataset);
}

// Confirmation de suppression des colonnes
document.getElementById("confirm-delete-columns-btn").addEventListener("click", function () {
    const datasetSelector = document.getElementById("dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        alert("Aucun dataset sélectionné.");
        console.error("Erreur : Aucun dataset sélectionné.");
        return;
    }

    const selectedColumns = Array.from(document.querySelectorAll("#columns-checkboxes .form-check-input:checked"))
        .map(checkbox => checkbox.value);

    if (selectedColumns.length === 0) {
        alert("Veuillez sélectionner au moins une colonne.");
        console.error("Erreur : Aucune colonne sélectionnée pour suppression.");
        return;
    }

    console.log(`Colonnes sélectionnées pour suppression : ${selectedColumns.join(", ")}`);
    removeColumnsFromCache(datasetId, selectedColumns);

    // Fermer la modal
    const deleteColumnsModal = bootstrap.Modal.getInstance(document.getElementById("deleteColumnsModal"));
    deleteColumnsModal.hide();
});




// Gérer l'ouverture de la modal pour suppression des lignes
document.getElementById("delete-rows-btn").addEventListener("click", function () {
    const datasetSelector = document.getElementById("dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        alert("Veuillez sélectionner un dataset pour gérer les lignes.");
        console.error("Erreur : Aucun dataset sélectionné.");
        return;
    }

    console.log(`Ouverture de la modal pour suppression des lignes pour le dataset ID : ${datasetId}`);
    openDeleteRowsModal(datasetId);
});

// Ouvrir la modal pour suppression des lignes
function openDeleteRowsModal(datasetId) {
    console.log(`Ouverture de la modal pour suppression des lignes pour le dataset ID : ${datasetId}`);

    const deleteRowsModal = new bootstrap.Modal(document.getElementById("deleteRowsModal"));
    deleteRowsModal.show();
}

// Supprimer les lignes après validation
document.getElementById("confirm-delete-rows-btn").addEventListener("click", function () {
    const datasetSelector = document.getElementById("dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        alert("Aucun dataset sélectionné.");
        return;
    }

    const startLineInput = document.getElementById("start-line");
    const endLineInput = document.getElementById("end-line");

    const startLine = parseInt(startLineInput.value);
    const endLine = parseInt(endLineInput.value);

    if (isNaN(startLine) || isNaN(endLine) || startLine < 0 || endLine < startLine) {
        alert("Veuillez entrer une plage de lignes valide.");
        return;
    }

    console.log(`Suppression des lignes : de ${startLine} à ${endLine}`);
    removeRowsFromCache(datasetId, startLine, endLine);

    // Fermer la modal
    const deleteRowsModal = bootstrap.Modal.getInstance(document.getElementById("deleteRowsModal"));
    deleteRowsModal.hide();
});

// Suppression des lignes dans le cache
function removeRowsFromCache(datasetId, startLine, endLine) {
    const dataset = datasetCache[datasetId];
    if (!dataset) {
        console.error("Erreur : Dataset non trouvé dans le cache.");
        return;
    }

    dataset.preview = dataset.preview.filter((row, index) => index < startLine || index > endLine);

    console.log(`Lignes supprimées dans le cache : de ${startLine} à ${endLine}`);
    updateDatasetVisualization(dataset);
}

document.getElementById("manage-missing-values-btn").addEventListener("click", function () {
    const datasetSelector = document.getElementById("dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        alert("Veuillez sélectionner un dataset.");
        return;
    }

    const modal = new bootstrap.Modal(document.getElementById("manageMissingValuesModal"));
    modal.show();
});

document.getElementById("manage-missing-values-btn").addEventListener("click", function () {
    const datasetSelector = document.getElementById("dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        alert("Veuillez sélectionner un dataset.");
        return;
    }

    populateColumnSelection(datasetId); // Ajouter les colonnes dans le dropdown
    const modal = new bootstrap.Modal(document.getElementById("manageMissingValuesModal"));
    modal.show();
});

function populateColumnSelection(datasetId) {
    const dataset = datasetCache[datasetId];
    const columnSelection = document.getElementById("column-selection");

    if (!dataset || !dataset.columns) {
        console.error("Erreur : Dataset ou colonnes non trouvés dans le cache.");
        return;
    }

    columnSelection.innerHTML = '<option value="" selected disabled>-- Sélectionnez une colonne --</option>';
    dataset.columns.forEach(column => {
        columnSelection.innerHTML += `<option value="${column}">${column}</option>`;
    });
}

document.getElementById("confirm-manage-missing-values-btn").addEventListener("click", function () {
    const datasetSelector = document.getElementById("dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;
    const selectedAction = document.querySelector('input[name="missing-values-action"]:checked');
    const selectedColumn = document.getElementById("column-selection").value;
    const defaultValue = document.getElementById("default-value").value;

    if (!selectedAction) {
        alert("Veuillez sélectionner une action.");
        return;
    }

    if (!selectedColumn && selectedAction.value.startsWith("fill")) {
        alert("Veuillez sélectionner une colonne pour remplir les valeurs manquantes.");
        return;
    }

    fetch(`/data_cleaning/dataset/${datasetId}/manage_missing_values/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfToken(),
        },
        body: JSON.stringify({
            action: selectedAction.value.startsWith("delete") ? "delete" : "fill",
            axis: selectedAction.value.endsWith("rows") ? "rows" : "columns",
            column: selectedColumn,
            method: selectedAction.value.split("-")[1],
            value: defaultValue || null,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(data.message);
                loadDatasetDetails(datasetId); // Recharger les données après modification
            } else {
                alert(`Erreur : ${data.error}`);
            }
        })
        .catch(error => console.error("Erreur réseau :", error));
});
