function getCsrfToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    if (!csrfToken) {
        console.error("CSRF token introuvable. Assurez-vous que votre formulaire inclut un CSRF token.");
    }
    return csrfToken;
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM entièrement chargé.");

    // Initialisation des sélections de datasets
    try {
        initDatasetSelection();
    } catch (error) {
        console.error("Erreur lors de l'initialisation des sélections de datasets :", error);
    }

    // Initialisation des boutons d'action
    try {
        initActionButtons();
    } catch (error) {
        console.error("Erreur lors de l'initialisation des boutons d'action :", error);
    }

    // Initialisation du bouton "Visualiser"
    const visualizeBtn = document.getElementById("view-dataset-btn");
    if (visualizeBtn) {
        visualizeBtn.addEventListener("click", function () {
            const datasetSelector = document.getElementById("dataset-selector");
            const datasetId = datasetSelector ? datasetSelector.value : null;

            if (!datasetId) {
                alert("Veuillez sélectionner un dataset pour le visualiser.");
                return;
            }

            console.log(`Chargement du dataset complet pour ID : ${datasetId}`);
            loadFullDataset(datasetId);
        });
    } else {
        console.warn("Bouton 'Visualiser' introuvable dans le DOM.");
    }

    // Initialisation du bouton "Supprimer Colonnes"
    const deleteColumnsBtn = document.getElementById("delete-columns-btn");
    if (deleteColumnsBtn) {
        deleteColumnsBtn.addEventListener("click", function () {
            const datasetSelector = document.getElementById("dataset-selector");
            const datasetId = datasetSelector ? datasetSelector.value : null;

            if (!datasetId) {
                alert("Veuillez sélectionner un dataset pour gérer les colonnes.");
                return;
            }

            console.log(`Ouverture de la modal pour suppression des colonnes pour le dataset ID : ${datasetId}`);
            openDeleteColumnsModal(datasetId);
        });
    } else {
        console.warn("Bouton 'Supprimer Colonnes' introuvable dans le DOM.");
    }
});

// Cache pour stocker les données localement
const datasetCache = {};

// Fonction pour initialiser la sélection des datasets
function initDatasetSelection() {
    console.log("Initialisation des sélections de datasets.");
    const datasetSelector = document.getElementById("dataset-selector");

    if (!datasetSelector) {
        console.warn("Élément #dataset-selector introuvable dans le DOM.");
    }

    // Gestion de l'icône "œil"
    const eyeButtons = document.querySelectorAll(".select-dataset-btn");
    if (eyeButtons.length === 0) {
        console.warn("Aucun bouton 'œil' trouvé pour sélectionner un dataset.");
    } else {
        eyeButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const datasetId = this.closest(".dataset-item")?.dataset.id;
                if (!datasetId) {
                    console.error("ID du dataset non trouvé pour le bouton 'œil'.");
                    return;
                }
                console.log(`Clic sur l'icône œil pour le dataset ID : ${datasetId}`);
                loadDatasetDetails(datasetId);
            });
        });
    }

    // Gestion du sélecteur de dataset
    if (datasetSelector) {
        datasetSelector.addEventListener("change", function () {
            const datasetId = this.value;
            if (!datasetId) {
                console.error("Aucun dataset sélectionné dans le dropdown.");
                return;
            }
            console.log(`Dataset sélectionné via le dropdown : ${datasetId}`);
            loadDatasetDetails(datasetId);
        });
    }
}

