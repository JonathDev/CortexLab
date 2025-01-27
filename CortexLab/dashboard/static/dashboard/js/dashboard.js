document.addEventListener("DOMContentLoaded", function () {
    /**
     * Récupère le token CSRF depuis les cookies.
     * @returns {string|null} Le token CSRF ou `null` s'il est introuvable.
     */
    function getCSRFToken() {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "csrftoken") {
                return value;
            }
        }
        return null;
    }

    /**
     * Ajoute dynamiquement une carte de dataset dans l'interface.
     * @param {Object} dataset - Les données du dataset renvoyé par le backend.
     */
    function addDatasetCard(dataset) {
        const container = document.querySelector(".row.g-3");
        if (!container) {
            console.error("Container des datasets introuvable.");
            return;
        }

        const card = `
            <div class="col-md-4 dataset-card-container" data-id="${dataset.id}">
                <div class="card dataset-card shadow-sm h-100">
                    <div class="card-header text-center">
                        <h5 class="card-title mb-0">${dataset.name}</h5>
                    </div>
                    <div class="card-body text-center">
                        <img src="/static/dashboard/icons/dataset-icon.webp" alt="Dataset Icon" class="img-fluid mb-2" style="max-height: 60px;">
                        <p class="mb-1"><small>Date : ${dataset.uploaded_at || "Non disponible"}</small></p>
                        <p class="mb-0"><small>Colonnes : ${dataset.columns.length || 0}</small></p>
                    </div>
                    <div class="card-footer d-flex justify-content-between align-items-center bg-light">
                        <!-- Case à cocher -->
                        <label class="form-check-label d-flex align-items-center mb-0">
                            <input 
                                type="checkbox" 
                                class="form-check-input dataset-checkbox me-2" 
                                data-id="${dataset.id}"
                                title="Sélectionner pour analyse">
                            <i class="bi bi-eye text-primary" style="font-size: 1.2rem;"></i>
                        </label>
                        <!-- Bouton Supprimer -->
                        <form class="delete-dataset-form mb-0" method="POST" action="/dashboard/projets/${document.getElementById('project-container').dataset.projectId}/delete_dataset/">
                            <input type="hidden" name="dataset_id" value="${dataset.id}">
                            <button type="submit" class="btn btn-danger btn-sm" title="Supprimer">
                                <i class="bi bi-trash" style="font-size: 1.2rem;"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>`;
        
        container.insertAdjacentHTML("beforeend", card);
    }

    const selectedDatasets = [];
    const analyzeButton = document.querySelector("#analyze-btn");
    const projectId = document.querySelector("#project-container").dataset.projectId;

    if (!analyzeButton || !projectId) {
        console.error("Le bouton 'Analyser' ou l'ID du projet est introuvable.");
        return;
    }

    // Gestion de la sélection des datasets
    document.querySelectorAll(".dataset-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
            const datasetId = this.dataset.id;
            const datasetName = this.closest(".card").querySelector(".card-title").textContent.trim();

            if (this.checked) {
                selectedDatasets.push({ id: datasetId, name: datasetName });
            } else {
                const index = selectedDatasets.findIndex(ds => ds.id === datasetId);
                if (index > -1) selectedDatasets.splice(index, 1);
            }

            console.log("Datasets sélectionnés :", selectedDatasets);
        });
    });

    // Bouton "Analyser" : Mise à jour de la session via le backend
    analyzeButton.addEventListener("click", function () {
        if (selectedDatasets.length === 0) {
            alert("Veuillez sélectionner au moins un dataset pour analyser.");
            return;
        }

        const url = `/dashboard/projets/${projectId}/prepare_analyze/`;

        fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ selected_datasets: selectedDatasets.map(ds => ds.id) }),
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Erreur lors de la préparation de l'analyse.");
                }
            })
            .then(data => {
                if (data.redirect_url) {
                    window.location.href = data.redirect_url; // Redirection
                } else {
                    alert("Aucune redirection définie par le serveur.");
                }
            })
            .catch(error => {
                console.error("Erreur réseau :", error);
                alert("Erreur réseau, veuillez réessayer.");
            });
    });
});



