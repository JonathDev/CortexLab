// Fonction pour récupérer le CSRF token depuis les cookies
function getCSRFToken() {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "csrftoken") {
            return value;
        }
    }
    return null;
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript chargé avec succès !");

    // ---- Gestion de l'uploadForm ----
    document.addEventListener("submit", async function (event) {
        const form = event.target;

        if (form.id === "uploadForm") {
            event.preventDefault(); // Bloque la redirection
            console.log("Soumission interceptée depuis le formulaire :", form.id);

            const formData = new FormData(form);
            const url = form.action; // Utilise l'attribut action du formulaire

            console.log("Données envoyées :", Array.from(formData.entries()));
            console.log("URL de la requête :", url);

            try {
                const response = await fetch(url, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Réponse JSON :", data);
                    addDatasetCard(data.dataset);
                    showSuccessMessage("Fichier téléchargé avec succès !");
                } else {
                    const errorText = await response.text();
                    console.error("Erreur lors de l'envoi :", errorText);
                    showErrorMessage("Une erreur s'est produite lors de l'analyse des données.");
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                showErrorMessage("Erreur réseau : Veuillez réessayer plus tard.");
            }
        }
    });

    // ---- Ajouter dynamiquement une carte de dataset ----
    function addDatasetCard(dataset) {
        const datasetsContainer = document.querySelector(".row.g-3");
        if (!datasetsContainer) {
            console.error("Container des datasets introuvable.");
            return;
        }
         // Récupérer l'ID du projet depuis le DOM
        const projectId = document.getElementById("project-container").dataset.projectId;

            // Construire la carte avec l'URL d'action correcte
    const card = `
    <div class="col-md-4">
        <div class="card dataset-card shadow-sm">
            <div class="row g-0 align-items-center">
                <div class="col-3 text-center">
                    <img src="/static/dashboard/icons/dataset-icon.webp" alt="Dataset Icon" class="img-fluid dataset-icon">
                </div>
                <div class="col-9">
                    <div class="card-body">
                        <h6 class="card-title">${dataset.name}</h6>
                        <p class="card-text"><small>Date : ${dataset.uploaded_at}</small></p>
                        <p class="card-text"><small>Colonnes : ${dataset.columns.length}</small></p>
                        <form class="delete-dataset-form" method="POST" action="/dashboard/projets/${projectId}/delete_dataset/">
                            <input type="hidden" name="dataset_id" value="${dataset.id}">
                            <button type="submit" class="btn btn-danger btn-sm">Supprimer</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

datasetsContainer.insertAdjacentHTML("beforeend", card);

    }

    // ---- Afficher un message de succès ----
    function showSuccessMessage(message) {
        console.log("Message de succès :", message);
        alert(message);
    }

    // ---- Afficher un message d'erreur ----
    function showErrorMessage(message) {
        console.error("Message d'erreur :", message);
        alert(message);
    }

 
    // Fonction pour récupérer le CSRF token depuis les cookies
    function getCSRFToken() {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "csrftoken") {
                return value;
            }
        }
        return null;
    }

    

   
    document.body.addEventListener("submit", async function (event) {
        const form = event.target;

        if (form.classList.contains("delete-dataset-form")) {
            event.preventDefault(); // Bloque la soumission normale
            console.log("Formulaire de suppression intercepté.");

            const formData = new FormData(form);
            const datasetId = formData.get("dataset_id");
            const url = form.action;

            console.log(`Suppression du dataset avec ID : ${datasetId}`);
            console.log(`URL : ${url}`);

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                    },
                    body: formData,
                });

                if (response.ok) {
                    console.log("Dataset supprimé avec succès.");
                    form.closest(".dataset-card").remove(); // Supprime la carte
                } else {
                    const errorText = await response.text();
                    console.error("Erreur :", errorText);
                    alert("Une erreur est survenue lors de la suppression.");
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                alert("Erreur réseau. Veuillez réessayer.");
            }
        }
    });

    function getCSRFToken() {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "csrftoken") {
                return value;
            }
        }
        return null;
    }


     // ---- Gestion des cases à cocher avec l'icône d'œil ----
     const selectedDatasets = [];
     document.querySelectorAll('.dataset-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            const datasetId = checkbox.dataset.id;

            if (checkbox.checked) {
                if (!selectedDatasets.includes(datasetId)) {
                    selectedDatasets.push(datasetId);
                }
            } else {
                const index = selectedDatasets.indexOf(datasetId);
                if (index > -1) selectedDatasets.splice(index, 1);
            }

            console.log("Datasets sélectionnés :", selectedDatasets);
        });
    });

    // ---- Gestion du bouton Analyser ----
    const analyzeButton = document.getElementById('analyze-btn');
    analyzeButton.addEventListener('click', () => {
        if (selectedDatasets.length === 0) {
            alert("Veuillez sélectionner au moins un dataset pour analyser.");
            return;
        }

        // Redirection vers la page d'analyse avec les IDs des datasets
        const url = `/data_cleaning/?datasets=${selectedDatasets.join(",")}`;
        console.log("Redirection vers :", url); // Log de débogage
        window.location.href = url;
    });
});
