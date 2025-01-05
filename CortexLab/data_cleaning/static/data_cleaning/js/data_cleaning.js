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
});

const datasetCache = {}; // Cache des datasets

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

    // Construire l'entête du tableau
    const tableHeaders = data.columns.map(col => `<th>${col}</th>`).join("");

    // Construire les lignes du tableau
    const tableRows = data.preview.map(row => `
        <tr>${data.columns.map(col => `<td>${row[col] || ''}</td>`).join("")}</tr>
    `).join("");

    // Mettre à jour le contenu HTML de la visualisation
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

async function loadFullDataset(datasetId) {
    console.log(`Tentative de chargement complet pour dataset ID : ${datasetId}`);

    const container = document.getElementById("full-dataset-container");
    if (!container) {
        console.error("Erreur : L'élément #full-dataset-container est introuvable dans le DOM.");
        return;
    }

    try {
        const response = await fetch(`/data_cleaning/dataset/full/${datasetId}/`);
        console.log("Requête envoyée :", response.url);

        if (response.ok) {
            const result = await response.json();
            console.log("Données reçues :", result);

            if (result.success && result.columns && result.rows) {
                // Construire la table pour afficher les données
                let tableHTML = `<table class="table table-bordered"><thead><tr>`;
                result.columns.forEach(col => {
                    tableHTML += `<th>${col}</th>`;
                });
                tableHTML += `</tr></thead><tbody>`;
                result.rows.forEach(row => {
                    tableHTML += `<tr>`;
                    result.columns.forEach(col => {
                        tableHTML += `<td>${row[col] || ""}</td>`;
                    });
                    tableHTML += `</tr>`;
                });
                tableHTML += `</tbody></table>`;
                container.innerHTML = tableHTML;
                console.log("Données affichées dans la modale avec succès.");
            } else {
                console.error("Erreur dans les données reçues :", result.error);
                container.innerHTML = `<p class="text-danger">Erreur : Les données sont incomplètes ou corrompues.</p>`;
            }
        } else {
            console.error("Erreur dans la requête API :", response.status);
            container.innerHTML = `<p class="text-danger">Erreur lors du chargement des données.</p>`;
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        container.innerHTML = `<p class="text-danger">Erreur réseau. Veuillez réessayer.</p>`;
    }
}