// Chargement des détails d'un dataset spécifique
async function loadDatasetDetails(datasetId) {
    console.log("Chargement des détails pour le dataset ID :", datasetId);
    if (!datasetId) {
        console.error("Aucun ID de dataset fourni.");
        return;
    }

    if (datasetCache[datasetId]) {
        console.log("Dataset trouvé en cache :", datasetCache[datasetId]);
        updateDatasetVisualization(datasetCache[datasetId]);
        return;
    }

    try {
        const response = await fetch(`/data_cleaning/dataset/${datasetId}/`);
        console.log("Requête envoyée :", response.url);

        if (response.ok) {
            const result = await response.json();
            console.log("Données reçues :", result);

            if (result.success && result.data) {
                datasetCache[datasetId] = result.data;
                console.log("Données mises en cache :", datasetCache[datasetId]);
                updateDatasetVisualization(result.data);
            } else {
                console.error("Erreur dans les données reçues :", result.error);
            }
        } else {
            console.error("Erreur dans la requête API :", response.status);
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
    }
}

// Mise à jour de la visualisation des données
function updateDatasetVisualization(data) {
    console.log("Mise à jour de la section de visualisation avec les données :", data);

    const visualizationDiv = document.getElementById("dataset-visualization");
    if (!visualizationDiv) {
        console.error("Erreur : L'élément #dataset-visualization est introuvable dans le DOM.");
        return;
    }

    if (!data.rows_count || !data.columns || !data.preview) {
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
            <thead>
                <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
    console.log("Visualisation mise à jour avec succès.");
}

// Ouvrir la modal pour supprimer des colonnes
function openDeleteColumnsModal(datasetId) {
    const columnsContainer = document.getElementById("columns-checkboxes");
    columnsContainer.innerHTML = ""; // Vider les colonnes précédentes dans la modal

    if (!datasetCache[datasetId]) {
        console.error("Dataset non trouvé dans le cache. Chargement nécessaire.");
        loadDatasetToCache(datasetId, function () {
            populateDeleteColumnsModal(datasetId);
        });
    } else {
        populateDeleteColumnsModal(datasetId);
    }

    // Afficher la modal
    const deleteColumnsModal = new bootstrap.Modal(document.getElementById("deleteColumnsModal"));
    deleteColumnsModal.show();
}

// Charger les colonnes dans la modal
function populateDeleteColumnsModal(datasetId) {
    console.log(`Population des colonnes pour la suppression dans la modal pour le dataset ID : ${datasetId}`);

    const dataset = datasetCache[datasetId];
    const columnsContainer = document.getElementById("columns-checkboxes");

    dataset.columns.forEach((column) => {
        const checkboxHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${column}" id="col-${column}">
                <label class="form-check-label" for="col-${column}">${column}</label>
            </div>
        `;
        columnsContainer.innerHTML += checkboxHTML;
    });
}

// Confirmation de suppression des colonnes
document.getElementById("confirm-delete-columns-btn").addEventListener("click", function () {
    const datasetSelector = document.getElementById("dataset-selector");
    const datasetId = datasetSelector ? datasetSelector.value : null;

    if (!datasetId) {
        alert("Aucun dataset sélectionné.");
        return;
    }

    const selectedColumns = Array.from(document.querySelectorAll("#columns-checkboxes .form-check-input:checked")).map(checkbox => checkbox.value);

    if (selectedColumns.length === 0) {
        alert("Veuillez sélectionner au moins une colonne à supprimer.");
        return;
    }

    console.log(`Colonnes sélectionnées pour suppression : ${selectedColumns.join(", ")}`);

    // Suppression des colonnes dans le cache
    if (datasetCache[datasetId]) {
        datasetCache[datasetId].columns = datasetCache[datasetId].columns.filter(col => !selectedColumns.includes(col));

        datasetCache[datasetId].rows = datasetCache[datasetId].rows.map(row => {
            const updatedRow = {};
            Object.keys(row).forEach(key => {
                if (!selectedColumns.includes(key)) {
                    updatedRow[key] = row[key];
                }
            });
            return updatedRow;
        });

        // Mise à jour de la visualisation
        updateDatasetVisualization(datasetCache[datasetId]);

        // Ajouter une action dans "Actions Entreprises"
        const actionLogList = document.getElementById("action-log-list");
        const actionItem = `<li>Suppression des colonnes : ${selectedColumns.join(", ")}</li>`;
        actionLogList.innerHTML += actionItem;

        // Fermer la modal
        const deleteColumnsModal = bootstrap.Modal.getInstance(document.getElementById("deleteColumnsModal"));
        deleteColumnsModal.hide();
    } else {
        console.error("Erreur : Dataset non trouvé dans le cache.");
    }
});

// Charger un dataset dans le cache
function loadDatasetToCache(datasetId, callback) {
    fetch(`/data_cleaning/dataset/${datasetId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                datasetCache[datasetId] = data.data;
                console.log(`Dataset ID ${datasetId} chargé dans le cache.`);
                if (callback) callback();
            } else {
                console.error(`Erreur lors du chargement du dataset : ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Erreur réseau lors du chargement du dataset :", error);
        });
}
